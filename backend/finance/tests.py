from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from decimal import Decimal
from datetime import date, timedelta

from .models import Category, Income, Expense, Budget

User = get_user_model()


class AuthenticationTests(TestCase):
    """Test cases for authentication endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user_register')
        self.login_url = reverse('token_obtain_pair')
        self.logout_url = reverse('logout')

    def test_user_registration(self):
        """Test user registration with email and password."""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.register_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')
        self.assertEqual(response.data['user']['username'], 'test@example.com')
        
        # Verify user was created
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.username, 'test@example.com')
        self.assertIsNotNone(user.refresh_token)

    def test_user_registration_duplicate_email(self):
        """Test that duplicate email registration fails."""
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        # First registration
        self.client.post(self.register_url, data, format='json')
        
        # Second registration with same email
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login(self):
        """Test user login with email and password."""
        # Create a user first
        user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post(self.login_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        
        # Verify refresh_token was stored
        user.refresh_from_db()
        self.assertIsNotNone(user.refresh_token)

    def test_user_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        data = {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_logout(self):
        """Test user logout clears refresh_token."""
        # Create and login user
        user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        user.refresh_token = 'test_refresh_token'
        user.save()
        
        # Authenticate
        self.client.force_authenticate(user=user)
        
        # Logout
        response = self.client.post(self.logout_url, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        
        # Verify refresh_token was cleared
        user.refresh_from_db()
        self.assertIsNone(user.refresh_token)

    def test_user_logout_requires_authentication(self):
        """Test that logout requires authentication."""
        response = self.client.post(self.logout_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CategoryTests(TestCase):
    """Test cases for Category endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.categories_url = reverse('category-list')

    def test_create_category(self):
        """Test creating a category."""
        data = {
            'name': 'Groceries',
            'is_income': False
        }
        response = self.client.post(self.categories_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Groceries')
        self.assertFalse(response.data['is_income'])
        
        # Verify category was created
        category = Category.objects.get(name='Groceries')
        self.assertEqual(category.user, self.user)

    def test_create_income_category(self):
        """Test creating an income category."""
        data = {
            'name': 'Salary',
            'is_income': True
        }
        response = self.client.post(self.categories_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['is_income'])

    def test_list_categories(self):
        """Test listing categories."""
        Category.objects.create(user=self.user, name='Groceries', is_income=False)
        Category.objects.create(user=self.user, name='Salary', is_income=True)
        
        response = self.client.get(self.categories_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_categories_by_type(self):
        """Test filtering categories by is_income."""
        Category.objects.create(user=self.user, name='Groceries', is_income=False)
        Category.objects.create(user=self.user, name='Salary', is_income=True)
        
        # Filter income categories
        response = self.client.get(self.categories_url, {'is_income': 'true'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertTrue(response.data['results'][0]['is_income'])
        
        # Filter expense categories
        response = self.client.get(self.categories_url, {'is_income': 'false'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertFalse(response.data['results'][0]['is_income'])

    def test_update_category(self):
        """Test updating a category."""
        category = Category.objects.create(user=self.user, name='Groceries', is_income=False)
        url = reverse('category-detail', kwargs={'pk': category.pk})
        
        data = {'name': 'Food', 'is_income': False}
        response = self.client.patch(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Food')

    def test_delete_category(self):
        """Test deleting a category."""
        category = Category.objects.create(user=self.user, name='Groceries', is_income=False)
        url = reverse('category-detail', kwargs={'pk': category.pk})
        
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Category.objects.filter(pk=category.pk).exists())

    def test_category_isolation(self):
        """Test that users can only see their own categories."""
        other_user = User.objects.create_user(
            username='other@example.com',
            email='other@example.com',
            password='testpass123'
        )
        Category.objects.create(user=other_user, name='Other Category', is_income=False)
        Category.objects.create(user=self.user, name='My Category', is_income=False)
        
        response = self.client.get(self.categories_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'My Category')


class IncomeTests(TestCase):
    """Test cases for Income endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.income_category = Category.objects.create(
            user=self.user,
            name='Salary',
            is_income=True
        )
        self.incomes_url = reverse('income-list')

    def test_create_income(self):
        """Test creating an income entry."""
        data = {
            'category_id': self.income_category.id,
            'amount': '5000.00',
            'date': str(date.today()),
            'note': 'Monthly salary'
        }
        response = self.client.post(self.incomes_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['amount']), Decimal('5000.00'))
        self.assertEqual(response.data['note'], 'Monthly salary')

    def test_create_income_with_expense_category_fails(self):
        """Test that creating income with expense category fails."""
        expense_category = Category.objects.create(
            user=self.user,
            name='Groceries',
            is_income=False
        )
        data = {
            'category_id': expense_category.id,
            'amount': '5000.00',
            'date': str(date.today())
        }
        response = self.client.post(self.incomes_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_incomes(self):
        """Test listing income entries."""
        Income.objects.create(
            user=self.user,
            category=self.income_category,
            amount=Decimal('5000.00'),
            date=date.today()
        )
        
        response = self.client.get(self.incomes_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_income_amount_validation(self):
        """Test that income amount must be positive."""
        data = {
            'category_id': self.income_category.id,
            'amount': '-100.00',
            'date': str(date.today())
        }
        response = self.client.post(self.incomes_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ExpenseTests(TestCase):
    """Test cases for Expense endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.expense_category = Category.objects.create(
            user=self.user,
            name='Groceries',
            is_income=False
        )
        self.expenses_url = reverse('expense-list')

    def test_create_expense(self):
        """Test creating an expense entry."""
        data = {
            'category_id': self.expense_category.id,
            'amount': '150.00',
            'date': str(date.today()),
            'note': 'Weekly groceries'
        }
        response = self.client.post(self.expenses_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['amount']), Decimal('150.00'))

    def test_create_expense_with_income_category_fails(self):
        """Test that creating expense with income category fails."""
        income_category = Category.objects.create(
            user=self.user,
            name='Salary',
            is_income=True
        )
        data = {
            'category_id': income_category.id,
            'amount': '150.00',
            'date': str(date.today())
        }
        response = self.client.post(self.expenses_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_expenses(self):
        """Test listing expense entries."""
        Expense.objects.create(
            user=self.user,
            category=self.expense_category,
            amount=Decimal('150.00'),
            date=date.today()
        )
        
        response = self.client.get(self.expenses_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class BudgetTests(TestCase):
    """Test cases for Budget endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.budgets_url = reverse('budget-list')
        self.today = date.today()

    def test_create_budget(self):
        """Test creating a budget."""
        data = {
            'year': self.today.year,
            'month': self.today.month,
            'amount': '3000.00'
        }
        response = self.client.post(self.budgets_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data['amount']), Decimal('3000.00'))

    def test_create_duplicate_budget_fails(self):
        """Test that creating duplicate budget for same month fails."""
        Budget.objects.create(
            user=self.user,
            year=self.today.year,
            month=self.today.month,
            amount=Decimal('3000.00')
        )
        
        data = {
            'year': self.today.year,
            'month': self.today.month,
            'amount': '4000.00'
        }
        response = self.client.post(self.budgets_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_filter_budgets_by_year_month(self):
        """Test filtering budgets by year and month."""
        Budget.objects.create(
            user=self.user,
            year=2025,
            month=1,
            amount=Decimal('3000.00')
        )
        Budget.objects.create(
            user=self.user,
            year=2025,
            month=2,
            amount=Decimal('3500.00')
        )
        
        response = self.client.get(self.budgets_url, {'year': '2025', 'month': '1'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['month'], 1)

    def test_budget_amount_validation(self):
        """Test that budget amount must be positive."""
        data = {
            'year': self.today.year,
            'month': self.today.month,
            'amount': '-100.00'
        }
        response = self.client.post(self.budgets_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class FinancialSummaryTests(TestCase):
    """Test cases for Financial Summary endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='test@example.com',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        self.summary_url = reverse('financial_summary')
        
        # Create categories
        self.income_category = Category.objects.create(
            user=self.user,
            name='Salary',
            is_income=True
        )
        self.expense_category = Category.objects.create(
            user=self.user,
            name='Groceries',
            is_income=False
        )

    def test_financial_summary_with_no_data(self):
        """Test financial summary with no transactions."""
        response = self.client.get(self.summary_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['total_income']), Decimal('0.00'))
        self.assertEqual(Decimal(response.data['total_expense']), Decimal('0.00'))
        self.assertEqual(Decimal(response.data['balance']), Decimal('0.00'))

    def test_financial_summary_with_transactions(self):
        """Test financial summary with income and expenses."""
        # Create income
        Income.objects.create(
            user=self.user,
            category=self.income_category,
            amount=Decimal('5000.00'),
            date=date.today()
        )
        
        # Create expense
        Expense.objects.create(
            user=self.user,
            category=self.expense_category,
            amount=Decimal('1500.00'),
            date=date.today()
        )
        
        response = self.client.get(self.summary_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['total_income']), Decimal('5000.00'))
        self.assertEqual(Decimal(response.data['total_expense']), Decimal('1500.00'))
        self.assertEqual(Decimal(response.data['balance']), Decimal('3500.00'))

    def test_financial_summary_with_budget(self):
        """Test financial summary with monthly budget."""
        today = date.today()
        
        # Create budget
        Budget.objects.create(
            user=self.user,
            year=today.year,
            month=today.month,
            amount=Decimal('3000.00')
        )
        
        # Create expense for current month
        Expense.objects.create(
            user=self.user,
            category=self.expense_category,
            amount=Decimal('1500.00'),
            date=today
        )
        
        response = self.client.get(self.summary_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Decimal(response.data['monthly_budget_target']), Decimal('3000.00'))
        self.assertEqual(Decimal(response.data['monthly_budget_spent']), Decimal('1500.00'))
        self.assertIn('budget_comparison', response.data)

    def test_financial_summary_requires_authentication(self):
        """Test that financial summary requires authentication."""
        self.client.force_authenticate(user=None)
        response = self.client.get(self.summary_url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class AuthorizationTests(TestCase):
    """Test cases for authorization and data isolation."""

    def setUp(self):
        self.client = APIClient()
        self.user1 = User.objects.create_user(
            username='user1@example.com',
            email='user1@example.com',
            password='testpass123'
        )
        self.user2 = User.objects.create_user(
            username='user2@example.com',
            email='user2@example.com',
            password='testpass123'
        )

    def test_users_cannot_access_other_users_data(self):
        """Test that users can only access their own data."""
        # User1 creates a category
        self.client.force_authenticate(user=self.user1)
        category1 = Category.objects.create(
            user=self.user1,
            name='User1 Category',
            is_income=False
        )
        
        # User2 creates a category
        self.client.force_authenticate(user=self.user2)
        category2 = Category.objects.create(
            user=self.user2,
            name='User2 Category',
            is_income=False
        )
        
        # User2 tries to access User1's category
        url = reverse('category-detail', kwargs={'pk': category1.pk})
        response = self.client.get(url)
        
        # Should return 404 (not found) because User2 can't see User1's data
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # User2 can access their own category
        url = reverse('category-detail', kwargs={'pk': category2.pk})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
