"""
Admin para el módulo de Contabilidad.
Solo incluye el Reporte de Caja (vista personalizada).
"""

from datetime import date
from typing import Any, Optional

from django.contrib import admin
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.urls import path
from django.utils.safestring import SafeString

from .models import ReporteCaja
from .services import obtener_movimientos_caja


def reporte_caja_view(request: HttpRequest) -> HttpResponse:
    """Vista para el reporte de caja que muestra ventas, compras y gastos."""
    desde = request.GET.get("desde", str(date.today()))
    hasta = request.GET.get("hasta", str(date.today()))
    forma_pago = request.GET.get("forma_pago", "")

    movimientos = obtener_movimientos_caja(desde, hasta)

    # 🔹 Filtro por forma de pago
    if forma_pago:
        movimientos = [m for m in movimientos if m.forma_pago == forma_pago]

    # 🔹 Totales
    total_ingreso = sum([m.ingreso for m in movimientos])
    total_saldo = sum([m.saldo for m in movimientos])
    total_egreso = sum([m.egreso for m in movimientos])

    # 🔹 Balance (solo si es un día exacto)
    mostrar_balance = desde == hasta
    balance = total_ingreso - total_egreso if mostrar_balance else None

    context = dict(
        admin.site.each_context(request),
        title="Reporte de Caja",
        movimientos=movimientos,
        desde=desde,
        hasta=hasta,
        forma_pago=forma_pago,
        total_ingreso=total_ingreso,
        total_saldo=total_saldo,
        total_egreso=total_egreso,
        mostrar_balance=mostrar_balance,
        balance=balance,
    )
    return render(request, "admin/contabilidad/reporte_caja.html", context)


# --- FIX PARA EVITAR RECURSION ---
old_get_urls = admin.site.get_urls


def get_custom_urls():
    return [
        path(
            "reporte-caja/",
            admin.site.admin_view(reporte_caja_view),
            name="reporte-caja",
        ),
    ] + old_get_urls()


admin.site.get_urls = get_custom_urls


# --- Registrar modelo proxy para que aparezca la sección Contabilidad ---
@admin.register(ReporteCaja)
class ReporteCajaAdmin(admin.ModelAdmin):
    """
    Admin para el modelo proxy ReporteCaja.
    Redirige automáticamente al reporte de caja.
    """

    def changelist_view(self, request, extra_context=None):
        """Redirigir directamente al reporte de caja."""
        return redirect(reverse("admin:reporte-caja"))

    def has_add_permission(self, request):
        """No permitir agregar."""
        return False

    def has_change_permission(self, request, obj=None):
        """Permitir ver (se usa para el link en el admin)."""
        return True

    def has_delete_permission(self, request, obj=None):
        """No permitir eliminar."""
        return False
