import requests
import time
from .models import Webhook
from celery import shared_task


@shared_task
def trigger_webhook(event_type, payload):
    """Trigger webhooks for a specific event type"""
    webhooks = Webhook.objects.filter(event_type=event_type, enabled=True)
    
    for webhook in webhooks:
        try:
            start_time = time.time()
            response = requests.post(
                webhook.url,
                json=payload,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )
            response_time = time.time() - start_time
            
            webhook.last_status = response.status_code
            webhook.last_response_time = response_time
            webhook.save()
            
        except Exception as e:
            webhook.last_status = 0
            webhook.save()
            print(f"Webhook error: {e}")


def test_webhook_sync(webhook_id):
    """Test a webhook synchronously and return results"""
    try:
        webhook = Webhook.objects.get(id=webhook_id)
        
        test_payload = {
            'test': True,
            'event_type': webhook.event_type,
            'timestamp': time.time()
        }
        
        start_time = time.time()
        response = requests.post(
            webhook.url,
            json=test_payload,
            timeout=10,
            headers={'Content-Type': 'application/json'}
        )
        response_time = time.time() - start_time
        
        webhook.last_status = response.status_code
        webhook.last_response_time = response_time
        webhook.save()
        
        return {
            'status': response.status_code,
            'response_time': round(response_time, 3),
            'body': response.text[:200] if response.text else ''
        }
        
    except requests.exceptions.Timeout:
        return {'status': 0, 'error': 'Request timeout'}
    except requests.exceptions.RequestException as e:
        return {'status': 0, 'error': str(e)}
    except Exception as e:
        return {'status': 0, 'error': str(e)}
