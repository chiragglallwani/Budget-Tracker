#
# 1. User & Authentication serializers
#

from rest_framework import serializers
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from calendar import month_name
from .models import Category, Expense, Income, Budget


User = get_user_model()

class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for fetching user details.
    Read-only serializer that excludes sensitive information like password.
    """
    class Meta:
        model = User
        fields = ("id", "email", "username", "date_joined", "last_login")
        read_only_fields = ("id", "email", "username", "date_joined", "last_login")


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Custom serializer for registration (Sign Up).
    Handles password validation and user creation with hashing.
    Accepts email and password, sets username = email automatically.
    """
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    refresh_token = serializers.CharField(read_only=True)
    email = serializers.EmailField(required=True)

    class Meta:
        model = User
        fields = ("id", "email", "password", "refresh_token") 
        read_only_fields = ("id", "refresh_token", "username")
        
        extra_kwargs = {
            "email": {"required": True, "allow_blank": False},
        }

    def validate_email(self, value):
        """Validate that email is unique."""
        email = value.lower()
        User = get_user_model()
        queryset = User.objects.filter(email=email)
        
        # If updating, exclude current instance
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A user with this email already exists.")
        
        return email

    def validate_password(self, value):
        """Run Django's password validation."""
        # During creation, self.instance is None, so pass None to validate_password
        validate_password(value, user=self.instance if self.instance else None)
        return value

    def create(self, validated_data):
        """Create and return a new user with hashed password."""
        password = validated_data.pop("password")
        email = validated_data.pop("email").lower()
        
        # Set username = email
        validated_data["username"] = email
        
        user = User.objects.create(email=email, **validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that accepts email instead of username.
    Converts email to username for authentication (since username = email).
    Includes username in the token payload.
    """
    email = serializers.EmailField(required=True, write_only=True)
    username = serializers.CharField(required=False, read_only=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Make username optional/read-only since we'll derive it from email
        self.fields['username'].required = False
        self.fields['username'].read_only = True

    def validate(self, attrs):
        # Get email from attrs
        email = attrs.get('email', '').lower()
        password = attrs.get('password')
        
        if not email or not password:
            raise serializers.ValidationError("Email and password are required.")
        
        # Find user by email (username = email)
        User = get_user_model()
        try:
            user = User.objects.get(email=email)
            # Replace email with username for authentication
            attrs['username'] = user.username
            attrs.pop('email', None)
        except User.DoesNotExist:
            # Raise AuthenticationFailed to return 401 instead of 400
            raise AuthenticationFailed("No active account found with the given credentials.")
        
        # Call parent validate with username
        return super().validate(attrs)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims - include username in token
        token['username'] = user.username
        return token


#
# 2. Category serializer
#

class CategorySerializer(serializers.ModelSerializer):
    """
    Serializer for the Category model.
    The 'user' field is implicitly handled by the ViewSet.
    """
    class Meta:
        model = Category
        fields = ("id", "name", "is_income")
        read_only_fields = ("id",)

    def validate(self, data):
        """
        Custom validation to ensure 'name' is unique for the user.
        during creation or update.
        """
        request = self.context.get("request")
        user = request.user
        name = data.get("name")

        queryset = Category.objects.filter(user=user, name__iexact=name)

        if self.instance:
            queryset = queryset.exclude(id=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("A category with this name already exists.")
        
        return data


#
# 3 Income & Expense serializers
#

class IncomeExpenseBaseSerializer(serializers.ModelSerializer):
    """
    Base serializer for Income and Expense models.
    Handles common fields and validation.
    """
    category_id = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), source="category", write_only=True)
    
    category = CategorySerializer(read_only=True)

    is_income_entry = serializers.SerializerMethodField()

    class Meta:
        fields = ['id', 'category', 'category_id', 'amount', 'date', 'note', 'created_at', 'is_income_entry']
        read_only_fields = ['id', 'created_at']

    def get_is_income_entry(self, obj):
        return isinstance(obj, Income)

    def validate(self, attrs):
        """
        Custom validation to ensure 'amount' is greater than 0 and category matches entry type.
        """
        request = self.context.get("request")
        user = request.user
        category = attrs.get("category")
        amount = attrs.get("amount")
        
        if category.user != user:
            raise serializers.ValidationError("You are not authorized to access this category.")

        # Validate amount is positive
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0."})

        # Check if this is an Income or Expense serializer based on the model
        is_income_entry = self.Meta.model == Income

        if is_income_entry and not category.is_income:
            raise serializers.ValidationError({"category_id": "The selected category must be an Income category."})
        elif not is_income_entry and category.is_income:
            raise serializers.ValidationError({"category_id": "The selected category must be an Expense category."})
            
        return attrs

class IncomeSerializer(IncomeExpenseBaseSerializer):
    """
    Serializer for the Income model.
    """
    class Meta(IncomeExpenseBaseSerializer.Meta):
        model = Income
        fields = IncomeExpenseBaseSerializer.Meta.fields
        read_only_fields = IncomeExpenseBaseSerializer.Meta.read_only_fields

class ExpenseSerializer(IncomeExpenseBaseSerializer):
    """
    Serializer for the Expense model.
    """
    class Meta(IncomeExpenseBaseSerializer.Meta):
        model = Expense
        fields = IncomeExpenseBaseSerializer.Meta.fields
        read_only_fields = IncomeExpenseBaseSerializer.Meta.read_only_fields


#
# 4. Budget serializer
#

class BudgetSerializer(serializers.ModelSerializer):
    """
    Serializer for the Budget model.
    """
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source="category",
        write_only=True,
        required=True,
        allow_null=False
    )
    category = CategorySerializer(read_only=True)

    class Meta:
        model = Budget
        fields = ['id', 'category', 'category_id', 'year', 'month', 'amount', 'created_at']

        read_only_fields = ['id', 'created_at']

    def validate(self, attrs):
        """
        Custom validation to ensure:
        - Category is required and is an expense category (is_income=False)
        - Amount is greater than 0
        - Month/year are valid
        - Only one budget per category per month exists
        """
        request = self.context.get("request")
        user = request.user
        year = attrs.get("year")
        month = attrs.get("month")
        amount = attrs.get("amount")
        category = attrs.get("category")
        
        # Category is required
        if not category:
            raise serializers.ValidationError({"category_id": "Category is required for budgets."})
        
        # Validate category belongs to user
        if category.user != user:
            raise serializers.ValidationError({"category_id": "You are not authorized to access this category."})
        
        # Validate category is an expense category
        if category.is_income:
            raise serializers.ValidationError({"category_id": "Budget can only be associated with expense categories (is_income=False)."})
        
        # Validate amount is positive
        if amount is not None and amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than 0."})
        
        if month is None or year is None:
            return attrs
        
        if not (1 <= month <= 12):
            raise serializers.ValidationError({"month": "Invalid month. Must be between 1 and 12."})
        
        if not (2000 <= year <= 2100):
            raise serializers.ValidationError({"year": "Invalid year. Must be between 2000 and 2100."})
        
        # Check for duplicate budget: same user, category, year, and month
        queryset = Budget.objects.filter(user=user, category=category, year=year, month=month)

        if self.instance:
            queryset = queryset.exclude(id=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({
                "non_field_errors": [f"A budget for category '{category.name}' in {month_name[month]} {year} already exists."]
            })

        return attrs

# 5 Financial Summary serializer

class BudgetStatSerializer(serializers.Serializer):
    """Serializer for budget statistics per month."""
    date = serializers.CharField()  # Format: "Month Year" e.g., "November 2025"
    totalBudget = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalExpense = serializers.DecimalField(max_digits=12, decimal_places=2)


class IncomeCategorySerializer(serializers.Serializer):
    """Serializer for income category totals."""
    category = serializers.CharField()
    totalincome = serializers.DecimalField(max_digits=12, decimal_places=2)


class ExpenseCategorySerializer(serializers.Serializer):
    """Serializer for expense category totals."""
    category = serializers.CharField()
    totalincome = serializers.DecimalField(max_digits=12, decimal_places=2)  # Note: named totalincome but represents total expense


class FinancialSummarySerializer(serializers.Serializer):
    """
    Serializer for the financial summary.
    """
    budgetStats = BudgetStatSerializer(many=True)
    incomeCategories = IncomeCategorySerializer(many=True)
    expenseCategories = ExpenseCategorySerializer(many=True)
    totalSaving = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalEarning = serializers.DecimalField(max_digits=12, decimal_places=2)
    totalExpenses = serializers.DecimalField(max_digits=12, decimal_places=2)

# 6 Transaction Serializer

class TransactionSerializer(serializers.Serializer):
    """Serializer for unified transaction (Income/Expense) response."""
    id = serializers.IntegerField()
    note = serializers.CharField()
    category = serializers.CharField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    date = serializers.DateField()
    is_income = serializers.BooleanField()


# 7 Budget Management Serializer

class BudgetManagementSerializer(serializers.Serializer):
    """Serializer for budget management data per category."""
    category = serializers.CharField()
    budgetAmt = serializers.DecimalField(max_digits=12, decimal_places=2)
    expenseAmt = serializers.DecimalField(max_digits=12, decimal_places=2)

