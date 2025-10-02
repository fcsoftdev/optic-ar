from django.contrib import admin
from django.contrib.admin import AdminSite


class CustomAdminSite(AdminSite):
    """Sitio de administración personalizado con CSS custom"""

    class Media:
        css = {"all": ("admin/css/custom_admin.css",)}


# Sobrescribir el admin site por defecto si se desea
# admin.site = CustomAdminSite(name='custom_admin')
