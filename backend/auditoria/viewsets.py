"""
ViewSet centralizado de auditoría del sistema.

Consulta el modelo RegistroAuditoria y expone un endpoint paginado
con filtros por modelo, acción, usuario y fecha.
"""

from rest_framework import viewsets, status
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from auditoria.models import RegistroAuditoria
from config.pagination import StandardPagination


class AuditoriaViewSet(viewsets.ViewSet):
    """
    ViewSet de solo lectura para el historial centralizado de auditoría.

    Expone los registros del modelo RegistroAuditoria con paginación
    y filtros por modelo, acción, usuario y fecha.

    Filtros disponibles (query params):
        - modelo: compra | venta | producto | turno
        - accion: crear | editar | eliminar
        - usuario: username parcial (icontains)
        - fecha_desde: YYYY-MM-DD inclusiva
        - fecha_hasta: YYYY-MM-DD inclusiva

    Requiere permiso: authentication.ver_auditoria o is_superuser
    """

    permission_classes = [IsAuthenticated]
    pagination_class = StandardPagination

    def _tiene_permiso(self, request: Request) -> bool:
        """Verifica si el usuario tiene el permiso de auditoría o es superusuario."""
        return (
            request.user.is_superuser
            or request.user.has_perm("authentication.ver_auditoria")
        )

    def list(self, request: Request) -> Response:
        """
        Retorna el historial de auditoría paginado y filtrado.

        Args:
            request: Objeto Request de DRF con los query params de filtro.

        Returns:
            Response paginada con la lista de registros de auditoría.
            HTTP 403 si el usuario no tiene el permiso requerido.
        """
        if not self._tiene_permiso(request):
            return Response(
                {"detail": "No tenés permiso para acceder a la auditoría."},
                status=status.HTTP_403_FORBIDDEN,
            )

        filtro_modelo = request.query_params.get("modelo", "").strip().lower()
        filtro_accion = request.query_params.get("accion", "").strip().lower()
        filtro_usuario = request.query_params.get("usuario", "").strip()
        fecha_desde = request.query_params.get("fecha_desde", "").strip()
        fecha_hasta = request.query_params.get("fecha_hasta", "").strip()

        qs = RegistroAuditoria.objects.select_related("usuario").order_by("-fecha")

        if filtro_modelo:
            qs = qs.filter(modelo=filtro_modelo)
        if filtro_accion:
            qs = qs.filter(accion=filtro_accion)
        if filtro_usuario:
            qs = qs.filter(usuario__username__icontains=filtro_usuario)
        if fecha_desde:
            qs = qs.filter(fecha__date__gte=fecha_desde)
        if fecha_hasta:
            qs = qs.filter(fecha__date__lte=fecha_hasta)

        paginator = self.pagination_class()
        page = paginator.paginate_queryset(qs, request)

        datos = [_serializar(registro) for registro in (page or [])]
        return paginator.get_paginated_response(datos)

    def modelos(self, request: Request) -> Response:
        """
        Retorna la lista de modelos auditados disponibles para el filtro.

        Returns:
            Response con lista de objetos {"key": str, "label": str}.
            HTTP 403 si el usuario no tiene el permiso requerido.
        """
        if not self._tiene_permiso(request):
            return Response(
                {"detail": "No tenés permiso para acceder a la auditoría."},
                status=status.HTTP_403_FORBIDDEN,
            )

        resultado = [
            {"key": clave, "label": label}
            for clave, label in RegistroAuditoria.MODELOS
        ]
        return Response(resultado)


def _serializar(registro: RegistroAuditoria) -> dict:
    """
    Serializa un RegistroAuditoria a dict para la respuesta de la API.

    Args:
        registro: Instancia de RegistroAuditoria con select_related("usuario").

    Returns:
        Dict normalizado para la respuesta JSON.
    """
    return {
        "id": registro.id,
        "fecha": registro.fecha.isoformat(),
        "usuario": registro.usuario.username if registro.usuario else "sistema",
        "accion": registro.accion,
        "accion_display": registro.get_accion_display(),
        "modelo": registro.modelo,
        "modelo_display": registro.get_modelo_display(),
        "objeto_id": registro.objeto_id,
        "detalle": registro.detalle,
    }
