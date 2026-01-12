from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views, viewsets

router = DefaultRouter()
router.register(r"marcas", viewsets.MarcaViewSet, basename="marca")
router.register(r"categorias", viewsets.CategoriaViewSet, basename="categoria")
router.register(r"subcategorias", viewsets.SubCategoriaViewSet, basename="subcategoria")
router.register(r"productos", viewsets.ProductoViewSet, basename="producto")

urlpatterns = [
    path("", include(router.urls)),
    path("get_subcategorias/", views.get_subcategorias, name="get_subcategorias"),
]
