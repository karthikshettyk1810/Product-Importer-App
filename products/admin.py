from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['sku', 'name', 'price', 'active', 'created_at']
    list_filter = ['active', 'created_at']
    search_fields = ['sku', 'name', 'description']
    readonly_fields = ['id', 'created_at', 'updated_at']

