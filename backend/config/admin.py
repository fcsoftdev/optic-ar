from typing import Any, Optional

from django.contrib import admin
from django.contrib.admin import AdminSite
from django.http import HttpRequest


class CustomAdminSite(AdminSite):
    """Sitio de administración personalizado con CSS custom y permisos"""

    class Media:
        css = {"all": ("admin/css/custom_admin.css",)}

    def has_permission(self, request: HttpRequest) -> bool:
        """
        Permite acceso al admin para usuarios staff.
        """
        return request.user.is_active and request.user.is_staff

    def get_app_list(
        self, request: HttpRequest, app_label: Optional[str] = None
    ) -> list[dict[str, Any]]:
        """
        Personaliza la lista de aplicaciones mostradas según el tipo de usuario.

        Todos los usuarios staff pueden ver:
        - SISTEMA DE TURNOS: Calendario de Turnos
        - CONTABILIDAD: Reporte de Caja

        Los superusuarios ven todo completo.
        """
        app_list = super().get_app_list(request, app_label)

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
                if app["app_label"] == "turnos":
                    # Ya agregamos turnos manualmente arriba
                    continue
                elif app["app_label"] == "contabilidad":
                    # Para contabilidad, siempre mostrar "Reporte de Caja" para usuarios staff
                    contabilidad_models = []

                    # Agregar Reporte de Caja como primer elemento
                    reporte_caja_model = {
                        "name": "Reporte de Caja",
                        "object_name": "ReporteCaja",
                        "perms": {
                            "add": False,
                            "change": False,
                            "delete": False,
                            "view": True,
                        },
                        "admin_url": "/admin/reporte-caja/",
                        "add_url": None,
                        "view_only": True,
                    }
                    contabilidad_models.append(reporte_caja_model)

                    # Agregar otros modelos con permisos
                    visible_models = [
                        m
                        for m in app.get("models", [])
                        if m.get("perms", {}).get("view", False)
                    ]
                    contabilidad_models.extend(visible_models)

                    if contabilidad_models:
                        contabilidad_app = {
                            "name": "CONTABILIDAD",
                            "app_label": "contabilidad",
                            "app_url": "/admin/contabilidad/",
                            "has_module_perms": True,
                            "models": contabilidad_models,
                        }
                        filtered_app_list.append(contabilidad_app)
                elif app.get("models"):
                    # Otras apps: filtrar modelos sin permisos de visualización
                    visible_models = [
                        m
                        for m in app["models"]
                        if m.get("perms", {}).get("view", False)
                    ]
                    if visible_models:
                        app["models"] = visible_models
                        filtered_app_list.append(app)

            return filtered_app_list

        # Para superusuarios, agregar "Reporte de Caja" a la app Contabilidad
        for app in app_list:
            if app["app_label"] == "contabilidad":
                # Agregar el reporte de caja como primer elemento
                reporte_caja_model = {
                    "name": "Reporte de Caja",
                    "object_name": "ReporteCaja",
                    "perms": {
                        "add": False,
                        "change": False,
                        "delete": False,
                        "view": True,
                    },
                    "admin_url": "/admin/reporte-caja/",
                    "add_url": None,
                    "view_only": True,
                }
                app["models"].insert(0, reporte_caja_model)
                break

        return app_list


# Aplicar el admin personalizado
admin.site.__class__ = CustomAdminSite
