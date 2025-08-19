from django.db.models.signals import pre_delete
from django.dispatch import receiver

from compras.models import Compra

# ------------------- ELIMINACIÓN -------------------
@receiver(pre_delete, sender=Compra)
def descontar_stock_al_eliminar_compra(sender, instance, **kwargs):
    """Cuando se elimina una compra, se descuenta el stock de los productos."""
    for detalle in instance.detalles_productos.all():
        producto = detalle.producto
        if producto:
            producto.stock -= detalle.cantidad
            if producto.stock < 0:
                producto.stock = 0
            producto.save()