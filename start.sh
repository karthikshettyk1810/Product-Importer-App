#!/bin/bash

echo "🚀 Starting Product Importer Application"
echo ""

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   macOS: brew services start redis"
    echo "   Linux: sudo systemctl start redis"
    exit 1
fi

echo "✅ Redis is running"

# Activate virtual environment
source venv/bin/activate

echo "✅ Virtual environment activated"
echo ""
echo "Starting services..."
echo ""
echo "📝 Instructions:"
echo "   1. Django server will start on http://localhost:8000"
echo "   2. Open a new terminal and run: celery -A product_importer worker --loglevel=info"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start Django server
python manage.py runserver
