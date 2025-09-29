# tests/factories.py
"""
Factory classes para generar datos de prueba consistentes y reutilizables
usando Factory Boy pattern (sin la dependencia externa)
"""
from decimal import Decimal
from datetime import date, timedelta
import random
from django.utils import timezone

from productos.models import Producto
from compras.models import Proveedor, Compra, DetalleCompra, Gasto


class BaseFactory:
    """Base factory con utilidades comunes"""

    @staticmethod
    def random_decimal(min_val=1, max_val=1000, places=2):
        """Genera decimal aleatorio con precisión específica"""
        factor = 10**places
        return Decimal(random.randint(min_val * factor, max_val * factor)) / factor

    @staticmethod
    def random_date(days_back=365):
        """Genera fecha aleatoria en el rango especificado"""
        start_date = date.today() - timedelta(days=days_back)
        random_days = random.randint(0, days_back)
        return start_date + timedelta(days=random_days)


class ProveedorFactory(BaseFactory):
    """Factory para crear Proveedores de prueba"""

    @classmethod
    def create(cls, **kwargs):
        defaults = {
            "nombre": f"Proveedor {random.randint(1000, 9999)}",
            "direccion": f"Av. Test {random.randint(100, 999)}",
            "telefono": f"0351-{random.randint(1000000, 9999999)}",
            "alias": f"PROV{random.randint(10, 99)}",
        }
        defaults.update(kwargs)
        return Proveedor.objects.create(**defaults)

    @classmethod
    def create_batch(cls, size=3, **kwargs):
        """Crea múltiples proveedores"""
        return [cls.create(**kwargs) for _ in range(size)]

    @classmethod
    def create_cordoba_provider(cls):
        """Crea proveedor específico de Córdoba"""
        return cls.create(
            nombre="Óptica Córdoba SRL",
            direccion="Av. Colón 1234, Córdoba",
            telefono="0351-4567890",
            alias="OPCBA",
        )


class ProductoFactory(BaseFactory):
    """Factory para crear Productos de prueba"""

    NOMBRES_OPTICOS = [
        "Lente Progresivo",
        "Montura Titanio",
        "Lente Antireflejo",
        "Armazón Acetato",
        "Lente Transitions",
        "Montura Metálica",
        "Lente Policarbonato",
        "Armazón Infantil",
        "Lente Blue Light",
        "Montura Deportiva",
    ]

    @classmethod
    def create(cls, **kwargs):
        defaults = {
            "nombre": random.choice(cls.NOMBRES_OPTICOS),
            "stock": random.randint(10, 200),
            "precio_costo": cls.random_decimal(50, 500),
        }
        defaults.update(kwargs)
        return Producto.objects.create(**defaults)

    @classmethod
    def create_batch(cls, size=5, **kwargs):
        """Crea múltiples productos únicos"""
        productos = []
        nombres_usados = set()

        for i in range(size):
            nombre = random.choice(cls.NOMBRES_OPTICOS)
            while nombre in nombres_usados:
                nombre = f"{random.choice(cls.NOMBRES_OPTICOS)} {i+1}"
            nombres_usados.add(nombre)

            defaults = {"nombre": nombre}
            defaults.update(kwargs)
            productos.append(cls.create(**defaults))

        return productos

    @classmethod
    def create_low_stock_product(cls):
        """Crea producto con stock bajo"""
        return cls.create(
            nombre="Producto Stock Bajo",
            stock=random.randint(1, 5),
            precio_costo=cls.random_decimal(100, 300),
        )

    @classmethod
    def create_high_value_product(cls):
        """Crea producto de alto valor"""
        return cls.create(
            nombre="Producto Premium",
            stock=random.randint(5, 20),
            precio_costo=cls.random_decimal(800, 2000),
        )


class CompraFactory(BaseFactory):
    """Factory para crear Compras de prueba"""

    @classmethod
    def create(cls, **kwargs):
        if "proveedor" not in kwargs:
            kwargs["proveedor"] = ProveedorFactory.create()

        defaults = {"fecha": cls.random_date(days_back=180)}
        defaults.update(kwargs)
        return Compra.objects.create(**defaults)

    @classmethod
    def create_with_details(cls, num_details=3, **kwargs):
        """Crea compra con detalles automáticamente"""
        compra = cls.create(**kwargs)
        productos = ProductoFactory.create_batch(num_details)

        for producto in productos:
            DetalleCompraFactory.create(compra=compra, producto=producto)

        return compra

    @classmethod
    def create_today(cls, **kwargs):
        """Crea compra de hoy"""
        kwargs["fecha"] = date.today()
        return cls.create(**kwargs)

    @classmethod
    def create_last_month(cls, **kwargs):
        """Crea compra del mes pasado"""
        kwargs["fecha"] = date.today() - timedelta(days=30)
        return cls.create(**kwargs)


class DetalleCompraFactory(BaseFactory):
    """Factory para crear DetalleCompra de prueba"""

    @classmethod
    def create(cls, **kwargs):
        if "compra" not in kwargs:
            kwargs["compra"] = CompraFactory.create()
        if "producto" not in kwargs:
            kwargs["producto"] = ProductoFactory.create()

        defaults = {
            "cantidad": random.randint(1, 20),
            "precio_unitario": cls.random_decimal(50, 300),
        }
        defaults.update(kwargs)
        return DetalleCompra.objects.create(**defaults)

    @classmethod
    def create_large_quantity(cls, **kwargs):
        """Crea detalle con cantidad grande"""
        kwargs["cantidad"] = random.randint(50, 100)
        return cls.create(**kwargs)

    @classmethod
    def create_expensive(cls, **kwargs):
        """Crea detalle con precio alto"""
        kwargs["precio_unitario"] = cls.random_decimal(500, 1500)
        return cls.create(**kwargs)


class GastoFactory(BaseFactory):
    """Factory para crear Gastos de prueba"""

    DESCRIPCIONES_GASTOS = [
        "Servicios públicos",
        "Alquiler local",
        "Internet y teléfono",
        "Seguro",
        "Limpieza",
        "Mantenimiento",
        "Publicidad",
        "Combustible",
        "Suministros oficina",
        "Honorarios profesionales",
    ]

    @classmethod
    def create(cls, **kwargs):
        defaults = {
            "fecha": cls.random_date(days_back=90),
            "descripcion": random.choice(cls.DESCRIPCIONES_GASTOS),
            "total": cls.random_decimal(500, 5000),
        }
        defaults.update(kwargs)
        return Gasto.objects.create(**defaults)

    @classmethod
    def create_monthly_expenses(cls, month_offset=0):
        """Crea gastos típicos de un mes"""
        base_date = date.today() - timedelta(days=30 * month_offset)

        gastos = []
        for descripcion in cls.DESCRIPCIONES_GASTOS[:5]:  # 5 gastos por mes
            gastos.append(cls.create(fecha=base_date, descripcion=descripcion))

        return gastos


# tests/utils.py
"""Utilidades para tests de compras"""


class ComprasTestMixin:
    """Mixin con métodos útiles para tests de compras"""

    def assertStockEquals(self, producto, expected_stock):
        """Helper para verificar stock de producto"""
        producto.refresh_from_db()
        self.assertEqual(producto.stock, expected_stock)

    def assertTotalCompraEquals(self, compra, expected_total):
        """Helper para verificar total de compra calculado"""
        total_calculado = sum(
            detalle.subtotal for detalle in compra.detalles_productos.all()
        )
        self.assertEqual(total_calculado, expected_total)

    def create_compra_completa(self, num_productos=3):
        """Crea una compra completa con productos y detalles"""
        proveedor = ProveedorFactory.create()
        compra = CompraFactory.create(proveedor=proveedor)
        productos = ProductoFactory.create_batch(num_productos)

        total_esperado = Decimal("0.00")
        for producto in productos:
            cantidad = random.randint(1, 10)
            precio = BaseFactory.random_decimal(50, 200)

            DetalleCompraFactory.create(
                compra=compra,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=precio,
            )

            total_esperado += cantidad * precio

        return compra, productos, total_esperado

    def simulate_stock_movement(self, producto, movements):
        """Simula múltiples movimientos de stock"""
        stock_inicial = producto.stock

        for cantidad, precio in movements:
            compra = CompraFactory.create()
            DetalleCompraFactory.create(
                compra=compra,
                producto=producto,
                cantidad=cantidad,
                precio_unitario=precio,
            )

        producto.refresh_from_db()
        stock_final = producto.stock
        total_agregado = sum(mov[0] for mov in movements)

        self.assertEqual(stock_final, stock_inicial + total_agregado)
        return stock_final


# tests/base.py
"""Base classes para tests de compras"""

from django.test import TestCase, TransactionTestCase
from assertpy import assert_that


class ComprasBaseTestCase(TestCase, ComprasTestMixin):
    """Base test case para tests de compras con factories y utilities"""

    def setUp(self):
        """Setup común para todos los tests de compras"""
        self.proveedor_default = ProveedorFactory.create_cordoba_provider()
        self.productos_stock = ProductoFactory.create_batch(5)

    def tearDown(self):
        """Cleanup después de cada test"""
        # Limpiar datos que puedan afectar otros tests
        pass


class ComprasTransactionalTestCase(TransactionTestCase, ComprasTestMixin):
    """Base test case transaccional para tests de compras"""

    def setUp(self):
        """Setup común para todos los tests transaccionales de compras"""
        # Crear proveedor y productos de prueba
        self.proveedor = ProveedorFactory.create_cordoba_provider()
        self.producto1 = ProductoFactory.create(
            nombre="Producto Test 1", stock=100, precio_costo=Decimal("100.00")
        )
        self.producto2 = ProductoFactory.create(
            nombre="Producto Test 2", stock=200, precio_costo=Decimal("200.00")
        )

    def tearDown(self):
        """Limpieza después de cada test"""
        # Eliminar todos los objetos creados durante el test
        Compra.objects.all().delete()
        DetalleCompra.objects.all().delete()
        Producto.objects.all().delete()
        Proveedor.objects.all().delete()

    def create_test_compra(self, **kwargs):
        """Helper para crear compra de prueba con valores predeterminados"""
        defaults = {
            "fecha": date.today(),
            "proveedor": self.proveedor,
            "numero_factura": f"TEST-{random.randint(1000, 9999)}",
        }
        defaults.update(kwargs)
        return CompraFactory.create(**defaults)

    def verify_stock_changes(self, producto, initial_stock, expected_change):
        """Helper para verificar cambios en el stock"""
        producto.refresh_from_db()
        assert_that(producto.stock).is_equal_to(initial_stock + expected_change)
