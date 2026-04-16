"""
URLs del módulo de auditoría centralizada.

Registra los endpoints REST para consultar el historial de cambios del sistema.
"""

from django.urls import path
from .viewsets import AuditoriaViewSet

auditoria_list = AuditoriaViewSet.as_view({"get": "list"})
auditoria_modelos = AuditoriaViewSet.as_view({"get": "modelos"})

urlpatterns = [
    path("auditoria/", auditoria_list, name="auditoria-list"),
    path("auditoria/modelos/", auditoria_modelos, name="auditoria-modelos"),
]
