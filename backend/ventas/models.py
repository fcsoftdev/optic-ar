from datetime import date
from django.db import models
from django.core.validators import MaxValueValidator
from productos.models import Producto


class ObraSocial(models.Model):
    """Modelo para la registracion de Obras Sociales."""

    nombre = models.CharField(max_length=100)
    direccion = models.CharField("dirección", max_length=100, null=True, blank=True)
    telefono = models.CharField(max_length=16, null=True, blank=True)

    class Meta:
        verbose_name = "Obra Social"
        verbose_name_plural = "Obras Sociales"

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
    obra_social = models.ForeignKey(ObraSocial, null=True, on_delete=models.SET_NULL)

    def __str__(self):
        """Unicode representation of Cliente."""
        return f"{self.dni}-{self.nombre_apellido}"


class Venta(models.Model):
    """Modelo para la registracion de Ventas."""

    FORMA_PAGO_CHOICES = (
        ("CO", "Contado"),
        ("DE", "Tarjeta de Debito"),
        ("CR", "Tarjeta de Credito"),
        ("TR", "Transferencia"),
        ("QR", "QR"),
    )
    fecha = models.DateField(default=date.today)
    cliente = models.ForeignKey(Cliente, on_delete=models.CASCADE)
    forma_pago = models.CharField(
        "Forma de pago", max_length=2, choices=FORMA_PAGO_CHOICES, default="CO"
    )
    entrego = models.DecimalField("entregó", max_digits=10, decimal_places=2)
    total_venta = models.DecimalField(
        "Total", max_digits=10, decimal_places=2, default=0, editable=False
    )
    saldo = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, editable=False
    )

    def __str__(self):
        return f"{self.fecha}-{self.cliente.nombre_apellido}"


class DetalleVenta(models.Model):
    """Modelo para la registracion de Detalles de Venta para una venta."""

    venta = models.ForeignKey(
        Venta, on_delete=models.CASCADE, related_name="detalles_ventas"
    )
    producto = models.ForeignKey(
        Producto, on_delete=models.SET_NULL, null=True, blank=True
    )
    cantidad = models.PositiveIntegerField(default=1)
    precio_venta = models.DecimalField(
        "Precio de venta",
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Precio de venta para este producto (editable)",
    )
    precio_unitario = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, editable=False
    )
    subtotal_item = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, editable=False
    )

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

        # 4. Asignamos el precio de venta como precio unitario (compatibilidad)
        self.precio_unitario = self.precio_venta

        # 5. Calculamos los subtotales usando precio_venta
        self.subtotal = self.cantidad * self.precio_venta
        self.subtotal_item = self.cantidad * self.precio_venta

        # Llama al save original para guardar la instancia de DetalleCompra
        super().save(*args, **kwargs)


class Consulta(models.Model):
    """Modelo para la registracion de consultas del paciente/cliente."""

    cliente = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="consultas"
    )
    fecha = models.DateField(default=date.today)
    motivo = models.TextField()
    diagnostico = models.TextField(null=True, blank=True)
    tratamiento = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Consulta de {self.cliente.nombre_apellido} - {self.fecha}"


class Graduacion(models.Model):
    """Modelo para la registracion de las Graduaciones de lentes."""

    from decimal import Decimal
    from typing import Union

    consulta = models.OneToOneField(
        Consulta, on_delete=models.CASCADE, related_name="graduacion"
    )
    # OD = Ojo Derecho, OI = Ojo Izquierdo
    # Lejos
    od_lejos_esferico = models.DecimalField(
        "OD Lejos Esférico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    od_lejos_cilindrico = models.DecimalField(
        "OD Lejos Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    od_lejos_eje = models.PositiveSmallIntegerField(
        "OD Lejos Eje",
        validators=[MaxValueValidator(180)],
        null=True,
        blank=True,
    )

    oi_lejos_esferico = models.DecimalField(
        "OI Lejos Esférico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    oi_lejos_cilindrico = models.DecimalField(
        "OI Lejos Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    oi_lejos_eje = models.PositiveSmallIntegerField(
        "OI Lejos Eje",
        validators=[MaxValueValidator(180)],
        null=True,
        blank=True,
    )

    # Cerca
    od_cerca_esferico = models.DecimalField(
        "OD Cerca Esférico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    od_cerca_cilindrico = models.DecimalField(
        "OD Cerca Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    od_cerca_eje = models.PositiveSmallIntegerField(
        "OD Cerca Eje",
        validators=[MaxValueValidator(180)],
        null=True,
        blank=True,
    )
    oi_cerca_esferico = models.DecimalField(
        "OI Cerca Esférico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    oi_cerca_cilindrico = models.DecimalField(
        "OI Cerca Cilíndrico", max_digits=5, decimal_places=2, null=True, blank=True
    )
    oi_cerca_eje = models.PositiveSmallIntegerField(
        "OI Cerca Eje",
        validators=[MaxValueValidator(180)],
        null=True,
        blank=True,
    )

    def format_valor(self, valor: Union[Decimal, float, None]) -> str:
        """Formatea el valor añadiendo el símbolo + para números positivos y - para negativos.

        Args:
            valor: El valor decimal a formatear

        Returns:
            str: El valor formateado con el signo correspondiente
        """
        if valor is None:
            return ""
        return f"+{valor}" if valor > 0 else str(valor)

    def get_od_lejos_esferico_display(self) -> str:
        return self.format_valor(self.od_lejos_esferico)

    def get_od_lejos_cilindrico_display(self) -> str:
        return self.format_valor(self.od_lejos_cilindrico)

    def get_oi_lejos_esferico_display(self) -> str:
        return self.format_valor(self.oi_lejos_esferico)

    def get_oi_lejos_cilindrico_display(self) -> str:
        return self.format_valor(self.oi_lejos_cilindrico)

    def get_od_cerca_esferico_display(self) -> str:
        return self.format_valor(self.od_cerca_esferico)

    def get_od_cerca_cilindrico_display(self) -> str:
        return self.format_valor(self.od_cerca_cilindrico)

    def get_oi_cerca_esferico_display(self) -> str:
        return self.format_valor(self.oi_cerca_esferico)

    def get_oi_cerca_cilindrico_display(self) -> str:
        return self.format_valor(self.oi_cerca_cilindrico)

    def __str__(self):
        return f"Graduación - {self.consulta.cliente} ({self.consulta.fecha})"

    class Meta:
        verbose_name_plural = "Graduaciones"
