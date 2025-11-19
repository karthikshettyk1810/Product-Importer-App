import json
import uuid
import redis
from django.shortcuts import render
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.paginator import Paginator
from django.conf import settings
from .models import Product
from .tasks import process_csv_upload, bulk_delete_products
import time


redis_client = redis.from_url(settings.REDIS_URL)


def dashboard(request):
    """Main dashboard view"""
    return render(request, 'dashboard.html')


def product_list_view(request):
    """Product list page"""
    return render(request, 'products.html')


@csrf_exempt
@require_http_methods(["POST"])
def upload_csv(request):
    """Handle CSV file upload"""
    try:
        if 'file' not in request.FILES:
            return JsonResponse({'error': 'No file provided'}, status=400)
        
        csv_file = request.FILES['file']
        
        if not csv_file.name.endswith('.csv'):
            return JsonResponse({'error': 'File must be a CSV'}, status=400)
        
        # Read file content
        file_content = csv_file.read().decode('utf-8')
        
        # Generate task ID
        task_id = str(uuid.uuid4())
        
        # Start async task
        process_csv_upload.delay(file_content, task_id)
        
        return JsonResponse({
            'task_id': task_id,
            'message': 'Upload started'
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def upload_status(request, task_id):
    """Get upload status"""
    try:
        status = redis_client.get(f'upload:{task_id}:status')
        progress = redis_client.get(f'upload:{task_id}:progress')
        error = redis_client.get(f'upload:{task_id}:error')
        
        return JsonResponse({
            'status': status.decode() if status else 'Unknown',
            'progress': int(progress.decode()) if progress else 0,
            'error': error.decode() if error else None
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def upload_progress_sse(request, task_id):
    """Server-Sent Events for real-time progress"""
    def event_stream():
        while True:
            try:
                status = redis_client.get(f'upload:{task_id}:status')
                progress = redis_client.get(f'upload:{task_id}:progress')
                error = redis_client.get(f'upload:{task_id}:error')
                
                data = {
                    'status': status.decode() if status else 'Unknown',
                    'progress': int(progress.decode()) if progress else 0,
                    'error': error.decode() if error else None
                }
                
                yield f"data: {json.dumps(data)}\n\n"
                
                if status and status.decode() in ['Completed', 'Error']:
                    break
                
                time.sleep(1)
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
                break
    
    response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    response['X-Accel-Buffering'] = 'no'
    return response


@require_http_methods(["GET"])
def get_products(request):
    """Get paginated products with filters"""
    try:
        # Get query parameters
        page = int(request.GET.get('page', 1))
        sku = request.GET.get('sku', '').strip()
        name = request.GET.get('name', '').strip()
        active = request.GET.get('active', '')
        
        # Build query
        products = Product.objects.all()
        
        if sku:
            products = products.filter(sku__icontains=sku.lower())
        if name:
            products = products.filter(name__icontains=name)
        if active:
            products = products.filter(active=(active.lower() == 'true'))
        
        # Paginate
        paginator = Paginator(products, 50)
        page_obj = paginator.get_page(page)
        
        response = JsonResponse({
            'products': [{
                'id': str(p.id),
                'sku': p.sku,
                'name': p.name,
                'description': p.description,
                'price': str(p.price),
                'active': p.active,
                'created_at': p.created_at.isoformat(),
                'updated_at': p.updated_at.isoformat(),
            } for p in page_obj],
            'page': page,
            'total_pages': paginator.num_pages,
            'total_count': paginator.count,
        })
        
        # Prevent caching
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_product(request):
    """Create a new product"""
    try:
        data = json.loads(request.body)
        
        product = Product.objects.create(
            sku=data['sku'].lower(),
            name=data['name'],
            description=data.get('description', ''),
            price=data['price'],
            active=data.get('active', True)
        )
        
        return JsonResponse({
            'id': str(product.id),
            'sku': product.sku,
            'name': product.name,
            'description': product.description,
            'price': str(product.price),
            'active': product.active,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PUT"])
def update_product(request, product_id):
    """Update a product"""
    try:
        product = Product.objects.get(id=product_id)
        data = json.loads(request.body)
        
        if 'sku' in data:
            product.sku = data['sku'].lower()
        if 'name' in data:
            product.name = data['name']
        if 'description' in data:
            product.description = data['description']
        if 'price' in data:
            product.price = data['price']
        if 'active' in data:
            product.active = data['active']
        
        product.save()
        
        return JsonResponse({
            'id': str(product.id),
            'sku': product.sku,
            'name': product.name,
            'description': product.description,
            'price': str(product.price),
            'active': product.active,
        })
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_product(request, product_id):
    """Delete a product"""
    try:
        product = Product.objects.get(id=product_id)
        product.delete()
        return JsonResponse({'message': 'Product deleted'})
    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["DELETE"])
def bulk_delete(request):
    """Delete all products synchronously"""
    try:
        # Get count before deletion
        count = Product.objects.count()
        
        # Delete all products immediately (not async)
        Product.objects.all().delete()
        
        return JsonResponse({
            'message': f'Successfully deleted {count} products',
            'deleted_count': count
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
