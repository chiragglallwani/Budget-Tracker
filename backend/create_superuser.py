#!/usr/bin/env python
"""
Script to create a Django superuser non-interactively.
Usage: python create_superuser.py
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'budget_tracker.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

# Superuser credentials
SUPERUSER_EMAIL = 'admin@budgettracker.com'
SUPERUSER_PASSWORD = 'admin123'
SUPERUSER_USERNAME = SUPERUSER_EMAIL  # username = email

def create_superuser():
    """Create a superuser if it doesn't exist."""
    if User.objects.filter(email=SUPERUSER_EMAIL).exists():
        print(f"Superuser with email '{SUPERUSER_EMAIL}' already exists.")
        return
    
    try:
        user = User.objects.create_superuser(
            username=SUPERUSER_USERNAME,
            email=SUPERUSER_EMAIL,
            password=SUPERUSER_PASSWORD
        )
        print("=" * 60)
        print("Superuser created successfully!")
        print("=" * 60)
        print(f"Email: {SUPERUSER_EMAIL}")
        print(f"Username: {SUPERUSER_USERNAME}")
        print(f"Password: {SUPERUSER_PASSWORD}")
        print("=" * 60)
        print("\nYou can now login to Django Admin at: http://localhost:8000/admin/")
    except Exception as e:
        print(f"Error creating superuser: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    create_superuser()

