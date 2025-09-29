from django.test import TestCase
from assertpy import assert_that
from decimal import Decimal
from productos.models import Producto
from compras.models import Proveedor, Compra, DetalleCompra


class TestCompraSignals(TestCase):

    def test_eliminar_compra_resta_stock(self):
        """Al eliminar una compra, se resta el stock correspondiente a sus detalles"""
        producto = Producto.objects.create(nombre="Lente", stock=10, precio_costo=100)
        proveedor = Proveedor.objects.create(nombre="Proveedor X")
        compra = Compra.objects.create(proveedor=proveedor)

        DetalleCompra.objects.create(
            compra=compra,
            producto=producto,
            cantidad=3,
            precio_unitario=Decimal("200.00"),
        )

        # stock inicial + compra
        producto.refresh_from_db()
        assert_that(producto.stock).is_equal_to(13)

        # al eliminar la compra → signal debe restar
        compra.delete()
        producto.refresh_from_db()

        assert_that(producto.stock).is_equal_to(10)
