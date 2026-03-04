from typing import Type
from rest_framework import viewsets, filters
from rest_framework import serializers as drf_serializers
from django_filters.rest_framework import DjangoFilterBackend
from .models import ObraSocial, Cliente
from .serializers import (
    ObraSocialSerializer,
    ClienteSerializer,
    ClienteListSerializer,
)


class ObraSocialViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Obras Sociales.

    Provee operaciones CRUD completas: listar, crear, obtener,
    actualizar y eliminar obras sociales, con soporte de búsqueda
    y ordenamiento por nombre.

    La paginación está deshabilitada ya que es un catálogo pequeño
    que se usa como selector en formularios.
    """

    queryset = ObraSocial.objects.all()
    serializer_class = ObraSocialSerializer
    pagination_class = None
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
