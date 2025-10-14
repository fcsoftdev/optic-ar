from django.conf import settings
from django.apps import AppConfig
from django.apps import apps as django_apps


class OpticArConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "config"

    def ready(self):
        from django.contrib import admin

        # Importar el admin personalizado
        from . import admin as custom_admin

        admin.site.site_header = "Optica Punto de Vista"
        admin.site.site_title = "Sistema de Ópticas"
        admin.site.index_title = "Panel de administración"
        admin.site.site_url = None
