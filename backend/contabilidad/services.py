from dataclasses import dataclass
from datetime import date
from decimal import Decimal
from django.urls import reverse
from ventas.models import Venta
from compras.models import Compra, Gasto


@dataclass
class MovimientoCaja:
    fecha: date
    forma_pago: str
    forma_pago_label: str
    descripcion: str
    ingreso: Decimal = Decimal("0.00")
    saldo: Decimal = Decimal("0.00")
    egreso: Decimal = Decimal("0.00")
    link: str = ""  # URL al admin


def obtener_movimientos_caja(desde, hasta):
    movimientos = []

    # Ventas → Ingresos
    for v in Venta.objects.filter(fecha__range=(desde, hasta)):
        movimientos.append(
            MovimientoCaja(
                fecha=v.fecha,
                forma_pago=v.forma_pago,
                forma_pago_label=v.get_forma_pago_display(),
                descripcion=f"Venta a {v.cliente.nombre_apellido}",
                ingreso=v.total_venta,
                saldo=v.saldo,
                link=reverse("admin:ventas_venta_change", args=[v.id]),
            )
        )

    # Compras → Egresos
    for c in Compra.objects.filter(fecha__range=(desde, hasta)):
        movimientos.append(
            MovimientoCaja(
                fecha=c.fecha,
                forma_pago="N/A",
                forma_pago_label="N/A",
                descripcion=f"Compra a {c.proveedor.nombre if c.proveedor else ''}",
                egreso=c.total,
                link=reverse("admin:compras_compra_change", args=[c.id]),
            )
        )

    # Gastos → Egresos
    for g in Gasto.objects.filter(fecha__range=(desde, hasta)):
        movimientos.append(
            MovimientoCaja(
                fecha=g.fecha,
                forma_pago="N/A",
                forma_pago_label="N/A",
                descripcion=f"Gasto de {g.descripcion}",
                egreso=g.total,
                link=reverse("admin:compras_gasto_change", args=[g.id]),
            )
        )

    # Ordenar por fecha
    movimientos.sort(key=lambda m: m.fecha)
    return movimientos
