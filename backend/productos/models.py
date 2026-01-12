from decimal import Decimal
from typing import Optional
from django.db import models
from django.core.validators import MinValueValidator


class Marca(models.Model):
    """Model para registrar las Marcas."""

    nombre = models.CharField(max_length=100)

    def __str__(self):
        """Unicode representation of Marca."""
        return f"{self.nombre}"

    def save(self, *args, **kwargs):
        """Sobrescribir save para aplicar formateo TitleCase."""
        if self.nombre:
            self.nombre = self.nombre.title()
        super().save(*args, **kwargs)


class Categoria(models.Model):
    """Modelo para registrar las Categorias."""

    nombre = models.CharField(max_length=50)

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        """Sobrescribir save para aplicar formateo TitleCase."""
        if self.nombre:
            self.nombre = self.nombre.title()
        super().save(*args, **kwargs)


class SubCategoria(models.Model):
    categoria = models.ForeignKey(
        Categoria, null=True, on_delete=models.SET_NULL, related_name="sub_categorias"
    )
    nombre = models.CharField(max_length=50)

    class Meta:
        verbose_name = "Sub Categoria"
        verbose_name_plural = "Sub Categorias"

    def __str__(self):
        return f"{self.categoria} - {self.nombre}"

    def save(self, *args, **kwargs):
        """Sobrescribir save para aplicar formateo TitleCase."""
        if self.nombre:
            self.nombre = self.nombre.title()
        super().save(*args, **kwargs)


class Producto(models.Model):
    """Modelo para el registro de Productos."""

    codigo = models.CharField(max_length=50, blank=True)
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True)
    marca = models.ForeignKey(Marca, null=True, blank=True, on_delete=models.SET_NULL)
    categoria = models.ForeignKey(
        Categoria, null=True, on_delete=models.SET_NULL, blank=True
    )
    sub_categoria = models.ForeignKey(
        SubCategoria, null=True, on_delete=models.SET_NULL, blank=True
    )
    stock = models.PositiveIntegerField(default=0, null=True, blank=True)
    precio_costo = models.DecimalField(
        "Precio de costo",
        max_digits=10,
        decimal_places=2,
        default=0,
        null=True,
        blank=True,
    )
    porcentaje_ganancia = models.DecimalField(
        "Porcentaje de ganancia",
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Porcentaje de ganancia sobre el precio de costo (ej: 30.00 para 30%)",
    )
    precio_venta = models.DecimalField(
        "Precio de venta", max_digits=10, decimal_places=2, null=True
    )

    def __str__(self):
        marca_str = self.marca.nombre if self.marca else ""

        if self.codigo:
            if marca_str:
                return f"{self.codigo}-{self.nombre}-{marca_str}"
            else:
                return f"{self.codigo}-{self.nombre}"
        else:
            if marca_str:
                return f"{self.nombre}-{marca_str}"
            else:
                return self.nombre

    def save(self, *args, **kwargs):
        """Sobrescribir save para aplicar formateo TitleCase."""
        if self.nombre:
            self.nombre = self.nombre.title()
        super().save(*args, **kwargs)


class UltimoCambioPrecio(models.Model):
    """
    Modelo para guardar SOLO el último cambio de precio de cada producto.
    Una sola fila por producto que se actualiza constantemente.
    Permite hacer rollback del último cambio únicamente.
    """

    TIPO_CAMBIO_CHOICES = [
        ("aumento_lote", "Aumento en lote"),
        ("manual", "Cambio manual"),
        ("reversion", "Reversión"),
    ]

    producto = models.OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        related_name="ultimo_cambio_precio",
        primary_key=True,
        help_text="Producto al que pertenece este registro de cambio",
    )
    precio_anterior = models.DecimalField(
        "Precio antes del último cambio",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Precio de costo anterior al último cambio",
    )
    precio_actual = models.DecimalField(
        "Precio después del último cambio",
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0"))],
        help_text="Precio de costo actual después del último cambio",
    )
    tipo_ultimo_cambio = models.CharField(
        "Tipo de cambio", max_length=15, choices=TIPO_CAMBIO_CHOICES, default="manual"
    )
    porcentaje_aplicado = models.DecimalField(
        "Porcentaje del último aumento",
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Porcentaje aplicado en el último aumento (solo para aumentos en lote)",
    )
    lote_id = models.CharField(
        "ID del último lote",
        max_length=50,
        null=True,
        blank=True,
        db_index=True,
        help_text="Identificador del lote si fue un cambio en lote",
    )
    fecha_ultimo_cambio = models.DateTimeField(
        "Fecha del último cambio",
        auto_now=True,
        help_text="Fecha y hora del último cambio de precio",
    )
    usuario_ultimo_cambio = models.CharField(
        "Usuario que realizó el cambio",
        max_length=150,
        help_text="Usuario que realizó el último cambio de precio",
    )

    class Meta:
        verbose_name = "Último Cambio de Precio"
        verbose_name_plural = "Últimos Cambios de Precios"
        db_table = "productos_ultimo_cambio_precio"
        indexes = [
            models.Index(fields=["lote_id"], name="idx_lote_id"),
            models.Index(fields=["tipo_ultimo_cambio"], name="idx_tipo_cambio"),
            models.Index(fields=["fecha_ultimo_cambio"], name="idx_fecha_cambio"),
        ]

    def __str__(self):
        return (
            f"{self.producto.nombre}: ${self.precio_anterior} → ${self.precio_actual}"
        )

    def puede_revertir(self) -> bool:
        """
        Determina si se puede revertir al precio anterior.

        Returns:
            bool: True si el precio actual es diferente al anterior
        """
        return self.precio_anterior != self.precio_actual

    def diferencia_precio(self) -> Decimal:
        """
        Calcula la diferencia entre el precio actual y anterior.

        Returns:
            Decimal: Diferencia de precio (puede ser negativa)
        """
        return self.precio_actual - self.precio_anterior

    def porcentaje_cambio_calculado(self) -> Optional[Decimal]:
        """
        Calcula el porcentaje de cambio basado en los precios.

        Returns:
            Optional[Decimal]: Porcentaje de cambio o None si el precio anterior es 0
        """
        if self.precio_anterior > 0:
            return (
                (self.precio_actual - self.precio_anterior) / self.precio_anterior
            ) * 100
        return None
