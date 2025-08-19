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

class DetalleVentaForm(forms.ModelForm):
    class Meta:
        model = DetalleVenta
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        producto = cleaned_data.get('producto')
        cantidad = cleaned_data.get('cantidad')

        if producto and cantidad:
            if producto.stock < cantidad:
                raise forms.ValidationError({
                    'cantidad': f"Stock insuficiente para {producto.nombre}. Stock actual: {producto.stock}"
                })
        return cleaned_data

class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    form = DetalleVentaForm
    fields = ['producto', 'cantidad', 'precio_costo','porcentaje_ganancia', 'precio_unitario', 'subtotal_item']
    readonly_fields = ('precio_unitario', 'subtotal_item', 'precio_costo')
    autocomplete_fields = ['producto']
    extra = 1
    
    @admin.display(description="Precio Costo")
    def precio_costo(self, obj):
        if obj.pk:
            return obj.producto.precio_costo
        else:
            return 0
    
@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    fields = ['fecha', 'cliente',  'forma_pago', 'total_venta', 'entrego', 'saldo']
    readonly_fields = ['total_venta', 'saldo']
    list_display = ['fecha', 'cliente', 'forma_pago', 'total_venta']
    inlines = [DetalleVentaInline]
    autocomplete_fields = ['cliente']

    def save_formset(self, request, form, formset, change):
        # Primero, se guardan los objetos del inline
        super().save_formset(request, form, formset, change)
        
        # Después de que todo se ha guardado, podemos calcular el total
        venta = form.instance
        if venta.pk:  # Asegura que la instancia de Venta tiene una PK
            # Aca va el calculo de 
            total_venta = sum(detalle.subtotal_item for detalle in venta.detalles_ventas.all())
            venta.total_venta = total_venta
            # Calculamos el saldo
            venta.saldo = venta.total_venta - venta.entrego
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