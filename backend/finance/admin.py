from django.contrib import admin
from .models import User, Category, Income, Expense, Budget


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_active', 'date_joined')
    list_filter = ('is_staff', 'is_active', 'date_joined')
    search_fields = ('username', 'email')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'is_income')
    list_filter = ('is_income',)
    search_fields = ('name', 'user__username', 'user__email')


@admin.register(Income)
class IncomeAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'amount', 'date', 'created_at')
    list_filter = ('date', 'created_at', 'category')
    search_fields = ('user__username', 'user__email', 'category__name', 'note')
    date_hierarchy = 'date'


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('user', 'category', 'amount', 'date', 'created_at')
    list_filter = ('date', 'created_at', 'category')
    search_fields = ('user__username', 'user__email', 'category__name', 'note')
    date_hierarchy = 'date'


@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'year', 'month', 'amount', 'created_at')
    list_filter = ('year', 'month', 'created_at')
    search_fields = ('user__username', 'user__email')
    ordering = ('-year', '-month')
