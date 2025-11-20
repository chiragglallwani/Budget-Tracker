from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class User(AbstractUser):
    email = models.EmailField(_('email address'), unique=True)
    refresh_token = models.CharField(max_length=512, blank=True, null=True)
    
    # Explicitly remove first_name and last_name fields inherited from AbstractUser
    first_name = None
    last_name = None

    def __str__(self):
        return f"{self.username} <{self.email}>"


# ------------------------------------------------------------
# 2. Category model
# ------------------------------------------------------------
class Category(models.Model):
    """
    Categories such as:
    - Salary (income)
    - Bonus (income)
    - Groceries (expense)
    - Food (expense)

    Rules:
    - Each user has their own categories.
    - Category names MUST be unique for each user.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="categories"
    )
    name = models.CharField(max_length=100)
    is_income = models.BooleanField(default=False)  # true = income, false = expense

    class Meta:
        unique_together = ("user", "name")  # ensures each user cannot duplicate names
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({'Income' if self.is_income else 'Expense'})"

# ------------------------------------------------------------
# 3. Income model
# ------------------------------------------------------------
class Income(models.Model):
    """
    Stores every INCOME entry for a user.
    Example:
    - category = Salary
    - amount = 55000.00
    - date = 2025-11-19
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="incomes"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,   # cannot delete category if linked to records
        related_name="income_entries"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()  # provided by frontend
    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"Income {self.amount} on {self.date}"


# ------------------------------------------------------------
# 4. Expense model
# ------------------------------------------------------------
class Expense(models.Model):
    """
    Stores every EXPENSE entry for a user.
    Example:
    - category = Groceries
    - amount = 1200.00
    - date = 2025-11-19
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="expenses"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,  # prevents accidental deletion
        related_name="expense_entries"
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField()
    note = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "-created_at"]

    def __str__(self):
        return f"Expense {self.amount} on {self.date}"


# ------------------------------------------------------------
# 5. Budget model
# ------------------------------------------------------------
class Budget(models.Model):
    """
    Stores a monthly budget per user.
    Example:
    - year = 2025
    - month = 11
    - amount = 30000
    - category = Groceries (expense category)
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="budgets"
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,  # cannot delete category if linked to budget
        related_name="budget_entries",
        null=False  # Category is required for budgets
    )
    year = models.IntegerField()
    month = models.IntegerField()  # 1 to 12
    amount = models.DecimalField(max_digits=12, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "category", "year", "month")  # only 1 budget per category per month
        ordering = ["-year", "-month"]

    def clean(self):
        """Validate that category is an expense category (is_income=False) if provided."""
        from django.core.exceptions import ValidationError
        if self.category and self.category.is_income:
            raise ValidationError({
                'category': 'Budget can only be associated with expense categories (is_income=False).'
            })

    def save(self, *args, **kwargs):
        """Override save to call clean validation."""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Budget {self.month}/{self.year} = {self.amount}"


