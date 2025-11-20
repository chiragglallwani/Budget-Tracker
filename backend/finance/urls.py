from django.urls import path, include
from rest_framework.pagination import PageNumberPagination
from rest_framework.routers import DefaultRouter
from .views import (
    UserRegisterView, UserDetailView, CategoryViewSet, IncomeViewSet, ExpenseViewSet, BudgetViewSet, 
    FinancialSummaryView, CustomTokenObtainPairView, CustomTokenRefreshView, CustomLogoutView,
    TransactionView, BudgetManagementView
)

# Create a router for the ViewSets without trailing slashes
router = DefaultRouter(trailing_slash=False)
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'incomes', IncomeViewSet, basename='income')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'budgets', BudgetViewSet, basename='budget')


urlpatterns = [
    # ------------------------------------------------
    # 1. Authentication Endpoints (Open)
    # ------------------------------------------------
    # Custom registration endpoint using the optimized serializer/view
    path(
        'auth/register', 
        UserRegisterView.as_view(), 
        name='user_register'
    ),
    # JWT Token endpoints for login and refresh
    path(
        'auth/login', 
        CustomTokenObtainPairView.as_view(), 
        name='token_obtain_pair'
    ),
    path(
        'auth/refresh', 
        CustomTokenRefreshView.as_view(), 
        name='token_refresh'
    ), 
    path(
        'auth/logout', 
        CustomLogoutView.as_view(), 
        name='logout'
    ),
    # User detail endpoint
    path(
        'users/<int:user_id>',
        UserDetailView.as_view(),
        name='user_detail'
    ),

    # ------------------------------------------------
    # 2. Main Application Endpoints (Auth Required)
    # ------------------------------------------------
    # Router paths for CRUD operations
    path('', include(router.urls)),

    # Custom read-only summary endpoint
    path(
        'summary', 
        FinancialSummaryView.as_view(), 
        name='financial_summary'
    ),

    path(
        'transactions',
        TransactionView.as_view(),
        name='transactions'
    ),

    path(
        'budget-management',
        BudgetManagementView.as_view(),
        name='budget-management'
    )
]