# Budget Tracker Backend

Django REST Framework backend for Personal Budget Tracker application.

## Prerequisites

- Python 3.10 or higher
- PostgreSQL (or use Docker Compose)
- pip (Python package manager)

## Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Set Up Database

#### Option A: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL database
docker-compose up -d

# Verify it's running
docker-compose ps
```

#### Option B: Using Local PostgreSQL

Create a PostgreSQL database named `budgetdb` and update the `.env` file accordingly.

### 4. Create Environment File

Create a `.env` file in the `backend` directory (optional, defaults are provided):

```bash
# .env file
DB_NAME=budgetdb
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DEBUG=True
FRONTEND_ORIGIN=http://localhost:3000
```

### 5. Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create Superuser (Optional - for Django Admin)

**Option 1: Using the script (Recommended)**

```bash
python create_superuser.py
```

This will create a superuser with:

- **Email**: `admin@budgettracker.com`
- **Username**: `admin@budgettracker.com` (same as email)
- **Password**: `admin123`

**Option 2: Interactive method**

```bash
python manage.py createsuperuser
```

### 7. Start Development Server

```bash
python manage.py runserver
```

The server will start at `http://localhost:8000`

## API Endpoints

### Authentication Endpoints (Public)

- **Register**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Refresh Token**: `POST /api/auth/refresh`
- **Logout**: `POST /api/auth/logout`

### Application Endpoints (Require Authentication)

- **Categories**: `/api/categories`
- **Incomes**: `/api/incomes`
- **Expenses**: `/api/expenses`
- **Budgets**: `/api/budgets`
- **Financial Summary**: `GET /api/summary`
- **Transaction**: `GET /api/transactions`

## Testing the API

### Using cURL

#### 1. Register a User

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "username": "testuser"
  }'
```

#### 2. Login to Get JWT Token

```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

Response will include `access` and `refresh` tokens.

#### 3. Create a Category

```bash
curl -X POST http://localhost:8000/api/categories/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Groceries",
    "is_income": false
  }'
```

#### 4. Create an Income Entry

```bash
curl -X POST http://localhost:8000/api/incomes/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "category_id": 1,
    "amount": "5000.00",
    "date": "2025-01-15",
    "note": "Monthly salary"
  }'
```

#### 5. Create an Expense Entry

```bash
curl -X POST http://localhost:8000/api/expenses/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "category_id": 1,
    "amount": "150.00",
    "date": "2025-01-16",
    "note": "Weekly groceries"
  }'
```

#### 6. Create a Budget

```bash
curl -X POST http://localhost:8000/api/budgets/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "year": 2025,
    "month": 1,
    "amount": "3000.00"
  }'
```

#### 7. Get Financial Summary

```bash
curl -X GET http://localhost:8000/api/summary/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Using Python Requests

```python
import requests

BASE_URL = "http://localhost:8000/api"

# Register
response = requests.post(f"{BASE_URL}/auth/register/", json={
    "email": "test@example.com",
    "password": "testpass123",
    "username": "testuser"
})
print(response.json())

# Login
response = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": "testuser",
    "password": "testpass123"
})
tokens = response.json()
access_token = tokens['access']

# Create category
headers = {"Authorization": f"Bearer {access_token}"}
response = requests.post(f"{BASE_URL}/categories/", json={
    "name": "Groceries",
    "is_income": False
}, headers=headers)
print(response.json())

#Transactions
GET /api/transactions/                          # All transactions
GET /api/transactions/?page=2                   # Page 2
GET /api/transactions/?date=2025-11-19          # Filter by date
GET /api/transactions/?date_from=2025-11-01&date_to=2025-11-30  # Date range
GET /api/transactions/?category=Groceries       # Filter by category
GET /api/transactions/?amount_min=100&amount_max=1000  # Amount range
GET /api/transactions/?is_income=true            # Only income transactions
GET /api/transactions/?page_size=20             # Custom page size
```

### Using Postman or Insomnia

1. Import the collection or create requests manually
2. Set up environment variables:
   - `base_url`: `http://localhost:8000/api`
   - `access_token`: (will be set after login)
3. Use the following flow:
   - Register → Login → Use access_token for authenticated requests

## Running Tests

The project includes comprehensive test coverage for all endpoints and functionality.

**Run all tests:**

```bash
python manage.py test
```

**Run tests for a specific app:**

```bash
python manage.py test finance
```

**Run a specific test class:**

```bash
python manage.py test finance.tests.AuthenticationTests
```

**Run a specific test:**

```bash
python manage.py test finance.tests.AuthenticationTests.test_user_registration
```

**Run tests with verbose output:**

```bash
python manage.py test --verbosity=2
```

### Test Coverage

The test suite includes:

- ✅ **Authentication Tests**: Registration, login, logout
- ✅ **Category Tests**: CRUD operations, filtering, data isolation
- ✅ **Income Tests**: CRUD operations, validation, category matching
- ✅ **Expense Tests**: CRUD operations, validation, category matching
- ✅ **Budget Tests**: CRUD operations, duplicate prevention, filtering
- ✅ **Financial Summary Tests**: Calculations, budget comparisons
- ✅ **Authorization Tests**: Data isolation between users

## Django Admin Interface

Access the admin interface at `http://localhost:8000/admin/` using your superuser credentials.

## Common Issues

### Database Connection Error

- Ensure PostgreSQL is running: `docker-compose ps` or check PostgreSQL service
- Verify database credentials in `.env` file
- Check if database exists: `docker-compose exec db psql -U postgres -l`

### Migration Errors

```bash
# Reset migrations (CAUTION: This will delete data)
python manage.py migrate finance zero
python manage.py migrate finance
```

### Port Already in Use

```bash
# Use a different port
python manage.py runserver 8001
```

## Project Structure

```
backend/
├── budget_tracker/     # Django project settings
├── finance/            # Main application
│   ├── models.py      # Database models
│   ├── views.py       # API views
│   ├── serializers.py # Request/response serializers
│   └── urls.py        # URL routing
├── manage.py          # Django management script
└── requirements.txt   # Python dependencies

```
