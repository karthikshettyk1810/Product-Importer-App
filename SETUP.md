# Product Importer - Setup Guide

## Prerequisites

- Python 3.8+
- Redis server

## Installation Steps

### 1. Install Redis (if not already installed)

**macOS:**

```bash
brew install redis
brew services start redis
```

**Linux:**

```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

### 2. Install Python Dependencies

```bash
# Activate virtual environment
source venv/bin/activate

# Install requirements
pip install -r requirements.txt
```

### 3. Configure Environment

Create a `.env` file:

```bash
cp .env.example .env
```

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

## Running the Application

You need to run THREE processes:

### Terminal 1 - Django Server

```bash
source venv/bin/activate
python manage.py runserver
```

### Terminal 2 - Celery Worker

```bash
source venv/bin/activate
celery -A product_importer worker --loglevel=info
```

### Terminal 3 - Redis (if not running as service)

```bash
redis-server
```

## Access the Application

- **Dashboard:** http://localhost:8000/
- **Products:** http://localhost:8000/products/
- **Webhooks:** http://localhost:8000/webhooks/
- **Admin:** http://localhost:8000/admin/

## Testing CSV Upload

A sample CSV file `sample_products.csv` is included for testing.

## Features

✅ CSV Upload with real-time progress (SSE)
✅ Asynchronous processing with Celery
✅ Product CRUD operations
✅ Pagination and filtering
✅ Bulk delete with confirmation
✅ Webhook configuration and testing
✅ SQLite3 database (easy development)
✅ Clean minimal UI

## Troubleshooting

**Redis Connection Error:**

- Make sure Redis is running: `redis-cli ping` (should return PONG)

**Celery Not Processing:**

- Check if Celery worker is running
- Check Redis connection

**Upload Not Working:**

- Ensure all three processes are running
- Check browser console for errors
