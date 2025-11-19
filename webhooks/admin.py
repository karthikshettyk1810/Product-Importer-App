from django.contrib import admin
from .models import Webhook


@admin.register(Webhook)
class WebhookAdmin(admin.ModelAdmin):
    list_display = ['url', 'event_type', 'enabled', 'last_status', 'last_response_time']
    list_filter = ['event_type', 'enabled']
    search_fields = ['url']
    readonly_fields = ['id', 'created_at', 'updated_at']
