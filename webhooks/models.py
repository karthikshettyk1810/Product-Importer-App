from django.db import models
import uuid


class Webhook(models.Model):
    EVENT_CHOICES = [
        ('product.created', 'Product Created'),
        ('product.updated', 'Product Updated'),
        ('upload.completed', 'Upload Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    url = models.URLField(max_length=500)
    event_type = models.CharField(max_length=50, choices=EVENT_CHOICES)
    enabled = models.BooleanField(default=True)
    last_status = models.IntegerField(null=True, blank=True)
    last_response_time = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} -> {self.url}"
