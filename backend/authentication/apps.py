"""
Configuración de la app de autenticación JWT.
"""

from django.apps import AppConfig


class AuthenticationConfig(AppConfig):
    """Configuración de la aplicación de autenticación."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "authentication"
    verbose_name = "Autenticación"
