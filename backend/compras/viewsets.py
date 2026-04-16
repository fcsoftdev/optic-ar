from typing import Type

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, serializers as drf_serializers, viewsets

from auditoria.services import (
    capturar_estado_compra,
    diff_compra,
    registrar,
    snapshot_compra,
)

from .models import Compra, Gasto, Proveedor
from .serializers import (
    CompraListSerializer,
    CompraSerializer,
    GastoSerializer,
    ProveedorSerializer,
)


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

    Registra un RegistroAuditoria por cada operación crear/editar/eliminar.
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

    def create(self, request, *args, **kwargs):
        """Crea una Compra y registra el evento de auditoría."""
        response = super().create(request, *args, **kwargs)
        instance = (
            Compra.objects.select_related("proveedor")
            .prefetch_related("detalles_productos__producto")
            .get(pk=response.data["id"])
        )
        registrar(request.user, "crear", "compra", instance.id, snapshot_compra(instance))
        return response

    def update(self, request, *args, **kwargs):
        """Actualiza una Compra y registra el diff en auditoría."""
        instance = self.get_object()
        estado_antes = capturar_estado_compra(instance)
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        detalle = diff_compra(estado_antes, instance)
        registrar(request.user, "editar", "compra", instance.id, detalle)
        return response

    def destroy(self, request, *args, **kwargs):
        """Elimina una Compra y registra el snapshot en auditoría."""
        instance = self.get_object()
        detalle = snapshot_compra(instance)
        objeto_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        registrar(request.user, "eliminar", "compra", objeto_id, detalle)
        return response


class GastoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Gastos.

    Provee operaciones CRUD completas con soporte de búsqueda
    por descripción y ordenamiento por fecha y total.
    """

    queryset = Gasto.objects.all()
    serializer_class = GastoSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["descripcion"]
    ordering_fields = ["fecha", "total"]
    ordering = ["-fecha"]
