from typing import Type
from rest_framework import viewsets, filters
from rest_framework import serializers as drf_serializers
from django_filters import rest_framework as df_filters
from django_filters.rest_framework import DjangoFilterBackend

from auditoria.services import (
    capturar_estado_venta,
    diff_venta,
    registrar,
    snapshot_venta,
)

from .models import ObraSocial, Cliente, Consulta, Venta
from .serializers import (
    ObraSocialSerializer,
    ClienteSerializer,
    ClienteListSerializer,
    ConsultaSerializer,
    ConsultaListSerializer,
    VentaSerializer,
    VentaListSerializer,
)


class ConsultaFilter(df_filters.FilterSet):
    """
    FilterSet para el modelo Consulta con filtrado por rango de fechas.

    Permite filtrar consultas por cliente y por rango de fechas
    usando los parámetros `fecha_desde` y `fecha_hasta`.
    """

    fecha_desde = df_filters.DateFilter(field_name="fecha", lookup_expr="gte")
    fecha_hasta = df_filters.DateFilter(field_name="fecha", lookup_expr="lte")

    class Meta:
        model = Consulta
        fields = ["cliente", "fecha_desde", "fecha_hasta"]


class ObraSocialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Obras Sociales.

    Provee operaciones CRUD completas: listar, crear, obtener,
    actualizar y eliminar obras sociales, con soporte de búsqueda
    y ordenamiento por nombre.

    Soporta paginación estándar y el parámetro ``page_size`` para
    obtener todos los registros en un único request (ej: selectores).
    """

    queryset = ObraSocial.objects.all()
    serializer_class = ObraSocialSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]
    ordering = ["nombre"]


class ClienteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Clientes/Pacientes.

    Provee operaciones CRUD completas con soporte de búsqueda por
    DNI, nombre o email, filtrado por obra social y ordenamiento.
    Usa un serializer simplificado para listados y uno completo
    para detalle, creación y edición.
    """

    queryset = Cliente.objects.select_related("obra_social").all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["obra_social"]
    search_fields = ["dni", "apellido", "nombre", "mail"]
    ordering_fields = ["apellido", "nombre", "dni", "fecha_nacimiento"]
    ordering = ["apellido", "nombre"]

    def get_serializer_class(self) -> Type[drf_serializers.Serializer]:
        """
        Selecciona el serializer según la acción actual.

        Returns:
            Type[Serializer]: ClienteListSerializer para listados,
            ClienteSerializer para el resto de acciones.
        """
        if self.action == "list":
            return ClienteListSerializer
        return ClienteSerializer


class ConsultaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Consultas médicas.

    Provee operaciones CRUD completas con soporte de búsqueda por
    nombre del paciente o motivo, filtrado por cliente y fecha,
    y ordenamiento por fecha descendente.
    Usa un serializer simplificado para listados y uno completo
    (con graduación anidada) para detalle, creación y edición.
    """

    queryset = (
        Consulta.objects.select_related("cliente").prefetch_related("graduacion").all()
    )
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = ConsultaFilter
    search_fields = ["cliente__apellido", "cliente__nombre", "motivo"]
    ordering_fields = ["fecha", "cliente__apellido"]
    ordering = ["-fecha"]

    def get_serializer_class(self) -> Type[drf_serializers.Serializer]:
        """
        Selecciona el serializer según la acción actual.

        Returns:
            Type[Serializer]: ConsultaListSerializer para listados,
            ConsultaSerializer para el resto de acciones.
        """
        if self.action == "list":
            return ConsultaListSerializer
        return ConsultaSerializer


class VentaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Ventas.

    Provee operaciones CRUD completas. Usa ``VentaListSerializer``
    para el listado (sin detalles) y ``VentaSerializer`` para
    crear, ver y actualizar ventas con sus ítems anidados.

    Al eliminar una venta, la señal ``devolver_stock_al_eliminar_venta``
    restaura automáticamente el stock de los productos involucrados.

    Registra un RegistroAuditoria por cada operación crear/editar/eliminar.
    """

    queryset = (
        Venta.objects.select_related("cliente")
        .prefetch_related("detalles_ventas__producto")
        .all()
    )
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["cliente", "forma_pago"]
    search_fields = ["cliente__apellido", "cliente__nombre", "cliente__dni"]
    ordering_fields = ["fecha", "total_venta"]
    ordering = ["-fecha"]

    def get_serializer_class(self) -> Type[drf_serializers.Serializer]:
        """
        Selecciona el serializer según la acción actual.

        Returns:
            Type[Serializer]: VentaListSerializer para listados,
            VentaSerializer para el resto de acciones.
        """
        if self.action == "list":
            return VentaListSerializer
        return VentaSerializer

    def create(self, request, *args, **kwargs):
        """Crea una Venta y registra el evento de auditoría."""
        response = super().create(request, *args, **kwargs)
        instance = (
            Venta.objects.select_related("cliente")
            .prefetch_related("detalles_ventas__producto")
            .get(pk=response.data["id"])
        )
        registrar(request.user, "crear", "venta", instance.id, snapshot_venta(instance))
        return response

    def update(self, request, *args, **kwargs):
        """Actualiza una Venta y registra el diff en auditoría."""
        instance = self.get_object()
        estado_antes = capturar_estado_venta(instance)
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        detalle = diff_venta(estado_antes, instance)
        registrar(request.user, "editar", "venta", instance.id, detalle)
        return response

    def destroy(self, request, *args, **kwargs):
        """Elimina una Venta y registra el snapshot en auditoría."""
        instance = self.get_object()
        detalle = snapshot_venta(instance)
        objeto_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        registrar(request.user, "eliminar", "venta", objeto_id, detalle)
        return response
