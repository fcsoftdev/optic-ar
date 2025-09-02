from decimal import Decimal
from django.db import models
from datetime import date

from productos.models import Producto

class Proveedor(models.Model):
    """Modelo para el registro de Proveedores."""
    nombre = models.CharField(max_length=50)
    direccion = models.CharField(max_length=50)
    telefono = models.CharField(max_length=50)
    alias = models.CharField(max_length=50)
    
    class Meta:
        verbose_name_plural = 'Proveedores'

    def __str__(self):
        return self.nombre


class Compra(models.Model):
    """Modelo para registrar el detalle de compras."""
    proveedor = models.ForeignKey(Proveedor, null=True, on_delete=models.SET_NULL)
    fecha = models.DateField(default=date.today)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00') ,editable=False)
    
    def __str__(self):
        return f"{self.fecha}-{self.proveedor}-{self.total}"
    

class DetalleCompra(models.Model):
    """Modelo para el registro del Detalle de Compras."""
    compra = models.ForeignKey(Compra, related_name='detalles_productos', on_delete=models.CASCADE)
    producto = models.ForeignKey(Producto, null=True, on_delete=models.SET_NULL)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField("Precio unitario", max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    
    class Meta:
        verbose_name = 'Detalle de Compra'
        verbose_name_plural = 'Detalle de Compras'

    def __str__(self):
        return f"{self.cantidad}-{self.producto.nombre}-{self.precio_unitario}"
    
    def save(self, *args, **kwargs):
        # 1. Obtenemos el valor anterior de la cantidad si el objeto ya existe
        try:
            detalle_viejo = DetalleCompra.objects.get(pk=self.pk)
            diferencia_stock = self.cantidad - detalle_viejo.cantidad
        except DetalleCompra.DoesNotExist:
            # Si el objeto es nuevo, la diferencia es la cantidad total
            diferencia_stock = self.cantidad

        # 2. Actualizamos el stock del producto con la diferencia
        self.producto.stock += diferencia_stock
        
        # 3. Actualizamos el precio de costo del producto
        self.producto.precio_costo = self.precio_unitario
        self.producto.save()
        
        # 4. Calcula el subtotal antes de guardar
        self.subtotal = self.cantidad * self.precio_unitario
        
        # Llama al save original para guardar la instancia de DetalleCompra
        super().save(*args, **kwargs)
        
class Gasto(models.Model):
    """Modelo para registrar el detalle de gastos varios."""
    fecha = models.DateField(default=date.today)
    descripcion = models.CharField(max_length=50)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    
    def __str__(self):
        return f"{self.fecha}-{self.descripcion}-{self.total}"