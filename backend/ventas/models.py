from datetime import date
from django.db import models
from productos.models import Producto


class ObraSocial(models.Model):
    """Modelo para la registracion de Obras Sociales."""

    nombre = models.CharField(max_length=100)
    direccion = models.CharField("dirección", max_length=100, null=True, blank=True)
    telefono = models.CharField(max_length=16, null=True, blank=True)

    class Meta:
        verbose_name = 'Obra Social'
        verbose_name_plural = 'Obras Sociales'

    def __str__(self):
        """Unicode representation of ObraSocial."""
        return f"{self.nombre}"


class Cliente(models.Model):
    """Modelo para la registracion de Clientes."""
    nombre_apellido = models.CharField("Nombre y apellido", max_length=150)
    dni = models.CharField(max_length=8, unique=True)
    fecha_nacimiento = models.DateField("Fecha de nacimiento")
    telefono = models.CharField(max_length=16)
    mail = models.EmailField(max_length=254)
    direccion = models.CharField(max_length=50)
    nro_afiliado = models.CharField("Número de Afiliado", max_length=50)
    obra_social = models.ForeignKey(
        ObraSocial, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        """Unicode representation of Cliente."""
        return f"{self.dni}-{self.nombre_apellido}"
    
class Venta(models.Model):
    """Modelo para la registracion de Ventas."""
    FORMA_PAGO_CHOICES = (
        ('CO', 'Contado'),
        ('DE', 'Tarjeta de Debito'),
        ('CR', 'Tarjeta de Credito'),
        ('TR', 'Transferencia'),
        ('QR', 'QR'),
    )
    fecha = models.DateField(default=date.today)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    forma_pago = models.CharField(
        "Forma de pago", max_length=2, choices=FORMA_PAGO_CHOICES, default='CO')
    entrego = models.DecimalField("entregó", max_digits=10, decimal_places=2)
    total_venta = models.DecimalField("Total", max_digits=10, decimal_places=2, default=0, editable=False)
    saldo = models.DecimalField(max_digits=10, decimal_places=2, default=0, editable=False)

    def __str__(self):
        return f"{self.fecha}-{self.cliente.nombre_apellido}"


class DetalleVenta(models.Model):
    """Modelo para la registracion de Detalles de Venta para una venta."""
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='detalles_ventas')
    producto = models.ForeignKey(
        Producto, on_delete=models.SET_NULL, null=True, blank=True)
    cantidad = models.PositiveIntegerField(default=1)
    porcentaje_ganancia = models.DecimalField(
        max_digits=5, decimal_places=2, default=0)
    precio_unitario = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, editable=False)
    subtotal_item = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, editable=False)

    def __str__(self):
        return f"{self.cantidad}-{self.producto.nombre}-{self.precio_unitario}"
    
    def save(self, *args, **kwargs):
        try:
            detalle_viejo = DetalleVenta.objects.get(pk=self.pk)
            diferencia_stock = self.cantidad - detalle_viejo.cantidad
        except DetalleVenta.DoesNotExist:
            # Si el objeto es nuevo, la diferencia es la cantidad total
            diferencia_stock = self.cantidad
        
        # 2. Actualizamos el stock del producto con la diferencia
        self.producto.stock -= diferencia_stock
        self.producto.save()
                
        # 4. Calcula el subtotal antes de guardar
        self.subtotal = self.cantidad * self.precio_unitario
        
        # 5. Calculamos el precio unitario (precio_costo * porcentaje_venta)
        self.precio_unitario = self.producto.precio_costo * (1 + (self.porcentaje_ganancia / 100))
        
        # 6. Calculamos el subtotal_item (precio_unitario * cantidad)
        self.subtotal_item = self.precio_unitario * self.cantidad
        
        # Llama al save original para guardar la instancia de DetalleCompra
        super().save(*args, **kwargs)


class Consulta(models.Model):
    """Modelo para la registracion de consultas del paciente/cliente."""
    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name='consultas')
    fecha = models.DateField(default=date.today)
    motivo = models.TextField()
    diagnostico = models.TextField(null=True, blank=True)
    tratamiento = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Consulta de {self.cliente.nombre_apellido} - {self.fecha}"


class Graduacion(models.Model):
    """Modelo para la registracion de las Graduaciones de lentes."""
    consulta = models.OneToOneField(
        Consulta, on_delete=models.CASCADE, related_name='graduacion')
    # OD = Ojo Derecho, OI = Ojo Izquierdo
    # Lejos
    od_lejos_esferico = models.DecimalField(
        "OD Lejos Esférico", max_digits=5, decimal_places=2, null=True, blank=True)
    od_lejos_cilindrico = models.DecimalField(
        "OD Lejos Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True)
    od_lejos_eje = models.PositiveIntegerField(
        "OD Lejos Eje", null=True, blank=True)

    oi_lejos_esferico = models.DecimalField(
        "OI Lejos Esférico", max_digits=5, decimal_places=2, null=True, blank=True)
    oi_lejos_cilindrico = models.DecimalField(
        "OI Lejos Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True)
    oi_lejos_eje = models.PositiveIntegerField(
        "OI Lejos Eje", null=True, blank=True)

    # Cerca
    od_cerca_esferico = models.DecimalField(
        "OD Cerca Esférico", max_digits=5, decimal_places=2, null=True, blank=True)
    od_cerca_cilindrico = models.DecimalField(
        "OD Cerca Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True)
    od_cerca_eje = models.PositiveIntegerField(
        "OD Cerca Eje", null=True, blank=True)

    oi_cerca_esferico = models.DecimalField(
        "OI Cerca Esférico", max_digits=5, decimal_places=2, null=True, blank=True)
    oi_cerca_cilindrico = models.DecimalField(
        "OI Cerca Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True)
    oi_cerca_eje = models.PositiveIntegerField(
        "OI Cerca Eje", null=True, blank=True)

    class Meta:
        verbose_name_plural = 'Graduaciones'

    def __str__(self):
        return f"Graduación - {self.consulta.cliente} ({self.consulta.fecha})"
    