from datetime import date
from typing import Any, Optional

from django.contrib import admin
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render
from django.urls import path
from django.utils.safestring import SafeString

from .services import obtener_movimientos_caja


def reporte_caja_view(request: HttpRequest) -> HttpResponse:
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


# ============================================================================
# ADMIN PARA CAJA MANUAL
# ============================================================================

from django.db.models import Sum, Q
from django.utils.html import format_html
from django.http import HttpResponse
from .models import MovimientoCaja


class FechaRangoFilter(admin.SimpleListFilter):
    """Filtro personalizado por rangos de fecha."""

    title = "Período"
    parameter_name = "periodo"

    def lookups(self, request, model_admin):
        return [
            ("hoy", "Hoy"),
            ("ayer", "Ayer"),
            ("semana", "Última semana"),
            ("mes", "Último mes"),
            ("trimestre", "Último trimestre"),
            ("año", "Último año"),
        ]

    def queryset(self, request, queryset):
        from datetime import datetime, timedelta

        hoy = datetime.now().date()

        if self.value() == "hoy":
            return queryset.filter(fecha=hoy)
        elif self.value() == "ayer":
            ayer = hoy - timedelta(days=1)
            return queryset.filter(fecha=ayer)
        elif self.value() == "semana":
            inicio = hoy - timedelta(days=7)
            return queryset.filter(fecha__gte=inicio, fecha__lte=hoy)
        elif self.value() == "mes":
            inicio = hoy - timedelta(days=30)
            return queryset.filter(fecha__gte=inicio, fecha__lte=hoy)
        elif self.value() == "trimestre":
            inicio = hoy - timedelta(days=90)
            return queryset.filter(fecha__gte=inicio, fecha__lte=hoy)
        elif self.value() == "año":
            inicio = hoy - timedelta(days=365)
            return queryset.filter(fecha__gte=inicio, fecha__lte=hoy)


@admin.register(MovimientoCaja)
class MovimientoCajaAdmin(admin.ModelAdmin):
    """Admin para gestión de Caja Manual con exportación a PDF."""

    list_display = [
        "fecha",
        "ingreso_formateado",
        "egreso_formateado",
        "balance_formateado",
        "created_by",
        "created_at",
    ]

    list_filter = [
        FechaRangoFilter,
    ]

    search_fields = [
        "observaciones",
    ]

    date_hierarchy = "fecha"

    readonly_fields = ["balance_calculado"]

    fields = ("fecha", "ingreso", "egreso", "balance_calculado")

    actions = ["exportar_pdf"]

    def ingreso_formateado(self, obj: Any) -> SafeString | str:
        """Muestra el ingreso con formato."""
        if obj.ingreso > 0:
            ingreso_str = f"${obj.ingreso:,.2f}"
            return format_html(
                '<span style="color: #28a745; font-weight: bold;">{}</span>',
                ingreso_str,
            )
        return "-"

    ingreso_formateado.short_description = "Ingreso"

    def egreso_formateado(self, obj: Any) -> SafeString | str:
        """Muestra el egreso con formato."""
        if obj.egreso > 0:
            egreso_str = f"${obj.egreso:,.2f}"
            return format_html(
                '<span style="color: #dc3545; font-weight: bold;">{}</span>', egreso_str
            )
        return "-"

    egreso_formateado.short_description = "Egreso"

    def balance_formateado(self, obj: Any) -> SafeString:
        """Muestra el balance con formato y color según sea positivo o negativo."""
        color = "#28a745" if obj.balance >= 0 else "#dc3545"
        signo = "+" if obj.balance >= 0 else ""
        balance_str = f"{signo}${obj.balance:,.2f}"
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>', color, balance_str
        )

    balance_formateado.short_description = "Balance"

    def balance_calculado(self, obj: Any) -> SafeString | str:
        """Muestra el balance calculado en el formulario."""
        if obj.pk:
            color = "#28a745" if obj.balance >= 0 else "#dc3545"
            signo = "+" if obj.balance >= 0 else ""
            balance_str = f"{signo}${obj.balance:,.2f}"
            return format_html(
                '<span style="color: {}; font-weight: bold; font-size: 16px;">{}</span>',
                color,
                balance_str,
            )
        return "Se calculará automáticamente"

    balance_calculado.short_description = "Balance (Automático)"

    def save_model(self, request, obj, form, change):
        """Asigna el usuario que crea el movimiento."""
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def changelist_view(self, request, extra_context=None):
        """Agrega estadísticas al listado."""
        extra_context = extra_context or {}

        # Obtener queryset filtrado según los filtros aplicados
        cl = self.get_changelist_instance(request)
        queryset = cl.get_queryset(request)

        # Calcular totales
        ingresos = queryset.aggregate(total=Sum("ingreso"))["total"] or 0
        egresos = queryset.aggregate(total=Sum("egreso"))["total"] or 0
        balance = ingresos - egresos

        extra_context["ingresos_total"] = ingresos
        extra_context["egresos_total"] = egresos
        extra_context["balance_total"] = balance
        extra_context["cantidad_movimientos"] = queryset.count()

        return super().changelist_view(request, extra_context)

    def exportar_pdf(self, request, queryset):
        """Exporta los movimientos seleccionados a PDF."""
        from reportlab.lib.pagesizes import letter, A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import (
            SimpleDocTemplate,
            Table,
            TableStyle,
            Paragraph,
            Spacer,
        )
        from reportlab.lib.enums import TA_CENTER, TA_RIGHT
        from io import BytesIO
        from datetime import datetime

        # Crear el PDF en memoria
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()

        # Título
        title_style = ParagraphStyle(
            "CustomTitle",
            parent=styles["Heading1"],
            fontSize=18,
            textColor=colors.HexColor("#1a1a1a"),
            spaceAfter=30,
            alignment=TA_CENTER,
        )
        elements.append(Paragraph("Reporte de Caja Manual", title_style))
        elements.append(Spacer(1, 12))

        # Fecha del reporte
        fecha_style = ParagraphStyle(
            "DateStyle",
            parent=styles["Normal"],
            fontSize=10,
            textColor=colors.HexColor("#666666"),
            alignment=TA_RIGHT,
        )
        elements.append(
            Paragraph(
                f"Generado el: {datetime.now().strftime('%d/%m/%Y %H:%M')}", fecha_style
            )
        )
        elements.append(Spacer(1, 20))

        # Calcular totales
        ingresos_total = queryset.aggregate(total=Sum("ingreso"))["total"] or 0
        egresos_total = queryset.aggregate(total=Sum("egreso"))["total"] or 0
        balance_total = ingresos_total - egresos_total

        # Resumen
        resumen_data = [
            ["RESUMEN", ""],
            ["Total Ingresos:", f"${ingresos_total:,.2f}"],
            ["Total Egresos:", f"${egresos_total:,.2f}"],
            ["Balance:", f"${balance_total:,.2f}"],
        ]

        resumen_table = Table(resumen_data, colWidths=[3 * inch, 2 * inch])
        resumen_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4a86e8")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                    ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 12),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
                    ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#f0f0f0")),
                ]
            )
        )

        elements.append(resumen_table)
        elements.append(Spacer(1, 30))

        # Título de detalle
        elements.append(Paragraph("Detalle de Movimientos", styles["Heading2"]))
        elements.append(Spacer(1, 12))

        # Tabla de movimientos
        data = [["Fecha", "Ingreso", "Egreso", "Balance"]]

        for mov in queryset.order_by("fecha", "created_at"):
            ingreso_str = f"${mov.ingreso:,.2f}" if mov.ingreso > 0 else "-"
            egreso_str = f"${mov.egreso:,.2f}" if mov.egreso > 0 else "-"
            balance_signo = "+" if mov.balance >= 0 else ""
            data.append(
                [
                    mov.fecha.strftime("%d/%m/%Y"),
                    ingreso_str,
                    egreso_str,
                    f"{balance_signo}${mov.balance:,.2f}",
                ]
            )

        table = Table(data, colWidths=[1.5 * inch, 1.5 * inch, 1.5 * inch, 1.5 * inch])
        table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("ALIGN", (1, 1), (3, -1), "RIGHT"),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                    ("FONTSIZE", (0, 0), (-1, 0), 10),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
                    ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
                    ("GRID", (0, 0), (-1, -1), 1, colors.black),
                    ("FONTSIZE", (0, 1), (-1, -1), 9),
                ]
            )
        )

        elements.append(table)

        # Generar PDF
        doc.build(elements)
        buffer.seek(0)

        # Crear respuesta HTTP
        response = HttpResponse(buffer.getvalue(), content_type="application/pdf")
        response["Content-Disposition"] = (
            f'attachment; filename="caja_manual_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf"'
        )

        return response

    exportar_pdf.short_description = "📄 Exportar seleccionados a PDF"
