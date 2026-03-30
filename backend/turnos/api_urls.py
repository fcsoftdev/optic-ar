"""
URLs de la API REST de Turnos (DRF ViewSet).

Este archivo es independiente del urls.py existente que sirve
las vistas Django-template. Ambos conviven sin conflicto.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import viewsets

router = DefaultRouter()
router.register(r"turnos", viewsets.TurnoViewSet, basename="turno-api")
router.register(
    r"configuracion-calendario",
    viewsets.ConfiguracionCalendarioViewSet,
    basename="config-calendario",
)

urlpatterns = [
    path("", include(router.urls)),
]
