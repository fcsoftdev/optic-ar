from decimal import Decimal
from typing import Any, Dict, List, Optional
from django import forms
from django.contrib import admin, messages
from django.db.models import QuerySet
from django.http import HttpRequest, HttpResponse
from django.shortcuts import render

from productos.models import (
    Categoria,
    Marca,
    Producto,
    SubCategoria,
    UltimoCambioPrecio,
)


class AumentoPrecioForm(forms.Form):
    porcentaje = forms.DecimalField(
        label="Porcentaje de aumento (%)",
        required=True,
        decimal_places=2,
        max_digits=5,
        min_value=Decimal("0.01"),
        help_text="Ejemplo: 10 = aumenta un 10% el precio de costo",
    )


class ConfirmacionForm(forms.Form):
    """Formulario simple para confirmaciones."""

    confirmacion = forms.ChoiceField(
        label="¿Confirma la acción?",
        choices=[
            ("", "Seleccione una opción"),
            ("confirmo", "Sí, confirmo"),
        ],
        required=True,
        widget=forms.RadioSelect,
        help_text="Esta acción no se puede deshacer",
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

    actions = ["aumentar_precios", "revertir_ultimo_cambio"]

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

    def aumentar_precios(
        self, request: HttpRequest, queryset: QuerySet[Producto]
    ) -> Optional[HttpResponse]:
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

    def revertir_ultimo_cambio(
        self, request: HttpRequest, queryset: QuerySet[Producto]
    ) -> Optional[HttpResponse]:
        """
        Action para revertir al precio anterior (último cambio solamente).

        Args:
            request: Solicitud HTTP
            queryset: Productos seleccionados

        Returns:
            Optional[HttpResponse]: Respuesta HTML o None para volver al changelist
        """
        if "cancel" in request.POST:
            # Si presiona cancelar, volver al changelist
            return None

        if "apply" in request.POST:
            form = ConfirmacionForm(request.POST)
            if form.is_valid():
                confirmacion: str = form.cleaned_data["confirmacion"]

                if confirmacion == "confirmo":
                    count = 0
                    productos_sin_historial: List[str] = []

                    for producto in queryset:
                        try:
                            ultimo_cambio = producto.ultimo_cambio_precio
                            if ultimo_cambio.puede_revertir():
                                # Revertir al precio anterior
                                producto.precio_costo = ultimo_cambio.precio_anterior
                                producto.save()
                                count += 1
                            else:
                                productos_sin_historial.append(producto.nombre)

                        except UltimoCambioPrecio.DoesNotExist:
                            productos_sin_historial.append(producto.nombre)

                    mensaje = f"Se revirtieron {count} productos al precio anterior."
                    if productos_sin_historial:
                        cantidad_sin_historial = len(productos_sin_historial)
                        if cantidad_sin_historial <= 3:
                            mensaje += (
                                f" Sin historial: {', '.join(productos_sin_historial)}."
                            )
                        else:
                            mensaje += f" Sin historial: {', '.join(productos_sin_historial[:3])} y {cantidad_sin_historial - 3} más."

                    self.message_user(request, mensaje, level=messages.SUCCESS)
                    return None
        else:
            form = ConfirmacionForm()

        # Preparar datos para mostrar
        productos_info: List[Dict[str, Any]] = []
        for producto in queryset:
            try:
                ultimo_cambio = producto.ultimo_cambio_precio
                productos_info.append(
                    {
                        "producto": producto,
                        "precio_actual": producto.precio_costo,
                        "precio_anterior": ultimo_cambio.precio_anterior,
                        "puede_revertir": ultimo_cambio.puede_revertir(),
                        "tipo_cambio": ultimo_cambio.get_tipo_ultimo_cambio_display(),
                        "fecha": ultimo_cambio.fecha_ultimo_cambio,
                        "porcentaje": ultimo_cambio.porcentaje_aplicado,
                    }
                )
            except UltimoCambioPrecio.DoesNotExist:
                productos_info.append(
                    {
                        "producto": producto,
                        "precio_actual": producto.precio_costo,
                        "puede_revertir": False,
                        "sin_historial": True,
                    }
                )

        context: Dict[str, Any] = dict(
            self.admin_site.each_context(request),
            productos_info=productos_info,
            form=form,
            title="Revertir último cambio de precio",
            subtitle=f"Revertir {queryset.count()} producto(s) al precio anterior",
        )
        return render(request, "admin/revertir_ultimo_cambio.html", context)

    # Descripciones de las actions
    aumentar_precios.short_description = "Aumentar porcentaje de costo"
    revertir_ultimo_cambio.short_description = "Volver al precio anterior"
