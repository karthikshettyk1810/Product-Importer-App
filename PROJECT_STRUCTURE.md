# Product Importer - Project Structure

## Overview

A Django-based product importer system with CSV upload, real-time progress tracking, and webhook support.

## Technology Stack

- **Backend:** Django 4.2.7
- **Task Queue:** Celery 5.3.4
- **Message Broker:** Redis
- **Database:** SQLite3 (development)
- **Frontend:** Vanilla JavaScript + HTML/CSS

## Directory Structure

```
product-importer/
├── product_importer/          # Django project settings
│   ├── __init__.py
│   ├── settings.py           # Main settings
│   ├── urls.py               # URL routing
│   ├── celery.py             # Celery configuration
│   └── wsgi.py
│
├── products/                  # Products app
│   ├── models.py             # Product model
│   ├── views.py              # API endpoints
│   ├── tasks.py              # Celery tasks
│   ├── urls.py               # Product URLs
│   └── admin.py              # Admin configuration
│
├── webhooks/                  # Webhooks app
│   ├── models.py             # Webhook model
│   ├── views.py              # Webhook API
│   ├── utils.py              # Webhook utilities
│   ├── urls.py               # Webhook URLs
│   └── admin.py
│
├── templates/                 # HTML templates
│   ├── base.html             # Base template
│   ├── dashboard.html        # Upload page
│   ├── products.html         # Product management
│   └── webhooks.html         # Webhook management
│
├── static/                    # Static files
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   └── js/
│       ├── main.js           # Utilities
│       ├── dashboard.js      # Upload logic
│       ├── products.js       # Product CRUD
│       └── webhooks.js       # Webhook management
│
├── manage.py                  # Django management
├── requirements.txt           # Python dependencies
├── Dockerfile                 # Docker configuration
├── docker-compose.yml         # Docker Compose setup
├── start.sh                   # Quick start script
├── start_celery.sh           # Celery worker script
├── sample_products.csv        # Sample data
└── SETUP.md                   # Setup instructions

```

## Key Features

### 1. CSV Upload (Story 1 & 1A)

- **File:** `products/views.py` - `upload_csv()`
- **Task:** `products/tasks.py` - `process_csv_upload()`
- **Frontend:** `static/js/dashboard.js`
- Real-time progress via Server-Sent Events (SSE)
- Asynchronous processing with Celery
- Batch processing (1000 records per batch)
- Case-insensitive SKU handling

### 2. Product Management (Story 2)

- **File:** `products/views.py`
- **Frontend:** `static/js/products.js`
- Full CRUD operations
- Pagination (50 items per page)
- Filtering by SKU, name, and active status
- Modal-based editing

### 3. Bulk Delete (Story 3)

- **File:** `products/views.py` - `bulk_delete()`
- **Task:** `products/tasks.py` - `bulk_delete_products()`
- Confirmation modal
- Asynchronous deletion

### 4. Webhook Management (Story 4)

- **File:** `webhooks/views.py`
- **Utils:** `webhooks/utils.py`
- **Frontend:** `static/js/webhooks.js`
- Event types: product.created, product.updated, upload.completed
- Test functionality with response time tracking
- Enable/disable toggle

## Database Schema

### Product Model

```python
- id: UUID (Primary Key)
- sku: CharField (Unique, lowercase)
- name: TextField
- description: TextField
- price: DecimalField
- active: BooleanField
- created_at: DateTimeField
- updated_at: DateTimeField
```

### Webhook Model

```python
- id: UUID (Primary Key)
- url: URLField
- event_type: CharField (choices)
- enabled: BooleanField
- last_status: IntegerField
- last_response_time: FloatField
- created_at: DateTimeField
- updated_at: DateTimeField
```

## API Endpoints

### Products

- `POST /products/api/upload/` - Upload CSV
- `GET /products/api/upload/status/<task_id>/` - Get upload status
- `GET /products/api/upload/progress/<task_id>/` - SSE progress stream
- `GET /products/api/products/` - List products (paginated)
- `POST /products/api/products/create/` - Create product
- `PUT /products/api/products/<id>/` - Update product
- `DELETE /products/api/products/<id>/delete/` - Delete product
- `DELETE /products/api/products/bulk-delete/` - Delete all products

### Webhooks

- `GET /webhooks/api/webhooks/` - List webhooks
- `POST /webhooks/api/webhooks/create/` - Create webhook
- `PUT /webhooks/api/webhooks/<id>/` - Update webhook
- `DELETE /webhooks/api/webhooks/<id>/delete/` - Delete webhook
- `POST /webhooks/api/webhooks/<id>/test/` - Test webhook

## Celery Tasks

### process_csv_upload

- Parses CSV file
- Validates data
- Batch inserts/updates products
- Updates progress in Redis
- Triggers webhooks

### bulk_delete_products

- Deletes all products asynchronously

### trigger_webhook

- Sends HTTP POST to webhook URL
- Records response status and time
- Handles errors gracefully

## Redis Keys

Progress tracking:

- `upload:{task_id}:status` - Current status message
- `upload:{task_id}:progress` - Progress percentage (0-100)
- `upload:{task_id}:error` - Error message (if any)

## Running the Application

### Development (Local)

```bash
# Terminal 1: Django
./start.sh

# Terminal 2: Celery
./start_celery.sh
```

### Docker

```bash
docker-compose up
```

## Testing

1. Start the application
2. Navigate to http://localhost:8000
3. Upload `sample_products.csv`
4. Watch real-time progress
5. Manage products at /products/
6. Configure webhooks at /webhooks/

## Deployment Considerations

- Replace SQLite with PostgreSQL for production
- Use environment variables for secrets
- Configure proper ALLOWED_HOSTS
- Set DEBUG=False
- Use gunicorn/uwsgi for WSGI
- Configure nginx for static files
- Use supervisor/systemd for process management
- Consider using Celery beat for scheduled tasks
