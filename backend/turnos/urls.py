"""
URLs para el sistema de turnos.
"""

from django.urls import path
from . import views

app_name = "turnos"

urlpatterns = [
    # Vista principal del calendario
    path("", views.CalendarioView.as_view(), name="calendario"),
    path("calendario/", views.CalendarioView.as_view(), name="calendario"),
    # APIs para funcionalidad AJAX
    path(
        "api/buscar-clientes/",
        views.BuscarClientesAPI.as_view(),
        name="api_buscar_clientes",
    ),
    path("api/turnos-fecha/", views.TurnosFechaAPI.as_view(), name="api_turnos_fecha"),
    path("api/crear-turno/", views.CrearTurnoAPI.as_view(), name="api_crear_turno"),
    path(
        "api/actualizar-turno/",
        views.ActualizarTurnoAPI.as_view(),
        name="api_actualizar_turno",
    ),
    path(
        "api/eliminar-turno/<int:turno_id>/",
        views.EliminarTurnoAPI.as_view(),
        name="api_eliminar_turno",
    ),
    path(
        "api/turno/<int:turno_id>/",
        views.ObtenerTurnoAPI.as_view(),
        name="api_obtener_turno",
    ),
    path(
        "api/generar-pdf-turno/<int:turno_id>/",
        views.GenerarTurnoPDFView.as_view(),
        name="api_generar_pdf_turno",
    ),
]
