"""
ViewSets del módulo de autenticación/autorización.

Expone:
- UserViewSet: CRUD de usuarios (solo superusuarios)
- GroupViewSet: CRUD de grupos (solo superusuarios)
- PermissionViewSet: Listado de permisos disponibles (solo superusuarios)
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from rest_framework import viewsets, filters
from rest_framework.permissions import IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend

from .serializers import (
    GroupSerializer,
    PermissionSerializer,
    UserListSerializer,
    UserSerializer,
)

User = get_user_model()

# Filtros de permisos relevantes al dominio de la aplicación
APPS_RELEVANTES = [
    "productos",
    "ventas",
    "compras",
    "contabilidad",
    "turnos",
    "auth",
]


class UserViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de usuarios del sistema.

    Solo accesible por usuarios con is_staff=True (administradores).
    - list: GET /api/usuarios/
    - create: POST /api/usuarios/
    - retrieve: GET /api/usuarios/{id}/
    - update: PUT /api/usuarios/{id}/
    - partial_update: PATCH /api/usuarios/{id}/
    - destroy: DELETE /api/usuarios/{id}/
    """

    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["username", "email", "first_name", "last_name"]
    ordering_fields = ["username", "email", "date_joined"]
    ordering = ["username"]

    def get_queryset(self):
        """Excluye al usuario actual de la lista para evitar auto-eliminación."""
        return (
            User.objects.exclude(pk=self.request.user.pk)
            .prefetch_related("groups", "user_permissions")
            .order_by("username")
        )

    def get_serializer_class(self):
        """Usa el serializer simplificado solo en el listado."""
        if self.action == "list":
            return UserListSerializer
        return UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    CRUD completo de grupos/roles del sistema.

    Solo accesible por usuarios con is_staff=True.
    - list: GET /api/grupos/
    - create: POST /api/grupos/
    - retrieve: GET /api/grupos/{id}/
    - update: PUT /api/grupos/{id}/
    - partial_update: PATCH /api/grupos/{id}/
    - destroy: DELETE /api/grupos/{id}/
    """

    queryset = Group.objects.prefetch_related("permissions").order_by("name")
    serializer_class = GroupSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [filters.SearchFilter]
    search_fields = ["name"]


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Listado de todos los permisos disponibles filtrados por las apps del dominio.

    Solo lectura. Usado por el frontend para construir los selectores de permisos.
    GET /api/permisos/
    """

    serializer_class = PermissionSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        """Retorna permisos de las apps relevantes al dominio del sistema."""
        return (
            Permission.objects.filter(content_type__app_label__in=APPS_RELEVANTES)
            .select_related("content_type")
            .order_by("content_type__app_label", "codename")
        )
