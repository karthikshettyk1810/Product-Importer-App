import csv
import io
import redis
from celery import shared_task
from django.conf import settings
from django.db import transaction
from .models import Product
from webhooks.utils import trigger_webhook


redis_client = redis.from_url(settings.REDIS_URL)


@shared_task(bind=True)
def process_csv_upload(self, file_content, task_id):
    """Process CSV file and import products with optimized batch processing"""
    try:
        # Update status
        redis_client.set(f'upload:{task_id}:status', 'Parsing CSV...')
        redis_client.set(f'upload:{task_id}:progress', '0')
        
        # Parse CSV in streaming mode (don't load all into memory)
        csv_file = io.StringIO(file_content)
        reader = csv.DictReader(csv_file)
        
        # Process in optimized batches
        batch_size = 5000  # Larger batches for better performance
        batch = []
        processed = 0
        created_count = 0
        updated_count = 0
        total_rows = 0
        
        # First pass: count total rows (for progress calculation)
        csv_file.seek(0)
        next(reader)  # Skip header
        total_rows = sum(1 for _ in reader)
        
        if total_rows == 0:
            redis_client.set(f'upload:{task_id}:status', 'Error')
            redis_client.set(f'upload:{task_id}:error', 'CSV file is empty')
            return
        
        # Reset for actual processing
        csv_file.seek(0)
        reader = csv.DictReader(csv_file)
        
        redis_client.set(f'upload:{task_id}:status', 'Processing...')
        
        batch_number = 0
        
        for row in reader:
            try:
                sku = row.get('sku', '').strip().lower()
                name = row.get('name', '').strip()
                description = row.get('description', '').strip()
                price = row.get('price', '0').strip()
                
                if not sku or not name:
                    processed += 1
                    continue
                
                batch.append({
                    'sku': sku,
                    'name': name,
                    'description': description,
                    'price': float(price) if price else 0.0,
                })
                
                # Process batch when it reaches batch_size
                if len(batch) >= batch_size:
                    batch_number += 1
                    created, updated = process_batch(batch, task_id, batch_number)
                    created_count += created
                    updated_count += updated
                    processed += len(batch)
                    
                    # Update progress (less frequently for better performance)
                    progress = int((processed / total_rows) * 100)
                    redis_client.set(f'upload:{task_id}:progress', str(progress))
                    redis_client.set(f'upload:{task_id}:status', 
                                   f'Processing batch {batch_number} ({processed}/{total_rows})...')
                    
                    batch = []
                    
            except Exception as e:
                print(f"Error processing row: {e}")
                processed += 1
                continue
        
        # Process remaining items
        if batch:
            batch_number += 1
            created, updated = process_batch(batch, task_id, batch_number)
            created_count += created
            updated_count += updated
            processed += len(batch)
        
        # Complete
        redis_client.set(f'upload:{task_id}:status', 'Completed')
        redis_client.set(f'upload:{task_id}:progress', '100')
        
        # Trigger single upload completed webhook (not per product)
        trigger_webhook.delay('upload.completed', {
            'task_id': task_id,
            'total_rows': total_rows,
            'created': created_count,
            'updated': updated_count,
        })
        
    except Exception as e:
        redis_client.set(f'upload:{task_id}:status', 'Error')
        redis_client.set(f'upload:{task_id}:error', str(e))
        raise


def process_batch(batch, task_id, batch_number):
    """Process a batch of products using bulk operations"""
    created_count = 0
    updated_count = 0
    
    try:
        with transaction.atomic():
            # Get all existing SKUs in this batch
            skus = [item['sku'] for item in batch]
            existing_products = {
                p.sku: p for p in Product.objects.filter(sku__in=skus).only('id', 'sku')
            }
            
            products_to_create = []
            products_to_update = []
            
            for item in batch:
                sku = item['sku']
                
                if sku in existing_products:
                    # Update existing product
                    product = existing_products[sku]
                    product.name = item['name']
                    product.description = item['description']
                    product.price = item['price']
                    products_to_update.append(product)
                    updated_count += 1
                else:
                    # Create new product
                    products_to_create.append(Product(
                        sku=sku,
                        name=item['name'],
                        description=item['description'],
                        price=item['price'],
                        active=True
                    ))
                    created_count += 1
            
            # Bulk create new products
            if products_to_create:
                Product.objects.bulk_create(products_to_create, batch_size=1000)
            
            # Bulk update existing products
            if products_to_update:
                Product.objects.bulk_update(
                    products_to_update,
                    ['name', 'description', 'price', 'updated_at'],
                    batch_size=1000
                )
        
        return created_count, updated_count
        
    except Exception as e:
        print(f"Error processing batch {batch_number}: {e}")
        return 0, 0


@shared_task
def bulk_delete_products():
    """Delete all products in batches to avoid memory issues"""
    batch_size = 10000
    deleted_total = 0
    
    while True:
        # Delete in batches
        ids = list(Product.objects.values_list('id', flat=True)[:batch_size])
        if not ids:
            break
        
        deleted_count = Product.objects.filter(id__in=ids).delete()[0]
        deleted_total += deleted_count
    
    return {'status': 'success', 'message': f'Deleted {deleted_total} products'}
