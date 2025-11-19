#!/bin/bash

echo "🚨 EMERGENCY CLEANUP SCRIPT"
echo "============================"
echo ""

# Step 1: Kill Celery workers
echo "1️⃣ Stopping Celery workers..."
pkill -9 -f "celery.*worker" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Celery workers stopped"
else
    echo "   ℹ️  No Celery workers found"
fi
echo ""

# Step 2: Clear Redis
echo "2️⃣ Clearing Redis..."
redis-cli FLUSHALL 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✅ Redis cleared"
else
    echo "   ⚠️  Redis not accessible (may not be running)"
fi
echo ""

# Step 3: Delete all products
echo "3️⃣ Deleting all products from database..."
source venv/bin/activate
python manage.py delete_all_products --force
echo ""

echo "============================"
echo "✅ CLEANUP COMPLETE!"
echo ""
echo "Next steps:"
echo "1. Restart Celery worker: celery -A product_importer worker --loglevel=info"
echo "2. Refresh the UI"
echo "3. Verify products are gone"
