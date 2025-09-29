# tests/test_signals_complete.py
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from assertpy import assert_that
from decimal import Decimal
from unittest.mock import patch, Mock
from django.db.models.signals import pre_delete, post_save

from productos.models import Producto
from compras.models import Proveedor, Compra, DetalleCompra
from compras.signals import descontar_stock_al_eliminar_compra


class TestCompraSignalsComplete(TestCase):
    """Tests comprehensivos para signals de compras"""

    def setUp(self):
        self.proveedor = Proveedor.objects.create(nombre="Proveedor Signals")
        self.producto1 = Producto.objects.create(
            nombre="Producto 1", stock=100, precio_costo=Decimal("50.00")
        )
        self.producto2 = Producto.objects.create(
            nombre="Producto 2", stock=50, precio_costo=Decimal("75.00")
        )

    def test_signal_eliminar_compra_un_producto(self):
        """Test signal al eliminar compra con un producto"""
        compra = Compra.objects.create(proveedor=self.proveedor)

        DetalleCompra.objects.create(
            compra=compra,
            producto=self.producto1,
            cantidad=10,
            precio_unitario=Decimal("60.00"),
        )

        # Verificar stock después de compra
        self.producto1.refresh_from_db()
        assert_that(self.producto1.stock).is_equal_to(110)  # 100 + 10

        # Eliminar compra → debe activar signal
        compra.delete()

        # Verificar que el stock se descontó
        self.producto1.refresh_from_db()
        assert_that(self.producto1.stock).is_equal_to(100)  # vuelve al original


def test_signal_eliminar_compra_multiples_productos(self):
    """Test signal al eliminar compra con múltiples productos"""
    # Crear una compra con dos productos
    compra = Compra.objects.create(
        fecha=date.today(), numero_factura="123", proveedor=self.proveedor
    )

    # Agregar dos productos con diferentes cantidades
    DetalleCompra.objects.create(
        compra=compra, producto=self.producto1, cantidad=5, precio_unitario=100
    )
    DetalleCompra.objects.create(
        compra=compra, producto=self.producto2, cantidad=3, precio_unitario=200
    )

    # Verificar que el stock se actualizó
    self.producto1.refresh_from_db()
    self.producto2.refresh_from_db()
    assert_that(self.producto1.stock).is_equal_to(105)  # 100 + 5
    assert_that(self.producto2.stock).is_equal_to(203)  # 200 + 3

    # Eliminar la compra → debe activar signal
    compra.delete()

    # Verificar que el stock de ambos productos volvió al original
    self.producto1.refresh_from_db()
    self.producto2.refresh_from_db()
    assert_that(self.producto1.stock).is_equal_to(100)
    assert_that(self.producto2.stock).is_equal_to(200)
