import unittest
from decimal import Decimal
from hypothesis import given, strategies as st
from hypothesis.extra.django import TestCase
from assertpy import assert_that
from productos.models import Producto
from compras.models import Proveedor, Compra, DetalleCompra


class TestComprasHypothesis(TestCase):

    @given(
        cantidad=st.integers(min_value=1, max_value=100),
        precio=st.decimals(min_value=1, max_value=1000, places=2),
    )
    def test_detalle_compra_hypothesis(self, cantidad, precio):
        producto = Producto.objects.create(nombre="Lente", stock=10, precio_costo=100)
        proveedor = Proveedor.objects.create(nombre="Proveedor X")
        compra = Compra.objects.create(proveedor=proveedor)

        detalle = DetalleCompra.objects.create(
            compra=compra, producto=producto, cantidad=cantidad, precio_unitario=precio
        )

        producto.refresh_from_db()

        assert_that(producto.stock).is_equal_to(10 + cantidad)
        assert_that(producto.precio_costo).is_equal_to(precio)
        assert_that(detalle.subtotal).is_equal_to(cantidad * precio)
