"""
Vistas para el módulo de Contabilidad.

Provee la API del Reporte de Caja, que agrega datos de Ventas,
Compras y Gastos filtrados por rango de fechas.
"""

from datetime import date
from decimal import Decimal
from typing import Any, Dict

from django.db.models import Count, DecimalField, Sum
from django.db.models.functions import Coalesce
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from compras.models import Compra, Gasto
from ventas.models import Venta

CERO = Decimal("0.00")


class ReporteCajaAPIView(APIView):
    """
    Vista para el Reporte de Caja.

    Devuelve un resumen financiero y el detalle de Ventas, Compras y
    Gastos para un rango de fechas determinado.

    Parámetros GET:
        fecha_desde (str): Fecha de inicio en formato YYYY-MM-DD.
        fecha_hasta (str): Fecha de fin en formato YYYY-MM-DD.

    Returns:
        JSON con resumen, desglose por forma de pago y listados detallados.
    """

    def get(self, request: Request) -> Response:
        """Genera y devuelve el reporte de caja filtrado por fechas."""
        fecha_desde_str = request.query_params.get("fecha_desde")
        fecha_hasta_str = request.query_params.get("fecha_hasta")

        # Validar y parsear fechas
        errores: Dict[str, str] = {}
        fecha_desde: date | None = None
        fecha_hasta: date | None = None

        if fecha_desde_str:
            try:
                fecha_desde = date.fromisoformat(fecha_desde_str)
            except ValueError:
                errores["fecha_desde"] = "Formato inválido. Use YYYY-MM-DD."

        if fecha_hasta_str:
            try:
                fecha_hasta = date.fromisoformat(fecha_hasta_str)
            except ValueError:
                errores["fecha_hasta"] = "Formato inválido. Use YYYY-MM-DD."

        if errores:
            return Response({"errores": errores}, status=400)

        # Construir querysets con filtros opcionales de fecha
        ventas_qs = Venta.objects.select_related("cliente").all()
        compras_qs = Compra.objects.select_related("proveedor").all()
        gastos_qs = Gasto.objects.all()

        if fecha_desde:
            ventas_qs = ventas_qs.filter(fecha__gte=fecha_desde)
            compras_qs = compras_qs.filter(fecha__gte=fecha_desde)
            gastos_qs = gastos_qs.filter(fecha__gte=fecha_desde)

        if fecha_hasta:
            ventas_qs = ventas_qs.filter(fecha__lte=fecha_hasta)
            compras_qs = compras_qs.filter(fecha__lte=fecha_hasta)
            gastos_qs = gastos_qs.filter(fecha__lte=fecha_hasta)

        # Totales agregados
        agg_ventas = ventas_qs.aggregate(
            total=Coalesce(Sum("total_venta"), CERO, output_field=DecimalField()),
            cantidad=Count("id"),
        )
        agg_compras = compras_qs.aggregate(
            total=Coalesce(Sum("total"), CERO, output_field=DecimalField()),
            cantidad=Count("id"),
        )
        agg_gastos = gastos_qs.aggregate(
            total=Coalesce(Sum("total"), CERO, output_field=DecimalField()),
            cantidad=Count("id"),
        )

        total_ventas: Decimal = agg_ventas["total"]
        total_compras: Decimal = agg_compras["total"]
        total_gastos: Decimal = agg_gastos["total"]
        saldo_neto: Decimal = total_ventas - total_compras - total_gastos

        # Desglose ventas por forma de pago
        FORMAS_PAGO_DISPLAY = {
            "CO": "Contado",
            "DE": "Tarjeta de Débito",
            "CR": "Tarjeta de Crédito",
            "TR": "Transferencia",
            "QR": "QR",
        }
        formas_pago_agg = (
            ventas_qs.values("forma_pago")
            .annotate(
                total=Coalesce(Sum("total_venta"), CERO, output_field=DecimalField()),
                cantidad=Count("id"),
            )
            .order_by("forma_pago")
        )
        desglose_formas_pago = [
            {
                "forma_pago": item["forma_pago"],
                "forma_pago_display": FORMAS_PAGO_DISPLAY.get(
                    item["forma_pago"], item["forma_pago"]
                ),
                "total": str(item["total"]),
                "cantidad": item["cantidad"],
            }
            for item in formas_pago_agg
        ]

        # Detalle ventas
        ventas_data = [
            {
                "id": v.id,
                "fecha": str(v.fecha),
                "cliente_nombre": (
                    f"{v.cliente.apellido} {v.cliente.nombre}"
                    if v.cliente
                    else "Sin cliente"
                ),
                "forma_pago": v.forma_pago,
                "forma_pago_display": FORMAS_PAGO_DISPLAY.get(
                    v.forma_pago, v.forma_pago
                ),
                "total_venta": str(v.total_venta),
                "saldo": str(v.saldo),
            }
            for v in ventas_qs.order_by("-fecha", "-id")
        ]

        # Detalle compras
        compras_data = [
            {
                "id": c.id,
                "fecha": str(c.fecha),
                "proveedor_nombre": (
                    c.proveedor.nombre if c.proveedor else "Sin proveedor"
                ),
                "total": str(c.total),
            }
            for c in compras_qs.order_by("-fecha", "-id")
        ]

        # Detalle gastos
        gastos_data = [
            {
                "id": g.id,
                "fecha": str(g.fecha),
                "descripcion": g.descripcion,
                "total": str(g.total),
            }
            for g in gastos_qs.order_by("-fecha", "-id")
        ]

        data: Dict[str, Any] = {
            "fecha_desde": fecha_desde_str,
            "fecha_hasta": fecha_hasta_str,
            "resumen": {
                "total_ventas": str(total_ventas),
                "cantidad_ventas": agg_ventas["cantidad"],
                "total_compras": str(total_compras),
                "cantidad_compras": agg_compras["cantidad"],
                "total_gastos": str(total_gastos),
                "cantidad_gastos": agg_gastos["cantidad"],
                "saldo_neto": str(saldo_neto),
            },
            "desglose_formas_pago": desglose_formas_pago,
            "ventas": ventas_data,
            "compras": compras_data,
            "gastos": gastos_data,
        }

        return Response(data)
