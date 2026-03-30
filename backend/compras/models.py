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
        verbose_name_plural = "Proveedores"

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        """Sobrescribir save para aplicar formateo TitleCase."""
        if self.nombre:
            self.nombre = self.nombre.title()
        if self.direccion:
            self.direccion = self.direccion.title()
        super().save(*args, **kwargs)


class Compra(models.Model):
    """Modelo para registrar el detalle de compras."""

    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT)
    fecha = models.DateField(default=date.today)
    total = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"), editable=False
    )

    def __str__(self):
        return f"{self.fecha}-{self.proveedor or ''}-{self.total}"


class DetalleCompra(models.Model):
    """Modelo para el registro del Detalle de Compras."""

    compra = models.ForeignKey(
        Compra, related_name="detalles_productos", on_delete=models.CASCADE
    )
    producto = models.ForeignKey(Producto, null=True, on_delete=models.SET_NULL)
    cantidad = models.PositiveIntegerField()
    precio_unitario = models.DecimalField(
        "Precio unitario", max_digits=10, decimal_places=2, default=0
    )
    porcentaje_ganancia = models.DecimalField(
        "Porcentaje de ganancia",
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        help_text="Porcentaje de ganancia sobre el precio unitario (ej: 30.00 para 30%)",
    )
    precio_venta = models.DecimalField(
        "Precio de venta",
        max_digits=10,
        decimal_places=2,
        default=0,
        editable=False,
        help_text="Calculado automáticamente: precio_unitario × (1 + porcentaje_ganancia / 100)",
    )
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, editable=False)

    class Meta:
        verbose_name = "Detalle de Compra"
        verbose_name_plural = "Detalle de Compras"

    def __str__(self):
        producto_nombre = self.producto.nombre if self.producto else "Sin producto"
        return f"{self.cantidad}-{producto_nombre}-{self.precio_unitario}"

    def save(self, *args, **kwargs):
        from .services import calcular_precio_costo_promedio

        # 1. Calcular el subtotal
        self.subtotal = self.cantidad * self.precio_unitario

        # 3. Si hay un producto asociado, actualizamos su stock y precio
        if self.producto:
            try:
                detalle_viejo = DetalleCompra.objects.get(pk=self.pk)
                # Stock base: excluir la cantidad vieja de este mismo detalle
                stock_base = Decimal(self.producto.stock) - Decimal(detalle_viejo.cantidad)
            except DetalleCompra.DoesNotExist:
                # Nuevo detalle: el stock actual es la base completa
                stock_base = Decimal(self.producto.stock)

            cantidad_nueva = Decimal(self.cantidad)

            # Calcular nuevo costo promedio ponderado
            nuevo_costo = calcular_precio_costo_promedio(
                stock_actual=stock_base,
                costo_actual=self.producto.precio_costo or Decimal("0.00"),
                cantidad_nueva=cantidad_nueva,
                costo_nuevo=self.precio_unitario,
            )

            # 2. Precio de venta sobre el costo promedio resultante
            self.precio_venta = (
                nuevo_costo * (1 + self.porcentaje_ganancia / Decimal("100"))
            ).quantize(Decimal("0.01"))

            # Actualizar stock y precios del producto
            self.producto.stock = int(stock_base + cantidad_nueva)
            self.producto.precio_costo = nuevo_costo
            self.producto.porcentaje_ganancia = self.porcentaje_ganancia
            self.producto.precio_venta = self.precio_venta
            self.producto.save()

            # Registrar historial de costo (mantener solo las últimas 4 entradas)
            HistorialCostoProducto.objects.create(
                producto=self.producto,
                compra=self.compra,
                precio_costo=nuevo_costo,
                precio_compra=self.precio_unitario,
                fecha=self.compra.fecha,
            )
            historial_ids = list(
                HistorialCostoProducto.objects
                .filter(producto=self.producto)
                .order_by("-fecha", "-id")
                .values_list("id", flat=True)
            )
            if len(historial_ids) > 4:
                HistorialCostoProducto.objects.filter(id__in=historial_ids[4:]).delete()

        # 4. Guardar el detalle de compra
        super().save(*args, **kwargs)


class HistorialCostoProducto(models.Model):
    """Historial de los últimos costos de compra registrados para un producto."""

    producto = models.ForeignKey(
        Producto, on_delete=models.CASCADE, related_name="historial_costos"
    )
    compra = models.ForeignKey(
        Compra, on_delete=models.SET_NULL, null=True, blank=True
    )
    precio_costo = models.DecimalField("Precio promedio", max_digits=10, decimal_places=2)
    precio_compra = models.DecimalField(
        "Precio real de compra", max_digits=10, decimal_places=2, default=0
    )
    fecha = models.DateField()

    class Meta:
        verbose_name = "Historial de Costo"
        verbose_name_plural = "Historial de Costos"
        ordering = ["-fecha", "-id"]

    def __str__(self):
        return f"{self.producto} - {self.precio_costo} ({self.fecha})"


class Gasto(models.Model):
    """Modelo para registrar el detalle de gastos varios."""

    fecha = models.DateField(default=date.today)
    descripcion = models.CharField(max_length=50)
    total = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00")
    )

    def __str__(self):
        return f"{self.fecha}-{self.descripcion}-{self.total}"
