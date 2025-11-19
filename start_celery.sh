#!/bin/bash

echo "🔄 Starting Celery Worker"
echo ""

# Activate virtual environment
source venv/bin/activate

# Start Celery worker
celery -A product_importer worker --loglevel=info
