# 🚨 Emergency Procedures

## Problem: Upload Won't Stop / Products Keep Appearing

### Symptoms
- Uploaded large CSV and reloaded page
- Celery worker still processing in background
- Products keep appearing even after deletion
- Can't stop the import

### Solution: Emergency Cleanup

Run the emergency cleanup script:

```bash
./emergency_cleanup.sh
```

This will:
1. ✅ Kill all Celery workers
2. ✅ Clear Redis (stops pending tasks)
3. ✅ Delete all products from database

### Manual Steps (if script doesn't work)

#### Step 1: Stop Celery Worker

```bash
# Find Celery processes
ps aux | grep celery

# Kill them
pkill -9 -f "celery.*worker"

# Or kill specific PID
kill -9 <PID>
```

#### Step 2: Clear Redis

```bash
# Clear all Redis data
redis-cli FLUSHALL

# Or clear specific keys
redis-cli KEYS "upload:*" | xargs redis-cli DEL
redis-cli KEYS "celery-task-meta-*" | xargs redis-cli DEL
```

#### Step 3: Delete All Products

```bash
# Using management command
python manage.py delete_all_products --force

# Or via Django shell
python manage.py shell
>>> from products.models import Product
>>> Product.objects.all().delete()
>>> exit()

# Or via SQL (fastest)
python manage.py dbshell
sqlite> DELETE FROM products_product;
sqlite> .quit
```

#### Step 4: Restart Services

```bash
# Start Celery worker
celery -A product_importer worker --loglevel=info

# Refresh UI
# Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows/Linux)
```

## Problem: Database Locked

### Symptoms
- "Database is locked" error
- Operations timing out

### Solution

```bash
# Stop all services
pkill -9 -f "celery.*worker"
pkill -9 -f "manage.py runserver"

# Delete lock file (SQLite)
rm db.sqlite3-journal

# Restart services
python manage.py runserver
celery -A product_importer worker --loglevel=info
```

## Problem: Out of Memory

### Symptoms
- Celery worker crashes
- System becomes slow
- "Out of memory" errors

### Solution

```bash
# Kill Celery worker
pkill -9 -f "celery.*worker"

# Clear Redis
redis-cli FLUSHALL

# Reduce batch size in products/tasks.py
# Change: batch_size = 5000
# To: batch_size = 1000

# Restart with lower concurrency
celery -A product_importer worker --loglevel=info --concurrency=1
```

## Problem: Redis Connection Issues

### Symptoms
- "Connection refused" errors
- Progress not updating
- Tasks not processing

### Solution

```bash
# Check if Redis is running
redis-cli ping

# If not running, start it
# macOS:
brew services start redis

# Linux:
sudo systemctl start redis

# Or run manually:
redis-server
```

## Problem: Duplicate Products After Upload

### Symptoms
- Same products appearing multiple times
- SKU uniqueness not working

### Solution

```bash
# Remove duplicates (keep first occurrence)
python manage.py shell
>>> from products.models import Product
>>> from django.db.models import Count
>>> 
>>> # Find duplicates
>>> duplicates = Product.objects.values('sku').annotate(count=Count('id')).filter(count__gt=1)
>>> 
>>> # Delete duplicates
>>> for dup in duplicates:
>>>     products = Product.objects.filter(sku=dup['sku']).order_by('created_at')
>>>     products.exclude(id=products.first().id).delete()
>>> 
>>> exit()
```

## Problem: Can't Delete Products via UI

### Symptoms
- Delete button doesn't work
- Products reappear after deletion
- "Error deleting products" message

### Solution

```bash
# Force delete via command line
python manage.py delete_all_products --force

# Or delete specific products
python manage.py shell
>>> from products.models import Product
>>> Product.objects.filter(sku__startswith='TEST').delete()
>>> exit()
```

## Prevention Tips

### Before Large Uploads

1. **Test with small file first**
   ```bash
   python generate_test_csv.py 100
   # Upload and verify it works
   ```

2. **Monitor Celery worker**
   ```bash
   # Watch the logs
   celery -A product_importer worker --loglevel=info
   ```

3. **Check available resources**
   ```bash
   # Check memory
   free -h  # Linux
   vm_stat  # macOS
   
   # Check disk space
   df -h
   ```

### During Upload

1. **Don't reload the page** - Let it complete
2. **Watch progress bar** - It shows real-time status
3. **Monitor Celery logs** - Check for errors
4. **Check database size** - Ensure it's growing

### After Upload

1. **Verify count**
   ```bash
   python manage.py shell
   >>> from products.models import Product
   >>> Product.objects.count()
   ```

2. **Check for duplicates**
   ```bash
   python manage.py shell
   >>> from products.models import Product
   >>> from django.db.models import Count
   >>> Product.objects.values('sku').annotate(count=Count('id')).filter(count__gt=1).count()
   ```

3. **Test queries**
   ```bash
   python manage.py shell
   >>> from products.models import Product
   >>> Product.objects.first()
   >>> Product.objects.filter(active=True).count()
   ```

## Quick Commands Reference

```bash
# Stop everything
pkill -9 -f "celery.*worker"
pkill -9 -f "manage.py runserver"
redis-cli FLUSHALL

# Delete all products
python manage.py delete_all_products --force

# Check product count
python manage.py shell -c "from products.models import Product; print(Product.objects.count())"

# Restart services
python manage.py runserver &
celery -A product_importer worker --loglevel=info &

# Emergency cleanup (all-in-one)
./emergency_cleanup.sh
```

## Contact Support

If issues persist:
1. Check logs: `celery -A product_importer worker --loglevel=debug`
2. Check Django logs in terminal
3. Check Redis: `redis-cli monitor`
4. Check database: `python manage.py dbshell`

## Nuclear Option (Last Resort)

If nothing works, reset everything:

```bash
# DANGER: This deletes ALL data!

# Stop services
pkill -9 -f "celery.*worker"
pkill -9 -f "manage.py runserver"

# Clear Redis
redis-cli FLUSHALL

# Delete database
rm db.sqlite3

# Recreate database
python manage.py migrate

# Restart services
python manage.py runserver &
celery -A product_importer worker --loglevel=info &
```

---

**Remember:** Always test with small files first! 🧪
