import json
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import Webhook
from .utils import test_webhook_sync


def webhook_list_view(request):
    """Webhook management page"""
    return render(request, 'webhooks.html')


@require_http_methods(["GET"])
def get_webhooks(request):
    """Get all webhooks"""
    try:
        webhooks = Webhook.objects.all()
        return JsonResponse({
            'webhooks': [{
                'id': str(w.id),
                'url': w.url,
                'event_type': w.event_type,
                'enabled': w.enabled,
                'last_status': w.last_status,
                'last_response_time': w.last_response_time,
                'created_at': w.created_at.isoformat(),
            } for w in webhooks]
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def create_webhook(request):
    """Create a new webhook"""
    try:
        data = json.loads(request.body)
        
        webhook = Webhook.objects.create(
            url=data['url'],
            event_type=data['event_type'],
            enabled=data.get('enabled', True)
        )
        
        return JsonResponse({
            'id': str(webhook.id),
            'url': webhook.url,
            'event_type': webhook.event_type,
            'enabled': webhook.enabled,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["PUT"])
def update_webhook(request, webhook_id):
    """Update a webhook"""
    try:
        webhook = Webhook.objects.get(id=webhook_id)
        data = json.loads(request.body)
        
        if 'url' in data:
            webhook.url = data['url']
        if 'event_type' in data:
            webhook.event_type = data['event_type']
        if 'enabled' in data:
            webhook.enabled = data['enabled']
        
        webhook.save()
        
        return JsonResponse({
            'id': str(webhook.id),
            'url': webhook.url,
            'event_type': webhook.event_type,
            'enabled': webhook.enabled,
        })
    except Webhook.DoesNotExist:
        return JsonResponse({'error': 'Webhook not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)


@csrf_exempt
@require_http_methods(["DELETE"])
def delete_webhook(request, webhook_id):
    """Delete a webhook"""
    try:
        webhook = Webhook.objects.get(id=webhook_id)
        webhook.delete()
        return JsonResponse({'message': 'Webhook deleted'})
    except Webhook.DoesNotExist:
        return JsonResponse({'error': 'Webhook not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@require_http_methods(["POST"])
def test_webhook(request, webhook_id):
    """Test a webhook"""
    try:
        result = test_webhook_sync(webhook_id)
        return JsonResponse(result)
    except Webhook.DoesNotExist:
        return JsonResponse({'error': 'Webhook not found'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
