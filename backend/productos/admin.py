from decimal import Decimal
from django import forms
from django.contrib import admin, messages
from django.shortcuts import render

from productos.models import Categoria, Marca, Producto, SubCategoria


class AumentoPrecioForm(forms.Form):
    porcentaje = forms.DecimalField(
        label="Porcentaje de aumento (%)",
        required=True,
        decimal_places=2,
        max_digits=5,
        help_text="Ejemplo: 10 = aumenta un 10% el precio de costo",
    )


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(SubCategoria)
class SubCategoriaAdmin(admin.ModelAdmin):
    list_display = ["nombre", "categoria"]
    search_fields = ["nombre"]
    autocomplete_fields = ["categoria"]


# --- NUEVO: Form para Producto ---
class ProductoAdminForm(forms.ModelForm):
    class Meta:
        model = Producto
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Si el producto ya tiene subcategoria, agregamos data-selected
        if self.instance and self.instance.pk and self.instance.sub_categoria:
            self.fields["sub_categoria"].widget.attrs["data-selected"] = str(
                self.instance.sub_categoria.id
            )


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    form = ProductoAdminForm
    list_display = [
        "codigo",
        "nombre",
        "categoria",
        "sub_categoria",
        "marca",
        "stock",
        "precio_costo",
    ]
    fields = [
        "codigo",
        "nombre",
        "descripcion",
        ("categoria", "sub_categoria"),
        ("marca", "stock"),
        ("precio_costo", "precio_venta"),
    ]
    readonly_fields = ["precio_venta"]
    search_fields = ["codigo", "nombre", "descripcion"]
    list_filter = ["marca", "categoria", "sub_categoria"]
    autocomplete_fields = ["marca"]

    actions = ["aumentar_precios"]

    class Media:
        js = (
            "admin/js/jquery.init.js",
            "productos/js/filtro_subcategorias.js",
        )

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "sub_categoria":
            if request.method == "POST":
                categoria_id = request.POST.get("categoria")
                if categoria_id:
                    kwargs["queryset"] = SubCategoria.objects.filter(
                        categoria_id=categoria_id
                    )
                else:
                    kwargs["queryset"] = SubCategoria.objects.none()
            else:
                # Edición: incluir todas las subcategorías de la categoría del producto
                obj_id = request.resolver_match.kwargs.get("object_id")
                if obj_id:
                    try:
                        producto = Producto.objects.get(pk=obj_id)
                        kwargs["queryset"] = SubCategoria.objects.filter(
                            categoria=producto.categoria
                        )
                    except Producto.DoesNotExist:
                        kwargs["queryset"] = SubCategoria.objects.none()
                else:
                    kwargs["queryset"] = SubCategoria.objects.none()
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def aumentar_precios(self, request, queryset):
        """
        Action para aumentar precios de costo en lote.
        """
        if "apply" in request.POST:
            form = AumentoPrecioForm(request.POST)
            if form.is_valid():
                porcentaje = form.cleaned_data["porcentaje"]
                count = 0
                for producto in queryset:
                    if producto.precio_costo:
                        producto.precio_costo = producto.precio_costo * (
                            1 + Decimal(porcentaje) / 100
                        )
                        producto.save()
                        count += 1
                self.message_user(
                    request,
                    f"Se actualizaron {count} productos con un aumento del {porcentaje}%.",
                    level=messages.SUCCESS,
                )
                return None  # volver al changelist
        else:
            form = AumentoPrecioForm()

        context = dict(
            self.admin_site.each_context(request),
            productos=queryset,
            form=form,
            title="Aumentar precios de costo",
        )
        return render(request, "admin/aumentar_precios_intermedio.html", context)

    aumentar_precios.short_description = "Aumentar precio de costo en porcentaje"
