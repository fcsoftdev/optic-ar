from django.contrib import admin

from productos.models import Categoria, Marca, Producto, SubCategoria


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


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
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
        ("codigo", "nombre"),
        "descripcion",
        ("categoria", "sub_categoria", "marca"),
        ("stock", "precio_costo", "precio_venta"),
    ]
    readonly_fields = ["precio_venta"]
    search_fields = ["codigo", "nombre", "descripcion"]
    autocomplete_fields = ["marca", "categoria", "sub_categoria"]
