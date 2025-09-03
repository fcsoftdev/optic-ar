from django.db.models.signals import pre_delete
from django.dispatch import receiver

from ventas.models import DetalleVenta, Venta


# ------------------- ELIMINACIÓN -------------------
@receiver(pre_delete, sender=Venta)
def devolver_stock_al_eliminar_venta(sender, instance, **kwargs):
    """Cuando se elimina una venta, se devuelve el stock a los productos."""
    for detalle in instance.detalles_ventas.all():
        producto = detalle.producto
        if producto:
            producto.stock += detalle.cantidad
            producto.save()
