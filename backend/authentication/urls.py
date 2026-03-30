"""
URLs del módulo de autenticación JWT y ABM de usuarios/grupos.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import LoginView, LogoutView, PerfilView, RefreshView
from .viewsets import GroupViewSet, PermissionViewSet, UserViewSet

router = DefaultRouter()
router.register(r"usuarios", UserViewSet, basename="usuario")
router.register(r"grupos", GroupViewSet, basename="grupo")
router.register(r"permisos", PermissionViewSet, basename="permiso")

urlpatterns = [
    path("token/", LoginView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", RefreshView.as_view(), name="token_refresh"),
    path("token/logout/", LogoutView.as_view(), name="token_logout"),
    path("perfil/", PerfilView.as_view(), name="perfil"),
    path("", include(router.urls)),
]
