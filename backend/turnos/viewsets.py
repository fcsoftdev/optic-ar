"""
ViewSet para la API REST de Turnos.
"""

import django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

from .models import ConfiguracionCalendario, Turno
from .serializers import ConfiguracionCalendarioSerializer, TurnoSerializer


class TurnoFilter(django_filters.FilterSet):
    """
    Filtros personalizados para el ViewSet de Turnos.

    Permite filtrar por rango de fechas usando los parámetros
    ``start`` y ``end`` (compatibles con FullCalendar).
    """

    start = django_filters.DateFilter(field_name="fecha", lookup_expr="gte")
    end = django_filters.DateFilter(field_name="fecha", lookup_expr="lte")

    class Meta:
        model = Turno
        fields = ["cliente", "start", "end"]


class TurnoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Turnos.

    Provee operaciones CRUD completas. La paginación está deshabilitada
    para que FullCalendar reciba todos los eventos del rango solicitado
    en una sola respuesta.

    Filtros disponibles:
        - ``start``: fecha >= start (FullCalendar dateStr)
        - ``end``: fecha <= end
        - ``cliente``: ID del cliente
        - ``search``: búsqueda por nombre o apellido del cliente
    """

    queryset = Turno.objects.select_related("cliente").all()
    serializer_class = TurnoSerializer
    pagination_class = None  # FullCalendar necesita todos los eventos del rango
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_class = TurnoFilter
    search_fields = ["cliente__nombre_apellido"]
    ordering_fields = ["fecha", "hora_inicio"]
    ordering = ["fecha", "hora_inicio"]


class ConfiguracionCalendarioViewSet(viewsets.GenericViewSet):
    """
    ViewSet para gestionar la configuración activa del calendario.

    Expone un único endpoint ``/api/configuracion-calendario/activa/``
    que soporta GET (obtener) y PATCH (actualizar parcialmente).
    Si no existe ninguna configuración activa, la crea automáticamente
    con valores por defecto.
    """

    serializer_class = ConfiguracionCalendarioSerializer
    queryset = ConfiguracionCalendario.objects.all()

    @action(detail=False, methods=["get", "patch"], url_path="activa")
    def activa(self, request) -> Response:
        """
        Obtiene o actualiza la configuración activa del calendario.

        Args:
            request: Petición HTTP (GET o PATCH).

        Returns:
            Datos serializados de la configuración activa.
        """
        config = ConfiguracionCalendario.get_configuracion_activa()
        if not config:
            config = ConfiguracionCalendario.objects.create()

        if request.method == "PATCH":
            serializer = self.get_serializer(config, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

        return Response(self.get_serializer(config).data)
