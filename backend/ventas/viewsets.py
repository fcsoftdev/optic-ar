from typing import Type
from rest_framework import viewsets, filters
from rest_framework import serializers as drf_serializers
from django_filters import rest_framework as df_filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import ObraSocial, Cliente, Consulta
from .serializers import (
    ObraSocialSerializer,
    ClienteSerializer,
    ClienteListSerializer,
    ConsultaSerializer,
    ConsultaListSerializer,
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
    search_fields = ["dni", "nombre_apellido", "mail"]
    ordering_fields = ["nombre_apellido", "dni", "fecha_nacimiento"]
    ordering = ["nombre_apellido"]

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
        Consulta.objects.select_related("cliente")
        .prefetch_related("graduacion")
        .all()
    )
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = ConsultaFilter
    search_fields = ["cliente__nombre_apellido", "motivo"]
    ordering_fields = ["fecha", "cliente__nombre_apellido"]
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
