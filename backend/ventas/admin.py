from urllib.parse import parse_qs
from django import forms
from django.contrib import admin
from django.urls import reverse

from productos.models import Producto
from ventas.models import Cliente, Consulta, Graduacion, ObraSocial, Venta, DetalleVenta
from django.utils.html import format_html


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
        "dni",
        "nombre_apellido",
        "nro_afiliado",
        "obra_social",
        "ver_historia_clinica",
    ]
    search_fields = ["nombre_apellido", "dni", "obra_social__nombre"]
    autocomplete_fields = ["obra_social"]

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
        "porcentaje_ganancia",
        "precio_unitario",
        "subtotal_item",
    ]
    readonly_fields = ("precio_unitario", "subtotal_item", "precio_costo")
    autocomplete_fields = ["producto"]
    extra = 1

    class Media:
        js = (
            "admin/js/jquery.init.js",  # asegura que django.jQuery esté disponible
            "ventas/js/detalle_venta.js",
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
    search_fields = ["cliente_nombre_apellido", "cliente_dni"]
    inlines = [DetalleVentaInline]
    autocomplete_fields = ["cliente"]

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
    fieldsets = (
        (
            "Lejos - Ojo Derecho (OD)",
            {
                "fields": (
                    ("od_lejos_esferico", "od_lejos_cilindrico", "od_lejos_eje"),
                ),
            },
        ),
        (
            "Lejos - Ojo Izquierdo (OI)",
            {
                "fields": (
                    ("oi_lejos_esferico", "oi_lejos_cilindrico", "oi_lejos_eje"),
                ),
            },
        ),
        (
            "Cerca - Ojo Derecho (OD)",
            {
                "fields": (
                    ("od_cerca_esferico", "od_cerca_cilindrico", "od_cerca_eje"),
                ),
            },
        ),
        (
            "Cerca - Ojo Izquierdo (OI)",
            {
                "fields": (
                    ("oi_cerca_esferico", "oi_cerca_cilindrico", "oi_cerca_eje"),
                ),
            },
        ),
    )

    class Media:
        css = {"all": ("ventas/css/graduacion_inline.css",)}


@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ["fecha", "cliente", "tiene_diagnostico", "tiene_tratamiento"]
    search_fields = ["cliente__nombre_apellido"]
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
