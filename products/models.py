from django.db import models
import uuid


class Product(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sku = models.CharField(max_length=255, unique=True, db_index=True)
    name = models.TextField()
    description = models.TextField(blank=True, default='')
    price = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['active']),
            models.Index(fields=['created_at']),
            models.Index(fields=['active', 'created_at']),  # Composite index for filtering
        ]

    def save(self, *args, **kwargs):
        # Convert SKU to lowercase for case-insensitive uniqueness
        self.sku = self.sku.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.sku} - {self.name}"
