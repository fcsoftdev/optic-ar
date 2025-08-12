from django import forms
from django.contrib import admin

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
    list_display = ['dni', 'nombre_apellido', 'nro_afiliado', 'obra_social']
    search_fields = ['nombre_apellido', 'dni']
    autocomplete_fields = ['obra_social']
    inlines = [ConsultaInline]

class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    fields = ['producto', 'cantidad', 'porcentaje_ganancia', 'precio_unitario', 'subtotal_item']
    readonly_fields = ('precio_unitario', 'subtotal_item',)
    autocomplete_fields = ['producto']
    extra = 1

@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    fields = ['fecha', 'cliente',  'forma_pago', 'total_venta', 'entrego', 'saldo']
    inlines = [DetalleVentaInline]
    autocomplete_fields = ['cliente']

    def save_formset(self, request, form, formset, change):
        import pdb; pdb.set_trace()
        # Primero, se guardan los objetos del inline
        super().save_formset(request, form, formset, change)
        
        # Después de que todo se ha guardado, podemos calcular el total
        venta = form.instance
        if venta.pk:  # Asegura que la instancia de Venta tiene una PK
            # Aca va el calculo de 
            total_venta = sum(detalle.subtotal_item for detalle in venta.detalles_ventas.all())
            venta.total_venta = total_venta
            venta.save()

@admin.register(ObraSocial)
class ObraSocialAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'direccion', 'telefono']
    fields = ['nombre', 'telefono', 'direccion']
    search_fields = ['nombre']

class GraduacionInline(admin.StackedInline):
    model = Graduacion    
    fieldsets = (
        ("Lejos - Ojo Derecho (OD)", {
            'fields': (('od_lejos_esferico', 'od_lejos_cilindrico', 'od_lejos_eje'),),
        }),
        ("Lejos - Ojo Izquierdo (OI)", {
            'fields': (('oi_lejos_esferico', 'oi_lejos_cilindrico', 'oi_lejos_eje'),),
        }),
        ("Cerca - Ojo Derecho (OD)", {
            'fields': (('od_cerca_esferico', 'od_cerca_cilindrico', 'od_cerca_eje'),),
        }),
        ("Cerca - Ojo Izquierdo (OI)", {
            'fields': (('oi_cerca_esferico', 'oi_cerca_cilindrico', 'oi_cerca_eje'),),
        }),
    )
    
    class Media:
        css = {
            'all': ('ventas/css/graduacion_inline.css',)
        }
    
@admin.register(Consulta)
class ConsultaAdmin(admin.ModelAdmin):
    list_display = ['fecha', 'cliente', 'tiene_diagnostico', 'tiene_tratamiento']
    search_fields = ['cliente__nombre_apellido']
    autocomplete_fields = ['cliente']
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