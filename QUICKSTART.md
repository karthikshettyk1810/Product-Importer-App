# 🚀 Quick Start Guide

Get the Product Importer running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (need 3.8+)
python3 --version

# Check if Redis is installed
redis-cli --version

# If Redis not installed:
# macOS: brew install redis
# Linux: sudo apt-get install redis-server
```

## Installation

### 1. Start Redis

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Verify Redis is running
redis-cli ping  # Should return: PONG
```

### 2. Install Dependencies

```bash
# Virtual environment already created
source venv/bin/activate

# Install packages (if not already done)
pip install -r requirements.txt
```

### 3. Setup Database

```bash
# Run migrations
python manage.py migrate

# Create admin user (optional)
python manage.py createsuperuser
```

## Running the Application

### Option 1: Using Scripts (Recommended)

**Terminal 1 - Django Server:**

```bash
./start.sh
```

**Terminal 2 - Celery Worker:**

```bash
./start_celery.sh
```

### Option 2: Manual Commands

**Terminal 1:**

```bash
source venv/bin/activate
python manage.py runserver
```

**Terminal 2:**

```bash
source venv/bin/activate
celery -A product_importer worker --loglevel=info
```

### Option 3: Docker

```bash
docker-compose up
```

## Access the Application

Open your browser and navigate to:

- **Dashboard (CSV Upload):** http://localhost:8000/
- **Product Management:** http://localhost:8000/products/
- **Webhook Configuration:** http://localhost:8000/webhooks/
- **Admin Panel:** http://localhost:8000/admin/

## Test the Application

### 1. Upload Sample CSV

1. Go to http://localhost:8000/
2. Click "Choose File" and select `sample_products.csv`
3. Click "Upload CSV"
4. Watch the real-time progress bar!

### 2. Manage Products

1. Go to http://localhost:8000/products/
2. View uploaded products
3. Try filtering by SKU or name
4. Edit a product
5. Create a new product

### 3. Configure Webhooks

1. Go to http://localhost:8000/webhooks/
2. Click "Add Webhook"
3. Enter a test URL (e.g., https://webhook.site)
4. Select event type
5. Click "Test" to verify

## Troubleshooting

### Redis Connection Error

```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
brew services start redis  # macOS
sudo systemctl start redis  # Linux
```

### Celery Not Processing Tasks

```bash
# Make sure Celery worker is running in Terminal 2
# Check for errors in the Celery terminal output
```

### Port Already in Use

```bash
# Use a different port
python manage.py runserver 8001
```

### Import Errors

```bash
# Reinstall dependencies
pip install -r requirements.txt
```

## What's Next?

- Read [SETUP.md](SETUP.md) for detailed setup instructions
- Check [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for architecture details
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Review [readme.md](readme.md) for complete specifications

## Key Features Implemented

✅ CSV Upload with real-time progress (SSE)
✅ Asynchronous processing (Celery + Redis)
✅ Product CRUD operations
✅ Pagination and filtering
✅ Bulk delete with confirmation
✅ Webhook configuration and testing
✅ Clean minimal UI
✅ SQLite3 database (easy development)
✅ Docker support
✅ Admin panel

## Sample CSV Format

```csv
sku,name,description,price
PROD001,Laptop Computer,High-performance laptop,999.99
PROD002,Wireless Mouse,Ergonomic mouse,29.99
```

## Need Help?

- Check the console output for errors
- Verify all services are running (Django, Celery, Redis)
- Review the logs in the terminal windows
- Make sure you're in the virtual environment

## Development Tips

- Use the admin panel at /admin/ for quick data inspection
- Check Redis keys: `redis-cli KEYS "upload:*"`
- Monitor Celery tasks in the worker terminal
- Use browser DevTools to debug frontend issues

Enjoy building with Product Importer! 🎉
