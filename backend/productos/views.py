"""
ViewSets para la API REST de productos.
"""

from django.http import JsonResponse
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Marca, Categoria, SubCategoria, Producto
from .serializers import (
    MarcaSerializer,
    CategoriaSerializer,
    SubCategoriaSerializer,
    SubCategoriaListSerializer,
    ProductoSerializer,
    ProductoListSerializer,
)


class MarcaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Marcas.
    Proporciona operaciones CRUD completas.
    """

    queryset = Marca.objects.all().order_by("nombre")
    serializer_class = MarcaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]


class CategoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Categorías.
    Proporciona operaciones CRUD completas.
    """

    queryset = Categoria.objects.all().order_by("nombre")
    serializer_class = CategoriaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]


class SubCategoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar SubCategorías.
    Proporciona operaciones CRUD completas y filtrado por categoría.
    """

    queryset = SubCategoria.objects.select_related("categoria").all()
    serializer_class = SubCategoriaSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["categoria"]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]

    @action(detail=False, methods=["get"])
    def por_categoria(self, request):
        """
        Endpoint personalizado para obtener subcategorías por categoría.
        URL: /api/subcategorias/por_categoria/?categoria_id=1
        """
        categoria_id = request.query_params.get("categoria_id")
        if not categoria_id:
            return Response(
                {"error": "Se requiere el parámetro categoria_id"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        subcategorias = self.queryset.filter(categoria_id=categoria_id)
        serializer = SubCategoriaListSerializer(subcategorias, many=True)
        return Response(serializer.data)


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Productos.
    Proporciona operaciones CRUD completas con filtros avanzados.
    """

    queryset = (
        Producto.objects.select_related("marca", "categoria", "sub_categoria")
        .all()
        .order_by("-id")
    )
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["marca", "categoria", "sub_categoria"]
    search_fields = ["codigo", "nombre", "descripcion"]
    ordering_fields = ["nombre", "precio_venta", "stock", "id"]

    def get_serializer_class(self):
        """
        Usa serializer simplificado para listado y completo para detalle.
        """
        if self.action == "list":
            return ProductoListSerializer
        return ProductoSerializer

    @action(detail=False, methods=["get"])
    def bajo_stock(self, request):
        """
        Endpoint para obtener productos con stock bajo (<=5 unidades).
        URL: /api/productos/bajo_stock/
        """
        productos = self.queryset.filter(stock__lte=5)
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def sin_stock(self, request):
        """
        Endpoint para obtener productos sin stock.
        URL: /api/productos/sin_stock/
        """
        productos = self.queryset.filter(stock=0)
        serializer = self.get_serializer(productos, many=True)
        return Response(serializer.data)


# Vista legacy para compatibilidad con código existente
def get_subcategorias(request):
    """
    Vista legacy para obtener subcategorías.
    Mantener para compatibilidad con admin de Django.
    """
    categoria_id = request.GET.get("categoria_id")
    subcategorias = []

    if categoria_id:
        subcategorias = list(
            SubCategoria.objects.filter(categoria_id=categoria_id).values(
                "id", "nombre"
            )
        )

    return JsonResponse({"subcategorias": subcategorias})
