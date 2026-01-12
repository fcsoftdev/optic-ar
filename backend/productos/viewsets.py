from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Marca, Categoria, SubCategoria, Producto
from .serializers import (
    MarcaSerializer,
    CategoriaSerializer,
    SubCategoriaSerializer,
    ProductoSerializer,
    ProductoListSerializer,
)


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]
    ordering = ["nombre"]


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]
    ordering = ["nombre"]


class SubCategoriaViewSet(viewsets.ModelViewSet):
    queryset = SubCategoria.objects.select_related("categoria").all()
    serializer_class = SubCategoriaSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["categoria"]
    search_fields = ["nombre", "categoria__nombre"]
    ordering_fields = ["nombre", "categoria__nombre"]
    ordering = ["categoria__nombre", "nombre"]


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.select_related(
        "marca", "categoria", "sub_categoria"
    ).all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["marca", "categoria", "sub_categoria"]
    search_fields = ["codigo", "nombre", "descripcion"]
    ordering_fields = ["codigo", "nombre", "precio_venta", "stock"]
    ordering = ["codigo"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductoListSerializer
        return ProductoSerializer
