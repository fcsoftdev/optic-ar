from typing import Type

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers as drf_serializers, viewsets

from .models import Compra, Proveedor
from .serializers import CompraListSerializer, CompraSerializer, ProveedorSerializer


class ProveedorViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Proveedores.

    Provee operaciones CRUD completas con soporte de búsqueda
    por nombre o alias y ordenamiento.
    """

    queryset = Proveedor.objects.all()
    serializer_class = ProveedorSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre", "alias"]
    ordering_fields = ["nombre"]
    ordering = ["nombre"]


class CompraViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Compras.

    Usa ``CompraListSerializer`` para el listado y ``CompraSerializer``
    para crear, ver y actualizar compras con sus ítems anidados.

    Al crear o actualizar, el modelo ``DetalleCompra.save()`` actualiza
    automáticamente el stock y los precios de los productos involucrados.

    Al eliminar una Compra, la señal ``descontar_stock_al_eliminar_compra``
    restaura el stock de todos los productos involucrados.
    """

    queryset = (
        Compra.objects.select_related("proveedor")
        .prefetch_related("detalles_productos__producto")
        .all()
    )
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["proveedor"]
    search_fields = ["proveedor__nombre"]
    ordering_fields = ["fecha", "total"]
    ordering = ["-fecha"]

    def get_serializer_class(self) -> Type[drf_serializers.Serializer]:
        """
        Selecciona el serializer según la acción actual.

        Returns:
            Type[Serializer]: CompraListSerializer para listados,
            CompraSerializer para el resto de acciones.
        """
        if self.action == "list":
            return CompraListSerializer
        return CompraSerializer
