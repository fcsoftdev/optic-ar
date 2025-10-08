"""
Modelos para el sistema de gestión de turnos simplificado.

Esta aplicación maneja un sistema básico de turnos con calendario
sin servicios predefinidos ni estados complejos.
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, timedelta


class ConfiguracionCalendario(models.Model):
    """
    Configuración básica del calendario de turnos.

    Define horarios de atención y configuraciones generales.
    """

    nombre = models.CharField(
        max_length=100, unique=True, default="Configuración Principal"
    )

    # Horarios de atención
    hora_apertura = models.TimeField(default="09:00", help_text="Hora de apertura")
    hora_cierre = models.TimeField(default="18:00", help_text="Hora de cierre")

    # Configuración de turnos
    duracion_turno_default = models.PositiveIntegerField(
        default=30, help_text="Duración por defecto de los turnos en minutos"
    )

    activa = models.BooleanField(
        default=True, help_text="Indica si esta configuración está activa"
    )

    class Meta:
        verbose_name = "Configuración de Calendario"
        verbose_name_plural = "Configuraciones de Calendario"

    def __str__(self):
        return self.nombre

    @classmethod
    def get_configuracion_activa(cls):
        """Obtiene la configuración activa del calendario."""
        return cls.objects.filter(activa=True).first()


class Turno(models.Model):
    """
    Modelo principal para la gestión de turnos de clientes.

    Versión simplificada que integra con el modelo Cliente existente
    sin servicios predefinidos ni estados complejos.
    """

    # Relación con cliente
    cliente = models.ForeignKey(
        "ventas.Cliente",
        on_delete=models.CASCADE,
        related_name="turnos",
        help_text="Cliente al que se asigna el turno",
    )

    # Información temporal
    fecha = models.DateField(help_text="Fecha del turno")
    hora_inicio = models.TimeField(help_text="Hora de inicio del turno")
    hora_fin = models.TimeField(
        blank=True,
        null=True,
        help_text="Hora de finalización (se calcula automáticamente)",
    )

    # Información adicional
    motivo = models.TextField(
        blank=True, null=True, help_text="Motivo específico de la consulta"
    )
    observaciones = models.TextField(
        blank=True, null=True, help_text="Observaciones internas del personal"
    )

    # Auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        "auth.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="turnos_creados",
        help_text="Usuario que creó el turno",
    )

    class Meta:
        verbose_name = "Turno"
        verbose_name_plural = "Turnos"
        ordering = ["fecha", "hora_inicio"]
        indexes = [
            models.Index(fields=["fecha", "hora_inicio"]),
            models.Index(fields=["cliente", "fecha"]),
        ]

    def __str__(self):
        return f"{self.cliente.nombre_apellido} - {self.fecha} {self.hora_inicio}"

    def clean(self):
        """Validaciones personalizadas del modelo."""
        super().clean()

        # Validar que la fecha no sea anterior a hoy (solo para turnos nuevos)
        if self.fecha and self.fecha < timezone.now().date() and not self.pk:
            raise ValidationError(
                {"fecha": "No se puede programar un turno en una fecha pasada."}
            )

        # Calcular hora de fin automáticamente si no está definida
        if self.hora_inicio and not self.hora_fin:
            config = ConfiguracionCalendario.get_configuracion_activa()
            duracion = config.duracion_turno_default if config else 30

            inicio = datetime.combine(
                self.fecha or timezone.now().date(), self.hora_inicio
            )
            fin = inicio + timedelta(minutes=duracion)
            self.hora_fin = fin.time()

        # Validar conflictos de horario
        if self.fecha and self.hora_inicio and self.hora_fin:
            turnos_conflicto = Turno.objects.filter(fecha=self.fecha).exclude(
                pk=self.pk if self.pk else None
            )

            for turno in turnos_conflicto:
                if (
                    self.hora_inicio < turno.hora_fin
                    and self.hora_fin > turno.hora_inicio
                ):
                    raise ValidationError(
                        {
                            "hora_inicio": f"Conflicto de horario con turno existente: {turno}"
                        }
                    )

    def save(self, *args, **kwargs):
        """Guarda el turno calculando automáticamente la hora de fin."""
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def duracion(self):
        """Calcula la duración del turno."""
        if self.hora_inicio and self.hora_fin:
            inicio = datetime.combine(timezone.now().date(), self.hora_inicio)
            fin = datetime.combine(timezone.now().date(), self.hora_fin)
            return fin - inicio
        return timedelta(minutes=30)

    @property
    def puede_editar(self):
        """Determina si el turno puede ser editado."""
        # Los turnos futuros siempre se pueden editar
        return self.fecha >= timezone.now().date()
