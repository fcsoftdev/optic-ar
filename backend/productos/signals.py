"""
Signals para el manejo automático del historial de precios.
"""

from decimal import Decimal
from typing import Optional, Any
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.utils import timezone

from .models import Producto, UltimoCambioPrecio


@receiver(pre_save, sender=Producto)
def capturar_precio_anterior(sender: type, instance: Producto, **kwargs: Any) -> None:
    """
    Captura el precio anterior antes de guardar el producto.

    Args:
        sender: Modelo que envía la señal
        instance: Instancia del producto siendo guardada
        **kwargs: Argumentos adicionales
    """
    if instance.pk:
        try:
            producto_db = Producto.objects.get(pk=instance.pk)
            instance._precio_anterior = producto_db.precio_costo
        except Producto.DoesNotExist:
            instance._precio_anterior = None
    else:
        instance._precio_anterior = None


@receiver(post_save, sender=Producto)
def actualizar_ultimo_cambio_precio(
    sender: type, instance: Producto, created: bool, **kwargs: Any
) -> None:
    """
    Actualiza/crea el registro del último cambio de precio.
    Solo UNA fila por producto, siempre se actualiza.

    Args:
        sender: Modelo que envía la señal
        instance: Instancia del producto guardada
        created: True si es un nuevo registro
        **kwargs: Argumentos adicionales
    """
    precio_nuevo: Optional[Decimal] = instance.precio_costo
    precio_anterior: Optional[Decimal] = getattr(instance, "_precio_anterior", None)

    # Solo procesar si hay cambio de precio y no es una creación
    if not created and precio_anterior != precio_nuevo and precio_nuevo is not None:

        # Obtener contexto del cambio (establecido desde el admin)
        tipo_cambio: str = getattr(instance, "_tipo_cambio", "manual")
        porcentaje_aplicado: Optional[Decimal] = getattr(
            instance, "_porcentaje_aplicado", None
        )
        lote_id: Optional[str] = getattr(instance, "_lote_id", None)
        usuario_cambio: str = getattr(instance, "_usuario_cambio", "Sistema")

        # Obtener o crear el registro único
        ultimo_cambio, creado = UltimoCambioPrecio.objects.get_or_create(
            producto=instance,
            defaults={
                "precio_anterior": precio_anterior or Decimal("0"),
                "precio_actual": precio_nuevo,
                "tipo_ultimo_cambio": tipo_cambio,
                "porcentaje_aplicado": porcentaje_aplicado,
                "lote_id": lote_id,
                "usuario_ultimo_cambio": usuario_cambio,
            },
        )

        if not creado:
            # Actualizar el registro existente
            # El precio_actual anterior se convierte en precio_anterior
            ultimo_cambio.precio_anterior = ultimo_cambio.precio_actual
            ultimo_cambio.precio_actual = precio_nuevo
            ultimo_cambio.tipo_ultimo_cambio = tipo_cambio
            ultimo_cambio.porcentaje_aplicado = porcentaje_aplicado
            ultimo_cambio.lote_id = lote_id
            ultimo_cambio.usuario_ultimo_cambio = usuario_cambio
            ultimo_cambio.save()
