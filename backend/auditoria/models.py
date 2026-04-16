"""
Modelos de auditoría centralizada del sistema Optic-AR.

Registra un único RegistroAuditoria por operación (crear/editar/eliminar)
para los modelos Compra, Venta, Producto y Turno, almacenando el detalle
completo de la operación en un JSONField.
"""

from django.conf import settings
from django.db import models


class RegistroAuditoria(models.Model):
    """
    Registro centralizado de auditoría del sistema.

    Cada fila representa una sola operación realizada por un usuario
    sobre uno de los modelos auditados. El campo ``detalle`` almacena
    un JSON con el snapshot o diff completo de la operación.
    """

    ACCION_CREAR = "crear"
    ACCION_EDITAR = "editar"
    ACCION_ELIMINAR = "eliminar"

    ACCIONES = [
        (ACCION_CREAR, "Crear"),
        (ACCION_EDITAR, "Editar"),
        (ACCION_ELIMINAR, "Eliminar"),
    ]

    MODELO_COMPRA = "compra"
    MODELO_VENTA = "venta"
    MODELO_PRODUCTO = "producto"
    MODELO_TURNO = "turno"

    MODELOS = [
        (MODELO_COMPRA, "Compra"),
        (MODELO_VENTA, "Venta"),
        (MODELO_PRODUCTO, "Producto"),
        (MODELO_TURNO, "Turno"),
    ]

    fecha = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha y hora en que se realizó la operación.",
    )
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="registros_auditoria",
        help_text="Usuario que realizó la operación.",
    )
    accion = models.CharField(
        max_length=10,
        choices=ACCIONES,
        help_text="Tipo de operación realizada.",
    )
    modelo = models.CharField(
        max_length=20,
        choices=MODELOS,
        help_text="Modelo sobre el que se realizó la operación.",
    )
    objeto_id = models.IntegerField(
        help_text="ID del objeto afectado.",
    )
    detalle = models.JSONField(
        help_text="Snapshot o diff completo de la operación.",
    )

    class Meta:
        verbose_name = "Registro de Auditoría"
        verbose_name_plural = "Registros de Auditoría"
        ordering = ["-fecha"]
        indexes = [
            models.Index(fields=["modelo", "objeto_id"]),
            models.Index(fields=["fecha"]),
            models.Index(fields=["usuario"]),
        ]

    def __str__(self) -> str:
        usuario_str = self.usuario.username if self.usuario else "sistema"
        return f"{self.get_accion_display()} {self.get_modelo_display()} #{self.objeto_id} — {usuario_str}"
