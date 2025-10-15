"""
Modelos para el módulo de Contabilidad.
"""

from decimal import Decimal

from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class MovimientoCaja(models.Model):
    """
    Registro manual de movimientos de caja (Ingresos/Egresos).
    Permite llevar un control de entradas y salidas de dinero.
    El balance se calcula automáticamente como: Ingreso - Egreso
    """

    ingreso = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name="Ingreso"
    )
    egreso = models.DecimalField(
        max_digits=10, decimal_places=2, default=0, verbose_name="Egreso"
    )
    fecha = models.DateField(default=timezone.now, verbose_name="Fecha del Movimiento")
    observaciones = models.TextField(
        blank=True, null=True, verbose_name="Observaciones"
    )

    # Auditoría
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="movimientos_caja",
        verbose_name="Creado por",
    )
    created_at = models.DateTimeField(
        auto_now_add=True, verbose_name="Fecha de Registro"
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Modificación")

    class Meta:
        verbose_name = "Movimiento de Caja"
        verbose_name_plural = "Caja Manual"
        ordering = ["-fecha", "-created_at"]
        indexes = [
            models.Index(fields=["fecha"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=["fecha"], name="unique_movimiento_por_dia")
        ]

    @property
    def balance(self) -> Decimal:
        """Calcula el balance automáticamente: Ingreso - Egreso"""
        return self.ingreso - self.egreso

    def clean(self) -> None:
        """Validación personalizada: solo un movimiento por día"""
        from django.core.exceptions import ValidationError

        if self.fecha:
            # Buscar si ya existe un movimiento en esta fecha (excluyendo el actual si es edición)
            existe = MovimientoCaja.objects.filter(fecha=self.fecha)
            if self.pk:
                existe = existe.exclude(pk=self.pk)

            if existe.exists():
                raise ValidationError(
                    {
                        "fecha": f'Ya existe un movimiento de caja para el día {self.fecha.strftime("%d/%m/%Y")}. Solo se permite un movimiento por día.'
                    }
                )

    def __str__(self):
        return f"{self.fecha} - Balance: ${self.balance:,.2f}"
