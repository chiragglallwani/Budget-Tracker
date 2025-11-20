from datetime import date, datetime
from decimal import Decimal
from django.db.models import Sum, Q
from django.db.models.functions import Coalesce
from calendar import month_name
from rest_framework.generics import CreateAPIView, RetrieveAPIView, ListAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from finance.models import Budget, Category, Expense, Income
from finance.serializers import (
    BudgetSerializer, CategorySerializer, ExpenseSerializer, FinancialSummarySerializer, 
    IncomeSerializer, UserRegistrationSerializer, CustomTokenObtainPairSerializer,
    UserDetailSerializer, TransactionSerializer, BudgetManagementSerializer
)
from finance.utils import success_response, error_response

User = get_user_model()


class UserRegisterView(CreateAPIView):
    """
    Endpoint for user registration. Uses the custom UserRegistrationSerializer.
    Returns access_token and refresh_token upon successful registration.
    Stores refresh_token in the User model.
    This is an OPEN endpoint (AllowAny).
    """
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Store refresh_token in the user model
        user.refresh_token = refresh_token
        user.save()
        
        # Return standardized success response
        return success_response(
            data={
                'user': {
                    'username': user.username,
                    'email': user.email,
                },
                'access_token': access_token,
                'refresh_token': refresh_token,
            },
            message='User registered successfully',
            status_code=status.HTTP_201_CREATED
        )


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom login view that accepts email and password.
    Stores refresh_token in the User model upon successful authentication.
    Uses CustomTokenObtainPairSerializer to include username in JWT token.
    Returns access, refresh tokens and user email.
    """
    serializer_class = CustomTokenObtainPairSerializer
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get email from request
            email = request.data.get('email', '').lower()
            if email:
                try:
                    user = User.objects.get(email=email)
                    # Extract refresh_token from response
                    refresh_token = response.data.get('refresh')
                    if refresh_token:
                        # Store refresh_token in the user model
                        user.refresh_token = refresh_token
                        user.save()
                    
                    # Transform response to standardized format
                    return success_response(
                        data={
                            'access': response.data.get('access'),
                            'refresh': response.data.get('refresh'),
                            'user': {
                                'email': user.email
                            }
                        },
                        message='Login successful'
                    )
                except User.DoesNotExist:
                    pass
        
        # If response is not 200, return as-is (will be handled by exception handler)
        return response


class CustomTokenRefreshView(TokenRefreshView):
    """
    Custom token refresh view that stores the new refresh_token in the User model
    upon successful token refresh.
    """
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Extract the refresh token from request to get user_id
            refresh_token_str = request.data.get('refresh')
            if refresh_token_str:
                try:
                    # Decode the refresh token to get user_id
                    refresh_token = RefreshToken(refresh_token_str)
                    # Access user_id from token payload
                    user_id = refresh_token.payload.get('user_id') or refresh_token.get('user_id')
                    
                    if user_id:
                        try:
                            user = User.objects.get(id=user_id)
                            # Extract new refresh_token from response
                            new_refresh_token = response.data.get('refresh')
                            if new_refresh_token:
                                # Store new refresh_token in the user model
                                user.refresh_token = new_refresh_token
                                user.save()
                        except User.DoesNotExist:
                            pass
                except (TokenError, KeyError, AttributeError):
                    pass
            
            # Transform response to standardized format
            return success_response(
                data={
                    'access': response.data.get('access'),
                    'refresh': response.data.get('refresh'),
                },
                message='Token refreshed successfully'
            )
        
        # If response is not 200, return as-is (will be handled by exception handler)
        return response


class CustomLogoutView(APIView):
    """
    Custom logout view that clears the refresh_token from the database.
    Optionally blacklists the refresh token if provided.
    Requires authentication.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        
        # Clear refresh_token from database
        user.refresh_token = None
        user.save()
        
        # Optionally blacklist the refresh token if provided
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                # Token is already blacklisted or invalid, ignore
                pass
        
        return success_response(
            message='Successfully logged out. Refresh token cleared.'
        )


class UserDetailView(RetrieveAPIView):
    """
    Endpoint to fetch user details by user ID.
    Requires authentication.
    Returns user information excluding sensitive data like password.
    """
    serializer_class = UserDetailSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()
    lookup_field = 'id'
    lookup_url_kwarg = 'user_id'

    def get_object(self):
        """
        Retrieve user by ID from the URL parameter.
        """
        user_id = self.kwargs.get('user_id')
        return get_object_or_404(User, id=user_id)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Override retrieve to return standardized response format.
        """
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(
            data=serializer.data,
            message='User details retrieved successfully'
        )


class OwnerModelViewSet(ModelViewSet):
    """
    A base ViewSet that automatically filters the queryset by the current user
    and sets the 'user' field on creation/update.
    Also formats all responses to standardized format.
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filters the queryset to only include objects owned by the current user."""
        # Ensure the user is authenticated before filtering (though IsAuthenticated should catch unauth)
        if self.request.user.is_authenticated:
            return self.queryset.filter(user=self.request.user)
        # Return an empty queryset for safety if somehow unauthenticated
        return self.queryset.none()

    def perform_create(self, serializer):
        """Sets the user field automatically on creation."""
        # Since IsAuthenticated is used, user is guaranteed to be present
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        """Sets the user field automatically on update (in case it was excluded from data)."""
        serializer.save(user=self.request.user)
    
    def list(self, request, *args, **kwargs):
        """Override list to return standardized response."""
        response = super().list(request, *args, **kwargs)
        return success_response(
            data=response.data,
            message='Items retrieved successfully'
        )
    
    def create(self, request, *args, **kwargs):
        """Override create to return standardized response."""
        response = super().create(request, *args, **kwargs)
        return success_response(
            data=response.data,
            message='Item created successfully',
            status_code=status.HTTP_201_CREATED
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to return standardized response."""
        response = super().retrieve(request, *args, **kwargs)
        return success_response(
            data=response.data,
            message='Item retrieved successfully'
        )
    
    def update(self, request, *args, **kwargs):
        """Override update to return standardized response."""
        response = super().update(request, *args, **kwargs)
        return success_response(
            data=response.data,
            message='Item updated successfully'
        )
    
    def partial_update(self, request, *args, **kwargs):
        """Override partial_update to return standardized response."""
        response = super().partial_update(request, *args, **kwargs)
        return success_response(
            data=response.data,
            message='Item updated successfully'
        )
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to return standardized response."""
        super().destroy(request, *args, **kwargs)
        return success_response(
            message='Item deleted successfully',
            status_code=status.HTTP_200_OK
        )

# ------------------------------------------------------------
# 1. Category ViewSet
# ------------------------------------------------------------

class CategoryViewSet(OwnerModelViewSet):
    """
    Allows CRUD operations for Category.
    Includes filtering by is_income.
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    pagination_class = None

    def get_queryset(self):
        """
        Filters by user and optionally by the 'is_income' query parameter.
        /api/categories/?is_income=true  -> Income categories
        /api/categories/?is_income=false -> Expense categories
        """
        queryset = super().get_queryset()
        
        is_income_param = self.request.query_params.get('is_income')
        if is_income_param is not None:
            # Convert string parameter to boolean
            is_income = is_income_param.lower() in ['true', '1']
            queryset = queryset.filter(is_income=is_income)
            
        return queryset

# ------------------------------------------------------------
# 2. Income ViewSet
# ------------------------------------------------------------

class IncomeViewSet(OwnerModelViewSet):
    """Allows CRUD operations for Income entries."""
    queryset = Income.objects.all()
    serializer_class = IncomeSerializer
    pagination_class = None

# ------------------------------------------------------------
# 3. Expense ViewSet
# ------------------------------------------------------------

class ExpenseViewSet(OwnerModelViewSet):
    """Allows CRUD operations for Expense entries."""
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    pagination_class = None


# ------------------------------------------------------------
# 4. Budget ViewSet
# ------------------------------------------------------------

class BudgetViewSet(OwnerModelViewSet):
    """Allows CRUD operations for monthly Budget entries."""
    queryset = Budget.objects.all()
    serializer_class = BudgetSerializer
    pagination_class = None

    def get_queryset(self):
        """Allows filtering budgets by year and month."""
        queryset = super().get_queryset()
        
        year = self.request.query_params.get('year')
        month = self.request.query_params.get('month')

        if year:
            try:
                queryset = queryset.filter(year=int(year))
            except ValueError:
                pass # Ignore if year is not an integer
        
        if month:
            try:
                queryset = queryset.filter(month=int(month))
            except ValueError:
                pass # Ignore if month is not an integer

        return queryset

# ------------------------------------------------------------
# 5. Financial Summary View
# ------------------------------------------------------------

class FinancialSummaryView(APIView):
    """
    Calculates and returns the user's financial summary including:
    - Budget stats for last 7 months
    - Income and expense categories with totals
    - Total saving, earning, and expenses
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        today = date.today()
        
        # --- 1. Calculate Total Income and Expense (All Time) ---
        total_income = Income.objects.filter(user=user).exclude(category__name='Balance').aggregate(
            sum=Coalesce(Sum('amount'), Decimal('0.00'))
        )['sum']
        
        total_expense = Expense.objects.filter(user=user).aggregate(
            sum=Coalesce(Sum('amount'), Decimal('0.00'))
        )['sum']
        
        total_saving = total_income - total_expense

        budget_stats = []
        current_year = today.year
        current_month = today.month
        
        for i in range(7):
            target_month = current_month - i
            target_year = current_year
            
            # Handle year rollover
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            
            total_budget = Budget.objects.filter(
                user=user,
                year=target_year,
                month=target_month
            ).aggregate(
                sum=Coalesce(Sum('amount'), Decimal('0.00'))
            )['sum']
            
            # Get total expenses for this month
            total_expense_month = Expense.objects.filter(
                user=user,
                date__year=target_year,
                date__month=target_month
            ).aggregate(
                sum=Coalesce(Sum('amount'), Decimal('0.00'))
            )['sum']
            
            date_str = f"{month_name[target_month]} {target_year}"
            
            budget_stats.append({
                'date': date_str,
                'totalBudget': total_budget,
                'totalExpense': total_expense_month,
            })
        
        # Reverse to show oldest to newest
        budget_stats.reverse()

        # --- 3. Calculate Income Categories with Totals ---
        income_categories = Income.objects.filter(user=user).exclude(category__name='Balance').values('category__name').annotate(
            totalincome=Coalesce(Sum('amount'), Decimal('0.00'))
        ).order_by('category__name')
        
        income_categories_list = [
            {
                'category': item['category__name'],
                'totalincome': item['totalincome']
            }
            for item in income_categories
        ]

        expense_categories = Expense.objects.filter(user=user).values('category__name').annotate(
            totalincome=Coalesce(Sum('amount'), Decimal('0.00'))
        ).order_by('category__name')
        
        expense_categories_list = [
            {
                'category': item['category__name'],
                'totalincome': item['totalincome']
            }
            for item in expense_categories
        ]

        data = {
            'budgetStats': budget_stats,
            'incomeCategories': income_categories_list,
            'expenseCategories': expense_categories_list,
            'totalSaving': total_saving,
            'totalEarning': total_income,
            'totalExpenses': total_expense,
        }
        
        serializer = FinancialSummarySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        return success_response(
            data=serializer.validated_data,
            message='Financial summary retrieved successfully'
        )

# ------------------------------------------------------------
# 6. Transaction List View
# ------------------------------------------------------------

class TransactionPagination(PageNumberPagination):
    """Custom pagination for transactions."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TransactionView(ListAPIView):
    """
    Endpoint to list all transactions (Income and Expense) with pagination and filtering.
    Supports filtering by:
    - date: Filter by specific date (YYYY-MM-DD) or date range (date_from, date_to)
    - category: Filter by category name
    - amount: Filter by amount range (amount_min, amount_max)
    - is_income: Filter by transaction type (true for income, false for expense)
    """
    permission_classes = [IsAuthenticated]
    serializer_class = TransactionSerializer
    pagination_class = TransactionPagination

    def get_queryset(self):
        """Combine Income and Expense querysets and apply filters."""
        user = self.request.user
        
        # Get filter parameters
        date_param = self.request.query_params.get('date')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        category = self.request.query_params.get('category')
        amount_min = self.request.query_params.get('amount_min')
        amount_max = self.request.query_params.get('amount_max')
        is_income_param = self.request.query_params.get('is_income')
        
        # Build base querysets
        income_queryset = Income.objects.filter(user=user).exclude(category__name='Balance').select_related('category')
        expense_queryset = Expense.objects.filter(user=user).select_related('category')
        
        # Apply date filters
        if date_param:
            try:
                filter_date = datetime.strptime(date_param, '%Y-%m-%d').date()
                income_queryset = income_queryset.filter(date=filter_date)
                expense_queryset = expense_queryset.filter(date=filter_date)
            except ValueError:
                pass  # Invalid date format, ignore
        
        if date_from:
            try:
                filter_date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                income_queryset = income_queryset.filter(date__gte=filter_date_from)
                expense_queryset = expense_queryset.filter(date__gte=filter_date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                filter_date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                income_queryset = income_queryset.filter(date__lte=filter_date_to)
                expense_queryset = expense_queryset.filter(date__lte=filter_date_to)
            except ValueError:
                pass
        
        # Apply category filter
        if category:
            income_queryset = income_queryset.filter(category__name__icontains=category)
            expense_queryset = expense_queryset.filter(category__name__icontains=category)
        
        # Apply amount filters
        if amount_min:
            try:
                amount_min_decimal = Decimal(amount_min)
                income_queryset = income_queryset.filter(amount__gte=amount_min_decimal)
                expense_queryset = expense_queryset.filter(amount__gte=amount_min_decimal)
            except (ValueError, TypeError):
                pass
        
        if amount_max:
            try:
                amount_max_decimal = Decimal(amount_max)
                income_queryset = income_queryset.filter(amount__lte=amount_max_decimal)
                expense_queryset = expense_queryset.filter(amount__lte=amount_max_decimal)
            except (ValueError, TypeError):
                pass
        
        # Apply is_income filter
        if is_income_param is not None:
            is_income = is_income_param.lower() in ['true', '1']
            if is_income:
                expense_queryset = expense_queryset.none()  # Exclude expenses
            else:
                income_queryset = income_queryset.none()  # Exclude income
        
        # Convert to list of dictionaries for unified format
        transactions = []
        
        # Process income transactions
        for income in income_queryset:
            transactions.append({
                'id': income.id,
                'note': income.note or '',
                'category': income.category.name,
                'amount': income.amount,
                'date': income.date,
                'is_income': True,
                '_created_at': income.created_at,  # For sorting only
            })
        
        # Process expense transactions
        for expense in expense_queryset:
            transactions.append({
                'id': expense.id,
                'note': expense.note or '',
                'category': expense.category.name,
                'amount': expense.amount,
                'date': expense.date,
                'is_income': False,
                '_created_at': expense.created_at,  # For sorting only
            })
        
        # Sort by date (most recent first), then by created_at
        transactions.sort(key=lambda x: (x['date'], x['_created_at']), reverse=True)
        
        # Remove the temporary sorting field
        for transaction in transactions:
            transaction.pop('_created_at', None)
        
        return transactions

    def list(self, request, *args, **kwargs):
        """Override list to return custom response format."""
        transactions = self.get_queryset()
        
        # Apply pagination manually since we're working with a list, not a queryset
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            # Get pagination metadata
            paginator = self.paginator
            paginated_response = paginator.get_paginated_response(serializer.data)
            
            # Return in the required format: { success: boolean, data: [T] }
            return success_response( 
                data={
                'data': serializer.data,
                'count': paginated_response.data.get('count'),
                'next': paginated_response.data.get('next'),
                'previous': paginated_response.data.get('previous'),
                },
                message='Transactions retrieved successfully'
            )
        
        # If no pagination, return all results
        serializer = self.get_serializer(transactions, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
        })


# ------------------------------------------------------------
# 7. Budget Management View
# ------------------------------------------------------------

class BudgetManagementView(APIView):
    """
    Endpoint to get budget management data for all expense categories.
    Returns budget amount and expense amount for each category for the current month.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        today = date.today()
        current_year = today.year
        current_month = today.month
        
        # Get all expense categories for this user
        expense_categories = Category.objects.filter(user=user, is_income=False).order_by('name')
        
        budget_management_data = []
        
        for category in expense_categories:
            # Get budget amount for this category for current month
            budget = Budget.objects.filter(
                user=user,
                category=category,
                year=current_year,
                month=current_month
            ).first()
            
            budget_amount = budget.amount if budget else Decimal('0.00')
            
            # Calculate total expenses for this category for current month
            total_expenses = Expense.objects.filter(
                user=user,
                category=category,
                date__year=current_year,
                date__month=current_month
            ).aggregate(
                sum=Coalesce(Sum('amount'), Decimal('0.00'))
            )['sum']
            
            budget_management_data.append({
                'category': category.name,
                'budgetAmt': budget_amount,
                'expenseAmt': total_expenses,
            })
        
        serializer = BudgetManagementSerializer(data=budget_management_data, many=True)
        serializer.is_valid(raise_exception=True)
        
        return success_response(
            data=serializer.validated_data,
            message='Budget management data retrieved successfully'
        )