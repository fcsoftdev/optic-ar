from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from datetime import date
from .services import obtener_movimientos_caja

def reporte_caja_view(request):
    # desde = request.GET.get("desde", str(date.today()))
    # hasta = request.GET.get("hasta", str(date.today()))
    # movimientos = obtener_movimientos_caja(desde, hasta)

    # context = dict(
    #     admin.site.each_context(request),
    #     title="Reporte de Caja",
    #     movimientos=movimientos,
    #     desde=desde,
    #     hasta=hasta,
    # )
    # return render(request, "admin/contabilidad/reporte_caja.html", context)
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
    mostrar_balance = (desde == hasta)
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
        path("reporte-caja/", admin.site.admin_view(reporte_caja_view), name="reporte-caja"),
    ] + old_get_urls()

admin.site.get_urls = get_custom_urls
