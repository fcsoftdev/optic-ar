from django.contrib import admin

from compras.models import Compra, DetalleCompra, Gasto, Proveedor


class DetalleCompraInline(admin.TabularInline):
    model = DetalleCompra
    fields = ["producto", "cantidad", "precio_unitario"]
    autocomplete_fields = ["producto"]
    readonly_fields = ["subtotal"]
    extra = 1


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    fields = ["fecha", "proveedor", "total"]
    readonly_fields = ["total"]
    list_display = ["fecha", "proveedor", "total"]
    search_fields = ["proveedor_nombre"]
    autocomplete_fields = ["proveedor"]
    inlines = [
        DetalleCompraInline,
    ]

    def save_formset(self, request, form, formset, change):
        # Primero, se guardan los objetos del inline
        super().save_formset(request, form, formset, change)

        # Después de que todo se ha guardado, podemos calcular el total
        compra = form.instance
        if compra.pk:  # Asegura que la instancia de Compra tiene una PK
            total_compra = sum(
                detalle.subtotal for detalle in compra.detalles_productos.all()
            )
            compra.total = total_compra
            compra.save()


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    fields = [("nombre", "direccion"), ("telefono", "alias")]
    search_fields = ["nombre", "direccion"]


@admin.register(Gasto)
class GastoAdmin(admin.ModelAdmin):
    fields = ["fecha", "descripcion", "total"]
    list_display = ["fecha", "descripcion", "total"]
    search_fields = ["descripcion"]
