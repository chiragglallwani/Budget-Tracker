#!/usr/bin/env python
"""
Simple script to test the Budget Tracker API endpoints.
Run this after starting the Django server.
"""
import requests
import json
from datetime import date

BASE_URL = "http://localhost:8000/api"

def print_response(title, response):
    """Helper function to print API responses."""
    print(f"\n{'='*60}")
    print(f"{title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except:
        print(f"Response: {response.text}")

def test_api():
    """Test all API endpoints."""
    
    # Test data
    test_email = f"test_{date.today().strftime('%Y%m%d')}@example.com"
    test_username = f"testuser_{date.today().strftime('%Y%m%d')}"
    test_password = "testpass123"
    
    print("\n" + "="*60)
    print("BUDGET TRACKER API TEST")
    print("="*60)
    
    # 1. Register User
    print("\n1. Registering user...")
    register_data = {
        "email": test_email,
        "password": test_password,
        "username": test_username
    }
    response = requests.post(f"{BASE_URL}/auth/register/", json=register_data)
    print_response("User Registration", response)
    
    if response.status_code not in [200, 201]:
        print("\nRegistration failed. Trying to login with existing user...")
    
    # 2. Login
    print("\n2. Logging in...")
    login_data = {
        "username": test_username,
        "password": test_password
    }
    response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
    print_response("User Login", response)
    
    if response.status_code != 200:
        print("\n❌ Login failed! Cannot proceed with authenticated requests.")
        return
    
    tokens = response.json()
    access_token = tokens.get('access')
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # 3. Create Income Category
    print("\n3. Creating income category...")
    category_data = {
        "name": "Salary",
        "is_income": True
    }
    response = requests.post(f"{BASE_URL}/categories/", json=category_data, headers=headers)
    print_response("Create Income Category", response)
    income_category_id = response.json().get('id') if response.status_code in [200, 201] else None
    
    # 4. Create Expense Category
    print("\n4. Creating expense category...")
    category_data = {
        "name": "Groceries",
        "is_income": False
    }
    response = requests.post(f"{BASE_URL}/categories/", json=category_data, headers=headers)
    print_response("Create Expense Category", response)
    expense_category_id = response.json().get('id') if response.status_code in [200, 201] else None
    
    # 5. List Categories
    print("\n5. Listing all categories...")
    response = requests.get(f"{BASE_URL}/categories/", headers=headers)
    print_response("List Categories", response)
    
    # 6. Create Income Entry
    if income_category_id:
        print("\n6. Creating income entry...")
        income_data = {
            "category_id": income_category_id,
            "amount": "5000.00",
            "date": str(date.today()),
            "note": "Monthly salary"
        }
        response = requests.post(f"{BASE_URL}/incomes/", json=income_data, headers=headers)
        print_response("Create Income Entry", response)
        income_id = response.json().get('id') if response.status_code in [200, 201] else None
    else:
        print("\n6. Skipping income entry (category not created)")
        income_id = None
    
    # 7. Create Expense Entry
    if expense_category_id:
        print("\n7. Creating expense entry...")
        expense_data = {
            "category_id": expense_category_id,
            "amount": "150.00",
            "date": str(date.today()),
            "note": "Weekly groceries"
        }
        response = requests.post(f"{BASE_URL}/expenses/", json=expense_data, headers=headers)
        print_response("Create Expense Entry", response)
        expense_id = response.json().get('id') if response.status_code in [200, 201] else None
    else:
        print("\n7. Skipping expense entry (category not created)")
        expense_id = None
    
    # 8. Create Budget
    print("\n8. Creating monthly budget...")
    today = date.today()
    budget_data = {
        "year": today.year,
        "month": today.month,
        "amount": "3000.00"
    }
    response = requests.post(f"{BASE_URL}/budgets/", json=budget_data, headers=headers)
    print_response("Create Budget", response)
    budget_id = response.json().get('id') if response.status_code in [200, 201] else None
    
    # 9. Get Financial Summary
    print("\n9. Getting financial summary...")
    response = requests.get(f"{BASE_URL}/summary/", headers=headers)
    print_response("Financial Summary", response)
    
    # 10. List Incomes
    print("\n10. Listing income entries...")
    response = requests.get(f"{BASE_URL}/incomes/", headers=headers)
    print_response("List Incomes", response)
    
    # 11. List Expenses
    print("\n11. Listing expense entries...")
    response = requests.get(f"{BASE_URL}/expenses/", headers=headers)
    print_response("List Expenses", response)
    
    # 12. List Budgets
    print("\n12. Listing budgets...")
    response = requests.get(f"{BASE_URL}/budgets/", headers=headers)
    print_response("List Budgets", response)
    
    # 13. Update Income (if created)
    if income_id:
        print("\n13. Updating income entry...")
        update_data = {"amount": "5500.00"}
        response = requests.patch(f"{BASE_URL}/incomes/{income_id}/", json=update_data, headers=headers)
        print_response("Update Income", response)
    
    # 14. Delete Expense (if created)
    if expense_id:
        print("\n14. Deleting expense entry...")
        response = requests.delete(f"{BASE_URL}/expenses/{expense_id}/", headers=headers)
        print_response("Delete Expense", response)
        print(f"Status Code: {response.status_code} (204 = Success)")
    
    print("\n" + "="*60)
    print("API TESTING COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    try:
        test_api()
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to the server.")
        print("Make sure the Django server is running: python manage.py runserver")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")

