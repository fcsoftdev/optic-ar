from urllib.parse import parse_qs
from django import forms
from django.contrib import admin
from django.urls import reverse
from decimal import Decimal, InvalidOperation

from productos.models import Producto
from ventas.models import Cliente, Consulta, Graduacion, ObraSocial, Venta, DetalleVenta
from django.utils.html import format_html


class DecimalFormatWidget(forms.TextInput):
    """Widget personalizado para mostrar valores decimales con formato."""

    def format_value(self, value):
        """Formatea el valor para mostrar el símbolo + en positivos."""
        if value is None or value == "":
            return ""
        try:
            decimal_value = Decimal(str(value))
            if decimal_value > 0:
                return f"+{decimal_value}"
            else:
                return str(decimal_value)
        except (InvalidOperation, ValueError):
            return str(value)


class GraduacionForm(forms.ModelForm):
    class Meta:
        model = Graduacion
        fields = "__all__"
        widgets = {
            # Campos esféricos - usar TextInput personalizado
            "od_lejos_esferico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +2.50 o -1.75", "class": "decimal-field"}
            ),
            "od_lejos_cilindrico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +1.25 o -0.50", "class": "decimal-field"}
            ),
            "oi_lejos_esferico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +2.50 o -1.75", "class": "decimal-field"}
            ),
            "oi_lejos_cilindrico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +1.25 o -0.50", "class": "decimal-field"}
            ),
            "od_cerca_esferico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +2.50 o -1.75", "class": "decimal-field"}
            ),
            "od_cerca_cilindrico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +1.25 o -0.50", "class": "decimal-field"}
            ),
            "oi_cerca_esferico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +2.50 o -1.75", "class": "decimal-field"}
            ),
            "oi_cerca_cilindrico": DecimalFormatWidget(
                attrs={"placeholder": "ej: +1.25 o -0.50", "class": "decimal-field"}
            ),
            # Los campos de eje con NumberInput
            "od_lejos_eje": forms.NumberInput(
                attrs={"min": 0, "max": 180, "placeholder": "0-180°"}
            ),
            "oi_lejos_eje": forms.NumberInput(
                attrs={"min": 0, "max": 180, "placeholder": "0-180°"}
            ),
            "od_cerca_eje": forms.NumberInput(
                attrs={"min": 0, "max": 180, "placeholder": "0-180°"}
            ),
            "oi_cerca_eje": forms.NumberInput(
                attrs={"min": 0, "max": 180, "placeholder": "0-180°"}
            ),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Aplicar formato a los valores iniciales si existe una instancia
        if self.instance and self.instance.pk:
            decimal_fields = [
                "od_lejos_esferico",
                "od_lejos_cilindrico",
                "oi_lejos_esferico",
                "oi_lejos_cilindrico",
                "od_cerca_esferico",
                "od_cerca_cilindrico",
                "oi_cerca_esferico",
                "oi_cerca_cilindrico",
            ]
            for field_name in decimal_fields:
                value = getattr(self.instance, field_name, None)
                if value is not None:
                    if value > 0:
                        self.initial[field_name] = f"+{value}"

    def clean(self):
        """Validación personalizada para asegurar que los valores decimales sean válidos."""
        cleaned_data = super().clean()

        # Campos decimales que necesitan validación
        decimal_fields = [
            "od_lejos_esferico",
            "od_lejos_cilindrico",
            "oi_lejos_esferico",
            "oi_lejos_cilindrico",
            "od_cerca_esferico",
            "od_cerca_cilindrico",
            "oi_cerca_esferico",
            "oi_cerca_cilindrico",
        ]

        for field_name in decimal_fields:
            value = cleaned_data.get(field_name)
            if value is not None and value != "":
                try:
                    # Si es string, convertir a Decimal
                    if isinstance(value, str):
                        # Remover el símbolo + si está presente para la conversión
                        clean_value = (
                            value.replace("+", "") if value.startswith("+") else value
                        )
                        cleaned_data[field_name] = Decimal(clean_value)
                    # Si ya es un Decimal, dejarlo como está
                    elif not isinstance(value, Decimal):
                        cleaned_data[field_name] = Decimal(str(value))
                except (InvalidOperation, ValueError):
                    raise forms.ValidationError(
                        {
                            field_name: f"Valor inválido: {value}. Use formato decimal (ej: +2.50 o -1.75)"
                        }
                    )

        return cleaned_data


class GraduacionInline(admin.TabularInline):
    model = Graduacion
    can_delete = False
    extra = 0


class ConsultaInline(admin.TabularInline):
    model = Consulta
    extra = 0
    show_change_link = True
    inlines = [GraduacionInline]


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = [
        "apellido",
        "nombre",
        "dni",
        "nro_afiliado",
        "obra_social",
        "ver_historia_clinica",
    ]
    list_display_links = ["apellido"]
    search_fields = ["apellido", "nombre", "dni", "obra_social__nombre"]
    autocomplete_fields = ["obra_social"]
    ordering = ["apellido", "nombre"]

    @admin.display(description="Historia Clínica")
    def ver_historia_clinica(self, obj):
        url = reverse("admin:ventas_consulta_changelist") + f"?cliente={obj.id}"
        return format_html('<a class="button" href="{}">Ver historia clínica</a>', url)


class DetalleVentaForm(forms.ModelForm):
    class Meta:
        model = DetalleVenta
        fields = "__all__"

    def clean(self):
        cleaned_data = super().clean()
        producto = cleaned_data.get("producto")
        cantidad = cleaned_data.get("cantidad")

        if producto and cantidad:
            if producto.stock < cantidad:
                raise forms.ValidationError(
                    {
                        "cantidad": f"Stock insuficiente para {producto.nombre}. Stock actual: {producto.stock}"
                    }
                )
        return cleaned_data


class ProductoWidget(forms.Select):
    def create_option(
        self, name, value, label, selected, index, subindex=None, attrs=None
    ):
        option = super().create_option(
            name, value, label, selected, index, subindex=subindex, attrs=attrs
        )
        # Asegurarnos de que value sea un número válido
        pk_value = getattr(value, "value", value)

        if pk_value:
            try:
                prod = Producto.objects.get(pk=pk_value)
                option["attrs"]["data-precio-costo"] = str(prod.precio_costo)
                option["attrs"]["data-precio-venta"] = str(prod.precio_venta)
                option["attrs"]["data-stock-actual"] = str(prod.stock)
            except Producto.DoesNotExist:
                pass

        return option


class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    form = DetalleVentaForm
    fields = [
        "producto",
        "cantidad",
        "precio_costo",
        "precio_venta",
        "subtotal_item",
    ]
    readonly_fields = ("subtotal_item", "precio_costo")
    # autocomplete_fields = ["producto"]  # ❌ Comentado para usar ProductoWidget personalizado
    extra = 1

    class Media:
        js = (
            "admin/js/jquery.init.js",  # asegura que django.jQuery esté disponible
            "ventas/js/detalle_venta.js",
            "ventas/js/generar_presupuesto_pdf.js",
        )

    def formfield_for_foreignkey(self, db_field, request=None, **kwargs):
        if db_field.name == "producto":
            kwargs["widget"] = ProductoWidget
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    @admin.display(description="Precio Costo")
    def precio_costo(self, obj):
        if obj.pk:
            return obj.producto.precio_costo
        else:
            return 0


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    fields = ["fecha", "cliente", "forma_pago", "total_venta", "entrego", "saldo"]
    readonly_fields = ["total_venta", "saldo"]
    list_display = ["fecha", "cliente", "forma_pago", "total_venta"]
    search_fields = ["cliente__apellido", "cliente__nombre", "cliente__dni"]
    inlines = [DetalleVentaInline]
    autocomplete_fields = ["cliente"]

    class Media:
        js = (
            "admin/js/jquery.init.js",
            "ventas/js/generar_presupuesto_pdf.js",
        )

    def save_formset(self, request, form, formset, change):
        # Primero, se guardan los objetos del inline
        super().save_formset(request, form, formset, change)

        # Después de que todo se ha guardado, podemos calcular el total
        venta = form.instance
        if venta.pk:  # Asegura que la instancia de Venta tiene una PK
            # Aca va el calculo de
            total_venta = sum(
                detalle.subtotal_item for detalle in venta.detalles_ventas.all()
            )
            venta.total_venta = total_venta
            # Calculamos el saldo
            venta.saldo = venta.total_venta - venta.entrego
            venta.save()


@admin.register(ObraSocial)
class ObraSocialAdmin(admin.ModelAdmin):
    list_display = ["nombre", "direccion", "telefono"]
    fields = ["nombre", "telefono", "direccion"]
    search_fields = ["nombre"]


class GraduacionInline(admin.StackedInline):
    model = Graduacion
    form = GraduacionForm
    can_delete = False
    extra = 1
    fieldsets = (
        (
            "Lejos - Ojo Derecho (OD)",
            {
                "fields": (
                    ("od_lejos_esferico", "od_lejos_cilindrico", "od_lejos_eje"),
                ),
                "description": "Valores esféricos y cilíndricos: use + para positivos, - para negativos. Eje: 0° a 180°",
            },
        ),
        (
            "Lejos - Ojo Izquierdo (OI)",
            {
                "fields": (
                    ("oi_lejos_esferico", "oi_lejos_cilindrico", "oi_lejos_eje"),
                ),
                "description": "Valores esféricos y cilíndricos: use + para positivos, - para negativos. Eje: 0° a 180°",
            },
        ),
        (
            "Cerca - Ojo Derecho (OD)",
            {
                "fields": (
                    ("od_cerca_esferico", "od_cerca_cilindrico", "od_cerca_eje"),
                ),
                "description": "Valores esféricos y cilíndricos: use + para positivos, - para negativos. Eje: 0° a 180°",
            },
        ),
        (
            "Cerca - Ojo Izquierdo (OI)",
            {
                "fields": (
                    ("oi_cerca_esferico", "oi_cerca_cilindrico", "oi_cerca_eje"),
                ),
                "description": "Valores esféricos y cilíndricos: use + para positivos, - para negativos. Eje: 0° a 180°",
            },
        ),
    )

    class Media:
        css = {"all": ("ventas/css/graduacion_inline.css",)}
        js = ("ventas/js/graduacion_format.js",)


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ["fecha", "cliente", "tiene_diagnostico", "tiene_tratamiento"]
    search_fields = ["cliente__apellido", "cliente__nombre"]
    autocomplete_fields = ["cliente"]
    inlines = [GraduacionInline]

    @admin.display(description="Tiene Diagnostico?")
    def tiene_diagnostico(self, obj):
        if obj.diagnostico:
            return format_html('<span style="color: green;">✓</span>')
        else:
            return format_html('<span style="color: red;">✗</span>')

    @admin.display(description="Tiene Tratamiento?")
    def tiene_tratamiento(self, obj):
        if obj.tratamiento:
            return format_html('<span style="color: green;">✓</span>')
        else:
            return format_html('<span style="color: red;">✗</span>')

    def get_changeform_initial_data(self, request):
        initial = super().get_changeform_initial_data(request)

        # Chequear si viene el filtro del changelist
        filtros = request.GET.get("_changelist_filters")
        if filtros:
            params = parse_qs(filtros)
            cliente_id = params.get("cliente", [None])[0]
            if cliente_id:
                initial["cliente"] = cliente_id

        # O si viene directo por GET ?cliente=...
        if "cliente" in request.GET:
            initial["cliente"] = request.GET["cliente"]

        return initial
