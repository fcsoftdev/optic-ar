from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import viewsets

router = DefaultRouter()
router.register(r"proveedores", viewsets.ProveedorViewSet, basename="proveedor")
router.register(r"compras", viewsets.CompraViewSet, basename="compra")

urlpatterns = [
    path("", include(router.urls)),
]
