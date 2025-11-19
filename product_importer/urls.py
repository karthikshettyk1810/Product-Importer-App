from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', lambda request: redirect('dashboard/')),
    path('admin/', admin.site.urls),
    path('dashboard/', include('products.urls')),
    path('products/', include('products.urls')),
    path('webhooks/', include('webhooks.urls')),
]

# Serve static files in production
urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
