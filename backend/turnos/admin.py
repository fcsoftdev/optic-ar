"""
Configuración del admin para el sistema de turnos.
"""

from django.contrib import admin
from django.urls import path
from django.shortcuts import redirect
from .models import Turno, ConfiguracionCalendario


def calendario_turnos_view(request):
    """Vista que redirecciona al calendario de turnos."""
    return redirect("turnos:calendario")


@admin.register(ConfiguracionCalendario)
class ConfiguracionCalendarioAdmin(admin.ModelAdmin):
    """Configuración del admin para ConfiguracionCalendario - Solo superusuarios."""

    list_display = [
        "nombre",
        "hora_apertura",
        "hora_cierre",
        "duracion_turno_default",
        "activa",
    ]
    list_filter = ["activa"]
    search_fields = ["nombre"]

    fieldsets = (
        ("Configuración General", {"fields": ("nombre", "activa")}),
        ("Horarios de Atención", {"fields": ("hora_apertura", "hora_cierre")}),
        ("Configuración de Turnos", {"fields": ("duracion_turno_default",)}),
    )

    def has_module_permission(self, request):
        """Permitir acceso al módulo turnos para staff."""
        return request.user.is_staff

    def has_view_permission(self, request, obj=None):
        """Solo superusuarios pueden ver este modelo."""
        return request.user.is_superuser

    def has_add_permission(self, request):
        """Solo superusuarios pueden agregar este modelo."""
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        """Solo superusuarios pueden modificar este modelo."""
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        """Solo superusuarios pueden eliminar este modelo."""
        return request.user.is_superuser


@admin.register(Turno)
class TurnoAdmin(admin.ModelAdmin):
    """Configuración del admin para Turno - Solo superusuarios."""

    list_display = [
        "cliente",
        "fecha",
        "hora_inicio",
        "hora_fin",
        "motivo_breve",
        "created_by",
        "created_at",
    ]
    list_filter = ["fecha", "created_at", "created_by"]
    search_fields = [
        "cliente__nombre_apellido",
        "cliente__dni",
        "motivo",
        "observaciones",
    ]
    readonly_fields = ["created_at", "updated_at", "hora_fin"]
    date_hierarchy = "fecha"

    fieldsets = (
        ("Información del Cliente", {"fields": ("cliente",)}),
        ("Detalles del Turno", {"fields": ("fecha", "hora_inicio", "hora_fin")}),
        ("Información Adicional", {"fields": ("motivo", "observaciones")}),
        (
            "Auditoría",
            {
                "fields": ("created_by", "created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    def has_module_permission(self, request):
        """Permitir acceso al módulo turnos para staff."""
        return request.user.is_staff

    def has_view_permission(self, request, obj=None):
        """Solo superusuarios pueden ver este modelo."""
        return request.user.is_superuser

    def has_add_permission(self, request):
        """Solo superusuarios pueden agregar este modelo."""
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        """Solo superusuarios pueden modificar este modelo."""
        return request.user.is_superuser

    def has_delete_permission(self, request, obj=None):
        """Solo superusuarios pueden eliminar este modelo."""
        return request.user.is_superuser

    def motivo_breve(self, obj):
        """Muestra una versión breve del motivo."""
        if obj.motivo:
            return obj.motivo[:50] + "..." if len(obj.motivo) > 50 else obj.motivo
        return "-"

    motivo_breve.short_description = "Motivo"

    def save_model(self, request, obj, form, change):
        """Asigna automáticamente el usuario que crea el turno."""
        if not change:  # Solo cuando se crea por primera vez
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# --- REGISTRO DE URL PERSONALIZADA EN EL ADMIN (igual que reporte-caja) ---
old_get_urls_turnos = admin.site.get_urls


def get_turnos_urls():
    """Agrega URLs personalizadas al admin."""
    return [
        path(
            "calendario-turnos/",
            admin.site.admin_view(calendario_turnos_view),
            name="calendario-turnos",
        ),
    ] + old_get_urls_turnos()


admin.site.get_urls = get_turnos_urls
