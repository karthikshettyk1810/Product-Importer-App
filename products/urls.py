from django.urls import path
from . import views

urlpatterns = [
    # API endpoints only
    path('api/products/', views.get_products, name='get_products'),
    path('api/products/create/', views.create_product, name='create_product'),
    path('api/products/<uuid:product_id>/', views.update_product, name='update_product'),
    path('api/products/<uuid:product_id>/delete/', views.delete_product, name='delete_product'),
    path('api/products/bulk-delete/', views.bulk_delete, name='bulk_delete'),
    path('api/upload/', views.upload_csv, name='upload_csv'),
    path('api/upload/status/<str:task_id>/', views.upload_status, name='upload_status'),
    path('api/upload/progress/<str:task_id>/', views.upload_progress_sse, name='upload_progress'),
]
