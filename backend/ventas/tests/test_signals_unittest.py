from django.test import TestCase
from assertpy import assert_that
from decimal import Decimal
from datetime import date
from productos.models import Producto
from ventas.models import Cliente, Venta, DetalleVenta


class TestVentaSignals(TestCase):

    def setUp(self):
        self.cliente = Cliente.objects.create(
            nombre_apellido="Juan Perez",
            dni="11111117",  # Cambiado para evitar conflictos
            fecha_nacimiento=date(1990, 1, 1),
            telefono="123456",
            mail="test@test.com",
            direccion="Calle Falsa 123",
            nro_afiliado="123",
            obra_social=None,
        )

    def test_eliminar_venta_retorna_stock(self):
        """Al eliminar una venta, se devuelve el stock al producto"""
        producto = Producto.objects.create(nombre="Cristal", stock=5, precio_costo=50)
        venta = Venta.objects.create(cliente=self.cliente, entrego=Decimal("100.00"))

        DetalleVenta.objects.create(
            venta=venta, producto=producto, cantidad=2, porcentaje_ganancia=0
        )

        # stock inicial - venta
        producto.refresh_from_db()
        assert_that(producto.stock).is_equal_to(3)

        # al eliminar la venta → signal debe devolver stock
        venta.delete()
        producto.refresh_from_db()

        assert_that(producto.stock).is_equal_to(5)
