#!/bin/bash

echo "🚀 Starting Product Importer - Full Stack"
echo ""

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   macOS: brew services start redis"
    echo "   Linux: sudo systemctl start redis"
    exit 1
fi

echo "✅ Redis is running"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found. Please run setup first."
    exit 1
fi

echo "📝 Instructions:"
echo ""
echo "This script will guide you to start all services."
echo "You'll need 4 terminal windows:"
echo ""
echo "Terminal 1: Django Server (this terminal)"
echo "Terminal 2: Celery Worker"
echo "Terminal 3: React Frontend"
echo "Terminal 4: (Optional) Monitor logs"
echo ""
echo "Press Enter to start Django server in this terminal..."
read

# Activate virtual environment and start Django
source venv/bin/activate
echo ""
echo "🌐 Starting Django server on http://localhost:8000"
echo ""
echo "⚠️  IMPORTANT: Open 2 more terminals and run:"
echo ""
echo "Terminal 2:"
echo "  cd $(pwd)"
echo "  source venv/bin/activate"
echo "  celery -A product_importer worker --loglevel=info"
echo ""
echo "Terminal 3:"
echo "  cd $(pwd)/frontend"
echo "  npm run dev"
echo ""
echo "Then access the app at: http://localhost:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

python manage.py runserver
