from django.contrib import admin
from django.contrib.admin import AdminSite


class CustomAdminSite(AdminSite):
    """Sitio de administración personalizado con CSS custom y permisos"""

    class Media:
        css = {"all": ("admin/css/custom_admin.css",)}

    def has_permission(self, request):
        """
        Permite acceso al admin para usuarios staff.
        """
        return request.user.is_active and request.user.is_staff

    def get_app_list(self, request):
        """
        Personaliza la lista de aplicaciones mostradas según el tipo de usuario.
        Para usuarios no superusuarios, SOLO muestra el calendario de turnos.
        """
        app_list = super().get_app_list(request)

        if not request.user.is_superuser:
            # Para usuarios no superusuarios, construir lista personalizada
            filtered_app_list = []

            # Siempre agregar turnos con solo el calendario para usuarios staff
            if request.user.is_staff:
                turnos_app = {
                    "name": "SISTEMA DE TURNOS",
                    "app_label": "turnos",
                    "app_url": "/admin/turnos/",
                    "has_module_perms": True,
                    "models": [
                        {
                            "name": "Calendario de Turnos",
                            "object_name": "CalendarioTurnos",
                            "perms": {
                                "add": False,
                                "change": False,
                                "delete": False,
                                "view": True,
                            },
                            "admin_url": "/admin/calendario-turnos/",
                            "add_url": None,
                            "view_only": True,
                        }
                    ],
                }
                filtered_app_list.append(turnos_app)

            # Agregar otras apps que el usuario pueda ver
            for app in app_list:
                if app["app_label"] != "turnos" and app.get("models"):
                    # Filtrar modelos sin permisos de visualización
                    visible_models = [
                        m
                        for m in app["models"]
                        if m.get("perms", {}).get("view", False)
                    ]
                    if visible_models:
                        app["models"] = visible_models
                        filtered_app_list.append(app)

            return filtered_app_list

        return app_list


# Aplicar el admin personalizado
admin.site.__class__ = CustomAdminSite
