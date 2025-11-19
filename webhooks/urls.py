from django.urls import path
from . import views

urlpatterns = [
    # API endpoints only
    path('api/webhooks/', views.get_webhooks, name='get_webhooks'),
    path('api/webhooks/create/', views.create_webhook, name='create_webhook'),
    path('api/webhooks/<uuid:webhook_id>/', views.update_webhook, name='update_webhook'),
    path('api/webhooks/<uuid:webhook_id>/delete/', views.delete_webhook, name='delete_webhook'),
    path('api/webhooks/<uuid:webhook_id>/test/', views.test_webhook, name='test_webhook'),
]
