from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from ventas.models import Cliente, ObraSocial, DetalleVenta, Venta
from productos.models import Producto
from ventas.admin import ClienteAdmin, DetalleVentaForm, ProductoWidget


class TestClienteAdmin(TestCase):
    """Tests para ClienteAdmin"""

    def setUp(self):
        # Crear superusuario
        User = get_user_model()
        self.admin_user = User.objects.create_superuser(
            "admin", "admin@test.com", "password123"
        )
        self.client = Client()
        self.client.force_login(self.admin_user)

        # Crear obra social y cliente
        self.obra_social = ObraSocial.objects.create(nombre="OS Test")
        self.cliente = Cliente.objects.create(
            nombre_apellido="Test",
            dni="12345679",
            fecha_nacimiento="1990-01-01",
            telefono="123",
            mail="test@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=self.obra_social,
        )

        self.cliente_admin = ClienteAdmin(Cliente, admin.site)

    def test_ver_historia_clinica(self):
        """Test el botón de ver historia clínica"""
        result = self.cliente_admin.ver_historia_clinica(self.cliente)
        expected_url = (
            reverse("admin:ventas_consulta_changelist") + f"?cliente={self.cliente.id}"
        )
        expected = format_html(
            '<a class="button" href="{}">Ver historia clínica</a>', expected_url
        )
        self.assertEqual(result, expected)

    def test_cliente_admin_list(self):
        """Test la vista de lista de clientes en el admin"""
        url = reverse("admin:ventas_cliente_changelist")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, self.cliente.nombre_apellido)
        self.assertContains(response, self.cliente.dni)


class TestDetalleVentaForm(TestCase):
    """Tests para DetalleVentaForm"""

    def setUp(self):
        self.producto = Producto.objects.create(
            nombre="Test",
            stock=10,
            precio_costo=Decimal("100.00"),
        )

    def test_clean_valid(self):
        """Test validación exitosa del formulario"""
        obra_social = ObraSocial.objects.create(nombre="OS Test")
        cliente = Cliente.objects.create(
            nombre_apellido="Test",
            dni="12345680",
            fecha_nacimiento="1990-01-01",
            telefono="123",
            mail="test@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=obra_social,
        )
        venta = Venta.objects.create(
            cliente=cliente,
            forma_pago="CO",
            entrego=Decimal("1000.00"),
        )
        form_data = {
            "venta": venta.id,
            "producto": self.producto.id,
            "cantidad": 5,
            "porcentaje_ganancia": Decimal("20.00"),
        }
        form = DetalleVentaForm(data=form_data)
        self.assertTrue(form.is_valid())

    def test_clean_invalid_stock(self):
        """Test validación cuando no hay suficiente stock"""
        obra_social = ObraSocial.objects.create(nombre="OS Test 2")
        cliente = Cliente.objects.create(
            nombre_apellido="Test 2",
            dni="12345681",
            fecha_nacimiento="1990-01-01",
            telefono="123",
            mail="test2@test.com",
            direccion="Test",
            nro_afiliado="123",
            obra_social=obra_social,
        )
        venta = Venta.objects.create(
            cliente=cliente,
            forma_pago="CO",
            entrego=Decimal("1000.00"),
        )
        form_data = {
            "venta": venta.id,
            "producto": self.producto.id,
            "cantidad": 15,  # Más que el stock disponible
            "porcentaje_ganancia": Decimal("20.00"),
        }
        form = DetalleVentaForm(data=form_data)
        self.assertFalse(form.is_valid())
        self.assertIn("cantidad", form.errors)
        self.assertIn("Stock insuficiente", str(form.errors["cantidad"]))


class TestProductoWidget(TestCase):
    """Tests para ProductoWidget"""

    def setUp(self):
        self.producto = Producto.objects.create(
            nombre="Test",
            stock=10,
            precio_costo=Decimal("100.00"),
        )
        self.widget = ProductoWidget()

    def test_create_option_with_product(self):
        """Test create_option con un producto existente"""
        option = self.widget.create_option(
            "producto", self.producto.id, self.producto.nombre, False, 0
        )
        self.assertEqual(
            option["attrs"]["data-precio-costo"], str(self.producto.precio_costo)
        )
        self.assertEqual(option["attrs"]["data-stock-actual"], str(self.producto.stock))

    def test_create_option_without_product(self):
        """Test create_option con un id de producto inexistente"""
        option = self.widget.create_option(
            "producto", 999, "No existe", False, 0  # ID inexistente
        )
        self.assertNotIn("data-precio-costo", option["attrs"])
        self.assertNotIn("data-stock-actual", option["attrs"])
