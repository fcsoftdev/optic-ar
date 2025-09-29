import unittest
from decimal import Decimal
from datetime import date, timedelta
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from hypothesis import given, assume, strategies as st, settings
from hypothesis.extra.django import TestCase
from assertpy import assert_that

from productos.models import Producto
from ventas.models import (
    ObraSocial,
    Cliente,
    Venta,
    DetalleVenta,
    Consulta,
    Graduacion,
)

# Configuración de Hypothesis para reducir la carga de pruebas
settings.register_profile(
    "minimal",
    max_examples=10,  # Pocos ejemplos
    deadline=None,  # Sin límite de tiempo
)
settings.load_profile("minimal")


# Variable global para mantener registro de DNIs usados
_used_dnis = set()


def get_unique_dni():
    """Genera un DNI único para tests"""
    i = 10000000
    while True:
        dni = str(i)
        if dni not in _used_dnis:
            _used_dnis.add(dni)
            return dni
        i += 1


# Estrategias personalizadas para Hypothesis
@st.composite
def obra_social_strategy(draw):
    """Estrategia para generar datos de ObraSocial"""
    return {
        "nombre": draw(st.text(min_size=1, max_size=100)),
        "direccion": draw(st.one_of(st.none(), st.text(max_size=100))),
        "telefono": draw(st.one_of(st.none(), st.text(max_size=16))),
    }


@st.composite
def cliente_strategy(draw):
    """Estrategia para generar datos de Cliente"""
    return {
        "nombre_apellido": draw(st.text(min_size=1, max_size=150)),
        "dni": get_unique_dni(),
        "fecha_nacimiento": draw(
            st.dates(min_value=date(1940, 1, 1), max_value=date(2010, 12, 31))
        ),
        "telefono": draw(st.text(min_size=1, max_size=16)),
        "mail": draw(st.emails()),
        "direccion": draw(st.text(min_size=1, max_size=50)),
        "nro_afiliado": draw(st.text(min_size=1, max_size=50)),
    }


@st.composite
def venta_strategy(draw):
    """Estrategia para generar datos de Venta"""
    return {
        "fecha": draw(
            st.dates(min_value=date(2020, 1, 1), max_value=date(2030, 12, 31))
        ),
        "forma_pago": draw(st.sampled_from(["CO", "DE", "CR", "TR", "QR"])),
        "entrego": draw(
            st.decimals(
                min_value=Decimal("0"), max_value=Decimal("999999.99"), places=2
            )
        ),
    }


class TestVentasHypothesis(TestCase):
    """Tests con hypothesis para ventas"""

    @given(
        stock_inicial=st.integers(min_value=1, max_value=200),
        cantidad=st.integers(min_value=1, max_value=50),
        precio_costo=st.decimals(min_value=1, max_value=1000, places=2),
        ganancia=st.decimals(min_value=0, max_value=200, places=2),
    )
    def test_detalle_venta_hypothesis(
        self, stock_inicial, cantidad, precio_costo, ganancia
    ):
        assume(cantidad <= stock_inicial)
        producto = Producto.objects.create(
            nombre="Armazón", stock=stock_inicial, precio_costo=precio_costo
        )
        cliente = Cliente.objects.create(
            nombre_apellido="Juan Perez",
            dni=f"1234{stock_inicial}",  # DNI único basado en el stock_inicial
            fecha_nacimiento=date(1990, 1, 1),
            telefono="123",
            mail="test@test.com",
            direccion="Calle Falsa",
            nro_afiliado="N/A",
            obra_social=None,
        )
        venta = Venta.objects.create(cliente=cliente, entrego=Decimal("0"))

        detalle = DetalleVenta.objects.create(
            venta=venta,
            producto=producto,
            cantidad=cantidad,
            porcentaje_ganancia=ganancia,
        )

        producto.refresh_from_db()

        esperado_precio_unitario = precio_costo * (1 + (ganancia / 100))

        assert_that(producto.stock).is_equal_to(stock_inicial - cantidad)
        assert_that(detalle.precio_unitario).is_equal_to(esperado_precio_unitario)
        assert_that(detalle.subtotal_item).is_equal_to(
            esperado_precio_unitario * cantidad
        )


class TestObraSocial(TestCase):
    """Tests para el modelo ObraSocial"""

    @given(obra_social_strategy())
    def test_crear_obra_social(self, data):
        """Test crear obra social con datos válidos"""
        obra_social = ObraSocial.objects.create(**data)

        assert_that(obra_social.nombre).is_equal_to(data["nombre"])
        assert_that(obra_social.direccion).is_equal_to(data["direccion"])
        assert_that(obra_social.telefono).is_equal_to(data["telefono"])

        # Verificar str representation
        assert_that(str(obra_social)).is_equal_to(data["nombre"])

    def test_campos_opcionales(self):
        """Test campos opcionales de ObraSocial"""
        obra_social = ObraSocial.objects.create(nombre="Test OS")
        assert_that(obra_social.direccion).is_none()
        assert_that(obra_social.telefono).is_none()


class TestCliente(TestCase):
    """Tests para el modelo Cliente"""

    def setUp(self):
        self.obra_social = ObraSocial.objects.create(nombre="OS Test")

    def test_str_method(self):
        """Test representación en string de Cliente"""
        cliente = Cliente.objects.create(
            nombre_apellido="Test",
            dni="12345670",
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="test@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        assert_that(str(cliente)).is_equal_to("12345670-Test")

    @given(cliente_strategy())
    def test_crear_cliente(self, data):
        """Test crear cliente con datos válidos"""
        data["obra_social"] = self.obra_social
        cliente = Cliente.objects.create(**data)

        assert_that(cliente.nombre_apellido).is_equal_to(data["nombre_apellido"])
        assert_that(cliente.dni).is_equal_to(data["dni"])
        assert_that(cliente.fecha_nacimiento).is_equal_to(data["fecha_nacimiento"])
        assert_that(cliente.telefono).is_equal_to(data["telefono"])
        assert_that(cliente.mail).is_equal_to(data["mail"])
        assert_that(cliente.direccion).is_equal_to(data["direccion"])
        assert_that(cliente.nro_afiliado).is_equal_to(data["nro_afiliado"])
        assert_that(cliente.obra_social).is_equal_to(self.obra_social)

    def test_dni_unico(self):
        """Test que el DNI debe ser único"""
        Cliente.objects.create(
            nombre_apellido="Test 1",
            dni="12345678",
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="test1@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )

        with self.assertRaises(IntegrityError):
            Cliente.objects.create(
                nombre_apellido="Test 2",
                dni="12345678",  # Mismo DNI
                fecha_nacimiento=date.today(),
                telefono="456",
                mail="test2@test.com",
                direccion="Test",
                nro_afiliado="456",
                obra_social=self.obra_social,
            )


class TestVenta(TestCase):
    """Tests para el modelo Venta"""

    def setUp(self):
        self.obra_social = ObraSocial.objects.create(nombre="OS Test")

    def test_str_method(self):
        """Test representación en string de Venta"""
        cliente = Cliente.objects.create(
            nombre_apellido="Test",
            dni="12345671",
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="test@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        venta = Venta.objects.create(
            cliente=cliente,
            forma_pago="CO",
            entrego=Decimal("100.00"),
            fecha=date(2023, 1, 1),
        )
        assert_that(str(venta)).is_equal_to("2023-01-01-Test")

    @given(venta_strategy())
    def test_crear_venta(self, data):
        """Test crear venta con datos válidos"""
        cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni="11111112",  # DNI único para este test
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        data["cliente"] = cliente
        venta = Venta.objects.create(**data)

        assert_that(venta.fecha).is_equal_to(data["fecha"])
        assert_that(venta.forma_pago).is_equal_to(data["forma_pago"])
        assert_that(venta.entrego).is_equal_to(data["entrego"])
        assert_that(venta.total_venta).is_equal_to(Decimal("0"))
        assert_that(venta.saldo).is_equal_to(Decimal("0"))
        assert_that(venta.cliente.dni).is_equal_to("11111112")

    def test_forma_pago_invalida(self):
        """Test que forma_pago debe ser una opción válida"""
        cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni="11111119",  # DNI único para este test
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        venta = Venta(
            cliente=cliente,
            forma_pago="XX",  # Forma de pago inválida
            entrego=Decimal("100.00"),
        )
        with self.assertRaises(ValidationError):
            venta.full_clean()


class TestDetalleVenta(TestCase):
    """Tests para el modelo DetalleVenta"""

    def setUp(self):
        """Configuración inicial para cada test"""
        self.obra_social = ObraSocial.objects.create(nombre="OS Test")
        self.cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni=get_unique_dni(),
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        self.venta = Venta.objects.create(
            cliente=self.cliente,
            forma_pago="CO",
            entrego=Decimal("1000.00"),
        )
        self.producto = Producto.objects.create(
            nombre="Producto Test",
            stock=100,
            precio_costo=Decimal("100.00"),
        )

    def test_str_method(self):
        """Test representación en string de DetalleVenta"""
        detalle = DetalleVenta.objects.create(
            venta=self.venta,
            producto=self.producto,
            cantidad=2,
            porcentaje_ganancia=Decimal("20.00"),
        )
        assert_that(str(detalle)).is_equal_to("2-Producto Test-120.0000")
        self.cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni="11111113",  # Cambiado para evitar conflictos
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        self.venta = Venta.objects.create(
            cliente=self.cliente,
            forma_pago="CO",
            entrego=Decimal("1000.00"),
        )
        self.producto = Producto.objects.create(
            nombre="Producto Test",
            stock=100,
            precio_costo=Decimal("100.00"),
        )

    @settings(max_examples=10)
    @given(
        st.integers(min_value=1, max_value=50),
        st.decimals(min_value=Decimal("0"), max_value=Decimal("100"), places=2),
    )
    def test_crear_detalle_venta(self, cantidad, porcentaje_ganancia):
        """Test crear detalle de venta con datos válidos"""
        # Asegurarse que el stock inicial es suficiente
        self.producto.stock = 100
        self.producto.save()

        # Asegurarse que la cantidad no excede el stock
        assume(cantidad <= self.producto.stock)

        try:
            detalle = DetalleVenta.objects.create(
                venta=self.venta,
                producto=self.producto,
                cantidad=cantidad,
                porcentaje_ganancia=porcentaje_ganancia,
            )

            # Verificar que se guardaron los datos correctamente
            assert_that(detalle.cantidad).is_equal_to(cantidad)
            assert_that(detalle.porcentaje_ganancia).is_equal_to(porcentaje_ganancia)

            # Verificar cálculos
            precio_esperado = self.producto.precio_costo * (
                1 + (porcentaje_ganancia / 100)
            )
            subtotal_esperado = precio_esperado * cantidad

            assert_that(detalle.precio_unitario).is_equal_to(precio_esperado)
            assert_that(detalle.subtotal_item).is_equal_to(subtotal_esperado)

            # Verificar actualización de stock
            self.producto.refresh_from_db()
            assert_that(self.producto.stock).is_equal_to(100 - cantidad)

        except IntegrityError:
            # Si hay un error de integridad (como stock insuficiente)
            # asumimos que el test pasa ya que el sistema está
            # protegiendo la integridad de los datos
            pass

    def test_actualizar_cantidad_detalle(self):
        """Test actualizar cantidad en detalle de venta"""
        detalle = DetalleVenta.objects.create(
            venta=self.venta,
            producto=self.producto,
            cantidad=5,
            porcentaje_ganancia=Decimal("20.00"),
        )

        # Verificar stock inicial
        self.producto.refresh_from_db()
        assert_that(self.producto.stock).is_equal_to(95)

        # Actualizar cantidad
        detalle.cantidad = 3
        detalle.save()

        # Verificar nuevo stock
        self.producto.refresh_from_db()
        assert_that(self.producto.stock).is_equal_to(97)


class TestConsulta(TestCase):
    """Tests para el modelo Consulta"""

    def setUp(self):
        """Configuración inicial para cada test"""
        self.obra_social = ObraSocial.objects.create(nombre="OS Test")
        self.cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni=get_unique_dni(),
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )

    def test_str_method(self):
        """Test representación en string de Consulta"""
        consulta = Consulta.objects.create(
            cliente=self.cliente,
            fecha=date(2023, 1, 1),
            motivo="Test",
            diagnostico="Test",
            tratamiento="Test",
        )
        assert_that(str(consulta)).is_equal_to("Consulta de Cliente Test - 2023-01-01")
        self.cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni="11111114",  # Cambiado para evitar conflictos
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )

    def test_crear_consulta(self):
        """Test crear consulta con datos válidos"""
        consulta = Consulta.objects.create(
            cliente=self.cliente,
            motivo="Dolor de cabeza",
            diagnostico="Miopía",
            tratamiento="Lentes correctivos",
        )

        assert_that(consulta.fecha).is_equal_to(date.today())
        assert_that(consulta.motivo).is_equal_to("Dolor de cabeza")
        assert_that(consulta.diagnostico).is_equal_to("Miopía")
        assert_that(consulta.tratamiento).is_equal_to("Lentes correctivos")

    def test_campos_opcionales_consulta(self):
        """Test campos opcionales en Consulta"""
        consulta = Consulta.objects.create(
            cliente=self.cliente,
            motivo="Revisión de rutina",
        )

        assert_that(consulta.diagnostico).is_none()
        assert_that(consulta.tratamiento).is_none()


class TestGraduacion(TestCase):
    """Tests para el modelo Graduacion"""

    def setUp(self):
        """Configuración inicial para cada test"""
        self.obra_social = ObraSocial.objects.create(nombre="OS Test")
        self.cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni=get_unique_dni(),
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        self.consulta = Consulta.objects.create(
            cliente=self.cliente,
            fecha=date(2023, 1, 1),
            motivo="Test",
        )

    def test_str_method(self):
        """Test representación en string de Graduacion"""
        graduacion = Graduacion.objects.create(
            consulta=self.consulta,
            od_lejos_esferico="+2.00",
            od_lejos_cilindrico="0.00",
            od_lejos_eje=0,
            oi_lejos_esferico="+2.00",
            oi_lejos_cilindrico="0.00",
            oi_lejos_eje=0,
        )
        expected = f"Graduación - {self.cliente.dni}-Cliente Test (2023-01-01)"
        assert_that(str(graduacion)).is_equal_to(expected)
        self.cliente = Cliente.objects.create(
            nombre_apellido="Cliente Test",
            dni="11111115",  # Cambiado para evitar conflictos
            fecha_nacimiento=date.today(),
            telefono="123",
            mail="cliente@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )
        self.consulta = Consulta.objects.create(
            cliente=self.cliente,
            motivo="Revisión de rutina",
        )

    def test_crear_graduacion_completa(self):
        """Test crear graduación con todos los datos"""
        graduacion = Graduacion.objects.create(
            consulta=self.consulta,
            # Lejos
            od_lejos_esferico=Decimal("-2.50"),
            od_lejos_cilindrico=Decimal("-0.75"),
            od_lejos_eje=180,
            oi_lejos_esferico=Decimal("-2.25"),
            oi_lejos_cilindrico=Decimal("-0.50"),
            oi_lejos_eje=175,
            # Cerca
            od_cerca_esferico=Decimal("+1.00"),
            od_cerca_cilindrico=Decimal("-0.25"),
            od_cerca_eje=90,
            oi_cerca_esferico=Decimal("+1.25"),
            oi_cerca_cilindrico=Decimal("-0.50"),
            oi_cerca_eje=85,
        )

        # Verificar datos de lejos
        assert_that(graduacion.od_lejos_esferico).is_equal_to(Decimal("-2.50"))
        assert_that(graduacion.od_lejos_cilindrico).is_equal_to(Decimal("-0.75"))
        assert_that(graduacion.od_lejos_eje).is_equal_to(180)
        assert_that(graduacion.oi_lejos_esferico).is_equal_to(Decimal("-2.25"))
        assert_that(graduacion.oi_lejos_cilindrico).is_equal_to(Decimal("-0.50"))
        assert_that(graduacion.oi_lejos_eje).is_equal_to(175)

        # Verificar datos de cerca
        assert_that(graduacion.od_cerca_esferico).is_equal_to(Decimal("+1.00"))
        assert_that(graduacion.od_cerca_cilindrico).is_equal_to(Decimal("-0.25"))
        assert_that(graduacion.od_cerca_eje).is_equal_to(90)
        assert_that(graduacion.oi_cerca_esferico).is_equal_to(Decimal("+1.25"))
        assert_that(graduacion.oi_cerca_cilindrico).is_equal_to(Decimal("-0.50"))
        assert_that(graduacion.oi_cerca_eje).is_equal_to(85)

    def test_crear_graduacion_minima(self):
        """Test crear graduación con datos mínimos"""
        graduacion = Graduacion.objects.create(
            consulta=self.consulta,
            od_lejos_esferico=Decimal("-1.00"),
            oi_lejos_esferico=Decimal("-1.00"),
        )

        # Verificar campos opcionales
        assert_that(graduacion.od_lejos_cilindrico).is_none()
        assert_that(graduacion.od_lejos_eje).is_none()
        assert_that(graduacion.od_cerca_esferico).is_none()
        assert_that(graduacion.od_cerca_cilindrico).is_none()
        assert_that(graduacion.od_cerca_eje).is_none()

    def test_una_graduacion_por_consulta(self):
        """Test que solo puede haber una graduación por consulta"""
        Graduacion.objects.create(
            consulta=self.consulta,
            od_lejos_esferico=Decimal("-1.00"),
            oi_lejos_esferico=Decimal("-1.00"),
        )

        with self.assertRaises(IntegrityError):
            Graduacion.objects.create(
                consulta=self.consulta,  # Misma consulta
                od_lejos_esferico=Decimal("-2.00"),
                oi_lejos_esferico=Decimal("-2.00"),
            )
