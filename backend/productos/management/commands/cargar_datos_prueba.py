"""
Comando Django para cargar datos de prueba en el sistema.
Uso: python manage.py cargar_datos_prueba
"""

from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.db import transaction

from productos.models import Marca, Categoria, SubCategoria, Producto
from ventas.models import ObraSocial, Cliente, Venta, DetalleVenta
from compras.models import Proveedor, Compra, DetalleCompra


class Command(BaseCommand):
    help = "Carga datos de prueba en el sistema"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Iniciando carga de datos de prueba..."))

        try:
            with transaction.atomic():
                self._cargar_marcas()
                self._cargar_categorias_subcategorias()
                self._cargar_obras_sociales()
                self._cargar_productos()
                self._cargar_proveedores()
                self._cargar_clientes()
                self._cargar_compras()
                self._cargar_ventas()

            self.stdout.write(
                self.style.SUCCESS("✓ Datos de prueba cargados exitosamente!")
            )
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error al cargar datos: {e}"))
            raise

    def _cargar_marcas(self):
        """Carga marcas de óptica reconocidas."""
        marcas_nombres = [
            "Ray-Ban",
            "Oakley",
            "Prada",
            "Gucci",
            "Versace",
            "Arnette",
            "Vulk",
            "Rusty",
            "Hawkers",
            "Soho",
        ]

        self.marcas = []
        for nombre in marcas_nombres:
            marca, created = Marca.objects.get_or_create(nombre=nombre)
            self.marcas.append(marca)
            if created:
                self.stdout.write(f"  ✓ Marca creada: {marca.nombre}")

    def _cargar_categorias_subcategorias(self):
        """Carga categorías y subcategorías de productos."""
        estructura = {
            "Anteojos": ["Recetados", "De Sol", "Deportivos", "Infantiles"],
            "Lentes de Contacto": ["Diarios", "Mensuales", "De Color"],
            "Accesorios": ["Estuches", "Paños", "Líquidos", "Cadenas"],
            "Cristales": ["Bifocales", "Progresivos", "Monofocales"],
        }

        self.categorias = {}
        self.subcategorias = []

        for cat_nombre, subcat_nombres in estructura.items():
            categoria, created = Categoria.objects.get_or_create(nombre=cat_nombre)
            self.categorias[cat_nombre] = categoria
            if created:
                self.stdout.write(f"  ✓ Categoría creada: {categoria.nombre}")

            for subcat_nombre in subcat_nombres:
                subcategoria, created = SubCategoria.objects.get_or_create(
                    categoria=categoria, nombre=subcat_nombre
                )
                self.subcategorias.append(subcategoria)
                if created:
                    self.stdout.write(
                        f"    ✓ Subcategoría creada: {subcategoria.nombre}"
                    )

    def _cargar_obras_sociales(self):
        """Carga obras sociales comunes en Argentina."""
        obras_sociales_data = [
            {"nombre": "OSDE", "telefono": "0810-555-6733"},
            {"nombre": "Swiss Medical", "telefono": "0810-333-8400"},
            {"nombre": "Galeno", "telefono": "0810-555-4253"},
            {"nombre": "IOMA", "telefono": "0800-222-4662"},
            {"nombre": "OSECAC", "telefono": "0800-222-6732"},
            {"nombre": "PAMI", "telefono": "138"},
            {"nombre": "Medifé", "telefono": "0810-444-6334"},
            {"nombre": "Accord Salud", "telefono": "0810-122-2673"},
        ]

        self.obras_sociales = []
        for os_data in obras_sociales_data:
            obra_social, created = ObraSocial.objects.get_or_create(
                nombre=os_data["nombre"], defaults={"telefono": os_data.get("telefono")}
            )
            self.obras_sociales.append(obra_social)
            if created:
                self.stdout.write(f"  ✓ Obra Social creada: {obra_social.nombre}")

    def _cargar_productos(self):
        """Carga 20 productos variados."""
        productos_data = [
            {
                "codigo": "RB3025",
                "nombre": "Aviador Clásico",
                "marca": "Ray-Ban",
                "categoria": "Anteojos",
                "subcategoria": "De Sol",
                "precio_costo": Decimal("12500.00"),
                "precio_venta": Decimal("25000.00"),
                "stock": 0,
                "descripcion": "Clásico aviador con lentes polarizados",
            },
            {
                "codigo": "OAK001",
                "nombre": "Holbrook",
                "marca": "Oakley",
                "categoria": "Anteojos",
                "subcategoria": "Deportivos",
                "precio_costo": Decimal("18000.00"),
                "precio_venta": Decimal("35000.00"),
                "stock": 0,
                "descripcion": "Diseño deportivo con protección UV",
            },
            {
                "codigo": "PR01",
                "nombre": "Milano",
                "marca": "Prada",
                "categoria": "Anteojos",
                "subcategoria": "Recetados",
                "precio_costo": Decimal("22000.00"),
                "precio_venta": Decimal("45000.00"),
                "stock": 0,
                "descripcion": "Armazón de diseño italiano",
            },
            {
                "codigo": "GUC200",
                "nombre": "Fashion Style",
                "marca": "Gucci",
                "categoria": "Anteojos",
                "subcategoria": "De Sol",
                "precio_costo": Decimal("28000.00"),
                "precio_venta": Decimal("55000.00"),
                "stock": 0,
                "descripcion": "Sofisticado estilo de moda",
            },
            {
                "codigo": "VER350",
                "nombre": "Glamour",
                "marca": "Versace",
                "categoria": "Anteojos",
                "subcategoria": "De Sol",
                "precio_costo": Decimal("25000.00"),
                "precio_venta": Decimal("50000.00"),
                "stock": 0,
                "descripcion": "Elegancia y glamour",
            },
            {
                "codigo": "ARN100",
                "nombre": "Urban",
                "marca": "Arnette",
                "categoria": "Anteojos",
                "subcategoria": "De Sol",
                "precio_costo": Decimal("8500.00"),
                "precio_venta": Decimal("17000.00"),
                "stock": 0,
                "descripcion": "Estilo urbano y moderno",
            },
            {
                "codigo": "VULK50",
                "nombre": "Sport Pro",
                "marca": "Vulk",
                "categoria": "Anteojos",
                "subcategoria": "Deportivos",
                "precio_costo": Decimal("7000.00"),
                "precio_venta": Decimal("14000.00"),
                "stock": 0,
                "descripcion": "Ideal para deportes",
            },
            {
                "codigo": "RST80",
                "nombre": "Beach",
                "marca": "Rusty",
                "categoria": "Anteojos",
                "subcategoria": "De Sol",
                "precio_costo": Decimal("6500.00"),
                "precio_venta": Decimal("13000.00"),
                "stock": 0,
                "descripcion": "Perfecto para la playa",
            },
            {
                "codigo": "HAW120",
                "nombre": "Classic Blue",
                "marca": "Hawkers",
                "categoria": "Anteojos",
                "subcategoria": "De Sol",
                "precio_costo": Decimal("5500.00"),
                "precio_venta": Decimal("11000.00"),
                "stock": 0,
                "descripcion": "Diseño clásico azul",
            },
            {
                "codigo": "SOHO45",
                "nombre": "Retro",
                "marca": "Soho",
                "categoria": "Anteojos",
                "subcategoria": "Recetados",
                "precio_costo": Decimal("4500.00"),
                "precio_venta": Decimal("9000.00"),
                "stock": 0,
                "descripcion": "Estilo retro vintage",
            },
            {
                "codigo": "RB8901",
                "nombre": "Kids Fun",
                "marca": "Ray-Ban",
                "categoria": "Anteojos",
                "subcategoria": "Infantiles",
                "precio_costo": Decimal("8000.00"),
                "precio_venta": Decimal("16000.00"),
                "stock": 0,
                "descripcion": "Especial para niños",
            },
            {
                "codigo": "LC001",
                "nombre": "Lentes Diarios x30",
                "marca": "Soho",
                "categoria": "Lentes de Contacto",
                "subcategoria": "Diarios",
                "precio_costo": Decimal("15000.00"),
                "precio_venta": Decimal("28000.00"),
                "stock": 0,
                "descripcion": "Pack de 30 lentes descartables",
            },
            {
                "codigo": "LC002",
                "nombre": "Lentes Mensuales x6",
                "marca": "Soho",
                "categoria": "Lentes de Contacto",
                "subcategoria": "Mensuales",
                "precio_costo": Decimal("12000.00"),
                "precio_venta": Decimal("22000.00"),
                "stock": 0,
                "descripcion": "Pack de 6 lentes mensuales",
            },
            {
                "codigo": "LCC001",
                "nombre": "Lentes Color Verde",
                "marca": "Soho",
                "categoria": "Lentes de Contacto",
                "subcategoria": "De Color",
                "precio_costo": Decimal("10000.00"),
                "precio_venta": Decimal("18000.00"),
                "stock": 0,
                "descripcion": "Lentes de color verde",
            },
            {
                "codigo": "ACC001",
                "nombre": "Estuche Rígido Premium",
                "marca": "Soho",
                "categoria": "Accesorios",
                "subcategoria": "Estuches",
                "precio_costo": Decimal("1500.00"),
                "precio_venta": Decimal("3000.00"),
                "stock": 0,
                "descripcion": "Estuche rígido de alta calidad",
            },
            {
                "codigo": "ACC002",
                "nombre": "Paño Microfibra x3",
                "marca": "Soho",
                "categoria": "Accesorios",
                "subcategoria": "Paños",
                "precio_costo": Decimal("800.00"),
                "precio_venta": Decimal("1500.00"),
                "stock": 0,
                "descripcion": "Pack de 3 paños de microfibra",
            },
            {
                "codigo": "ACC003",
                "nombre": "Líquido de Limpieza 120ml",
                "marca": "Soho",
                "categoria": "Accesorios",
                "subcategoria": "Líquidos",
                "precio_costo": Decimal("2000.00"),
                "precio_venta": Decimal("3500.00"),
                "stock": 0,
                "descripcion": "Solución de limpieza para lentes",
            },
            {
                "codigo": "ACC004",
                "nombre": "Cadena Acero Inoxidable",
                "marca": "Soho",
                "categoria": "Accesorios",
                "subcategoria": "Cadenas",
                "precio_costo": Decimal("2500.00"),
                "precio_venta": Decimal("5000.00"),
                "stock": 0,
                "descripcion": "Cadena elegante para anteojos",
            },
            {
                "codigo": "CRIS001",
                "nombre": "Cristales Bifocales",
                "marca": "Soho",
                "categoria": "Cristales",
                "subcategoria": "Bifocales",
                "precio_costo": Decimal("8000.00"),
                "precio_venta": Decimal("15000.00"),
                "stock": 0,
                "descripcion": "Cristales bifocales de calidad",
            },
            {
                "codigo": "CRIS002",
                "nombre": "Cristales Progresivos",
                "marca": "Soho",
                "categoria": "Cristales",
                "subcategoria": "Progresivos",
                "precio_costo": Decimal("12000.00"),
                "precio_venta": Decimal("24000.00"),
                "stock": 0,
                "descripcion": "Cristales progresivos alta gama",
            },
        ]

        self.productos = []
        for prod_data in productos_data:
            # Buscar marca
            marca = next(
                (m for m in self.marcas if m.nombre == prod_data["marca"]), None
            )

            # Buscar categoría y subcategoría
            categoria = self.categorias.get(prod_data["categoria"])
            subcategoria = next(
                (
                    sc
                    for sc in self.subcategorias
                    if sc.nombre == prod_data["subcategoria"]
                    and sc.categoria == categoria
                ),
                None,
            )

            producto, created = Producto.objects.get_or_create(
                codigo=prod_data["codigo"],
                defaults={
                    "nombre": prod_data["nombre"],
                    "marca": marca,
                    "categoria": categoria,
                    "sub_categoria": subcategoria,
                    "precio_costo": prod_data["precio_costo"],
                    "precio_venta": prod_data["precio_venta"],
                    "stock": prod_data["stock"],
                    "descripcion": prod_data.get("descripcion", ""),
                },
            )
            self.productos.append(producto)
            if created:
                self.stdout.write(
                    f"  ✓ Producto creado: {producto.codigo} - {producto.nombre}"
                )

    def _cargar_proveedores(self):
        """Carga proveedores de óptica."""
        proveedores_data = [
            {
                "nombre": "Luxottica Argentina",
                "direccion": "Av. Corrientes 1234, CABA",
                "telefono": "011-4567-8900",
                "alias": "luxottica",
            },
            {
                "nombre": "Distribuidora Óptica SA",
                "direccion": "Av. Libertador 5678, CABA",
                "telefono": "011-4321-0987",
                "alias": "distoptica",
            },
            {
                "nombre": "Importadora Vision Plus",
                "direccion": "Av. Santa Fe 3456, CABA",
                "telefono": "011-5555-7777",
                "alias": "visionplus",
            },
        ]

        self.proveedores = []
        for prov_data in proveedores_data:
            proveedor, created = Proveedor.objects.get_or_create(
                alias=prov_data["alias"],
                defaults={
                    "nombre": prov_data["nombre"],
                    "direccion": prov_data["direccion"],
                    "telefono": prov_data["telefono"],
                },
            )
            self.proveedores.append(proveedor)
            if created:
                self.stdout.write(f"  ✓ Proveedor creado: {proveedor.nombre}")

    def _cargar_clientes(self):
        """Carga clientes de prueba."""
        clientes_data = [
            {
                "nombre_apellido": "Juan Pérez",
                "dni": "12345678",
                "telefono": "11-2222-3333",
                "fecha_nacimiento": date(1985, 3, 15),
                "obra_social": "OSDE",
                "nro_afiliado": "123456/01",
            },
            {
                "nombre_apellido": "María González",
                "dni": "23456789",
                "telefono": "11-3333-4444",
                "fecha_nacimiento": date(1990, 7, 22),
                "obra_social": "Swiss Medical",
                "nro_afiliado": "654321/02",
            },
            {
                "nombre_apellido": "Carlos Rodríguez",
                "dni": "34567890",
                "telefono": "11-4444-5555",
                "fecha_nacimiento": date(1978, 11, 8),
                "obra_social": "Galeno",
                "nro_afiliado": "789012/03",
            },
            {
                "nombre_apellido": "Ana Martínez",
                "dni": "45678901",
                "telefono": "11-5555-6666",
                "fecha_nacimiento": date(1995, 5, 30),
                "obra_social": "IOMA",
                "nro_afiliado": "345678/04",
            },
            {
                "nombre_apellido": "Roberto Fernández",
                "dni": "56789012",
                "telefono": "11-6666-7777",
                "fecha_nacimiento": date(1982, 9, 12),
                "obra_social": "PAMI",
                "nro_afiliado": "901234/05",
            },
        ]

        self.clientes = []
        for cliente_data in clientes_data:
            # Buscar obra social
            obra_social = next(
                (
                    os
                    for os in self.obras_sociales
                    if os.nombre == cliente_data["obra_social"]
                ),
                None,
            )

            cliente, created = Cliente.objects.get_or_create(
                dni=cliente_data["dni"],
                defaults={
                    "nombre_apellido": cliente_data["nombre_apellido"],
                    "telefono": cliente_data["telefono"],
                    "fecha_nacimiento": cliente_data["fecha_nacimiento"],
                    "obra_social": obra_social,
                    "nro_afiliado": cliente_data["nro_afiliado"],
                },
            )
            self.clientes.append(cliente)
            if created:
                self.stdout.write(f"  ✓ Cliente creado: {cliente.nombre_apellido}")

    def _cargar_compras(self):
        """Carga compras con detalles."""
        compras_data = [
            {
                "proveedor": "luxottica",
                "fecha": date.today() - timedelta(days=30),
                "productos": [
                    {
                        "codigo": "RB3025",
                        "cantidad": 10,
                        "precio_unitario": Decimal("12500.00"),
                        "precio_venta": Decimal("25000.00"),
                    },
                    {
                        "codigo": "OAK001",
                        "cantidad": 8,
                        "precio_unitario": Decimal("18000.00"),
                        "precio_venta": Decimal("35000.00"),
                    },
                    {
                        "codigo": "PR01",
                        "cantidad": 5,
                        "precio_unitario": Decimal("22000.00"),
                        "precio_venta": Decimal("45000.00"),
                    },
                ],
            },
            {
                "proveedor": "distoptica",
                "fecha": date.today() - timedelta(days=25),
                "productos": [
                    {
                        "codigo": "GUC200",
                        "cantidad": 6,
                        "precio_unitario": Decimal("28000.00"),
                        "precio_venta": Decimal("55000.00"),
                    },
                    {
                        "codigo": "VER350",
                        "cantidad": 4,
                        "precio_unitario": Decimal("25000.00"),
                        "precio_venta": Decimal("50000.00"),
                    },
                    {
                        "codigo": "ARN100",
                        "cantidad": 12,
                        "precio_unitario": Decimal("8500.00"),
                        "precio_venta": Decimal("17000.00"),
                    },
                ],
            },
            {
                "proveedor": "visionplus",
                "fecha": date.today() - timedelta(days=20),
                "productos": [
                    {
                        "codigo": "VULK50",
                        "cantidad": 15,
                        "precio_unitario": Decimal("7000.00"),
                        "precio_venta": Decimal("14000.00"),
                    },
                    {
                        "codigo": "RST80",
                        "cantidad": 10,
                        "precio_unitario": Decimal("6500.00"),
                        "precio_venta": Decimal("13000.00"),
                    },
                    {
                        "codigo": "HAW120",
                        "cantidad": 20,
                        "precio_unitario": Decimal("5500.00"),
                        "precio_venta": Decimal("11000.00"),
                    },
                    {
                        "codigo": "SOHO45",
                        "cantidad": 15,
                        "precio_unitario": Decimal("4500.00"),
                        "precio_venta": Decimal("9000.00"),
                    },
                ],
            },
            {
                "proveedor": "distoptica",
                "fecha": date.today() - timedelta(days=15),
                "productos": [
                    {
                        "codigo": "LC001",
                        "cantidad": 25,
                        "precio_unitario": Decimal("15000.00"),
                        "precio_venta": Decimal("28000.00"),
                    },
                    {
                        "codigo": "LC002",
                        "cantidad": 20,
                        "precio_unitario": Decimal("12000.00"),
                        "precio_venta": Decimal("22000.00"),
                    },
                    {
                        "codigo": "LCC001",
                        "cantidad": 18,
                        "precio_unitario": Decimal("10000.00"),
                        "precio_venta": Decimal("18000.00"),
                    },
                ],
            },
            {
                "proveedor": "visionplus",
                "fecha": date.today() - timedelta(days=10),
                "productos": [
                    {
                        "codigo": "ACC001",
                        "cantidad": 50,
                        "precio_unitario": Decimal("1500.00"),
                        "precio_venta": Decimal("3000.00"),
                    },
                    {
                        "codigo": "ACC002",
                        "cantidad": 40,
                        "precio_unitario": Decimal("800.00"),
                        "precio_venta": Decimal("1500.00"),
                    },
                    {
                        "codigo": "ACC003",
                        "cantidad": 30,
                        "precio_unitario": Decimal("2000.00"),
                        "precio_venta": Decimal("3500.00"),
                    },
                    {
                        "codigo": "ACC004",
                        "cantidad": 25,
                        "precio_unitario": Decimal("2500.00"),
                        "precio_venta": Decimal("5000.00"),
                    },
                    {
                        "codigo": "CRIS001",
                        "cantidad": 12,
                        "precio_unitario": Decimal("8000.00"),
                        "precio_venta": Decimal("15000.00"),
                    },
                    {
                        "codigo": "CRIS002",
                        "cantidad": 10,
                        "precio_unitario": Decimal("12000.00"),
                        "precio_venta": Decimal("24000.00"),
                    },
                ],
            },
        ]

        for compra_data in compras_data:
            # Buscar proveedor
            proveedor = next(
                (p for p in self.proveedores if p.alias == compra_data["proveedor"]),
                None,
            )

            # Crear la compra
            compra = Compra.objects.create(
                proveedor=proveedor, fecha=compra_data["fecha"]
            )

            # Crear detalles de compra
            total_compra = Decimal("0.00")
            for prod_detalle in compra_data["productos"]:
                producto = next(
                    (p for p in self.productos if p.codigo == prod_detalle["codigo"]),
                    None,
                )

                if producto:
                    detalle = DetalleCompra.objects.create(
                        compra=compra,
                        producto=producto,
                        cantidad=prod_detalle["cantidad"],
                        precio_unitario=prod_detalle["precio_unitario"],
                        precio_venta=prod_detalle["precio_venta"],
                    )
                    total_compra += detalle.subtotal

            # Actualizar el total de la compra
            compra.total = total_compra
            compra.save()

            self.stdout.write(
                f"  ✓ Compra creada: {compra.fecha} - {compra.proveedor.nombre} - Total: ${compra.total}"
            )

    def _cargar_ventas(self):
        """Carga ventas con detalles."""
        ventas_data = [
            {
                "cliente_dni": "12345678",
                "fecha": date.today() - timedelta(days=5),
                "forma_pago": "CO",
                "productos": [
                    {
                        "codigo": "RB3025",
                        "cantidad": 1,
                        "precio_venta": Decimal("25000.00"),
                    },
                    {
                        "codigo": "ACC001",
                        "cantidad": 1,
                        "precio_venta": Decimal("3000.00"),
                    },
                ],
            },
            {
                "cliente_dni": "23456789",
                "fecha": date.today() - timedelta(days=4),
                "forma_pago": "DE",
                "productos": [
                    {
                        "codigo": "OAK001",
                        "cantidad": 1,
                        "precio_venta": Decimal("35000.00"),
                    },
                ],
            },
            {
                "cliente_dni": "34567890",
                "fecha": date.today() - timedelta(days=3),
                "forma_pago": "CR",
                "productos": [
                    {
                        "codigo": "LC001",
                        "cantidad": 2,
                        "precio_venta": Decimal("28000.00"),
                    },
                    {
                        "codigo": "ACC003",
                        "cantidad": 1,
                        "precio_venta": Decimal("3500.00"),
                    },
                ],
            },
            {
                "cliente_dni": "45678901",
                "fecha": date.today() - timedelta(days=2),
                "forma_pago": "TR",
                "productos": [
                    {
                        "codigo": "SOHO45",
                        "cantidad": 1,
                        "precio_venta": Decimal("9000.00"),
                    },
                    {
                        "codigo": "CRIS001",
                        "cantidad": 1,
                        "precio_venta": Decimal("15000.00"),
                    },
                    {
                        "codigo": "ACC002",
                        "cantidad": 1,
                        "precio_venta": Decimal("1500.00"),
                    },
                ],
            },
            {
                "cliente_dni": "56789012",
                "fecha": date.today() - timedelta(days=1),
                "forma_pago": "QR",
                "productos": [
                    {
                        "codigo": "HAW120",
                        "cantidad": 2,
                        "precio_venta": Decimal("11000.00"),
                    },
                    {
                        "codigo": "ACC004",
                        "cantidad": 1,
                        "precio_venta": Decimal("5000.00"),
                    },
                ],
            },
            {
                "cliente_dni": "12345678",
                "fecha": date.today(),
                "forma_pago": "CO",
                "productos": [
                    {
                        "codigo": "VER350",
                        "cantidad": 1,
                        "precio_venta": Decimal("50000.00"),
                    },
                ],
            },
        ]

        for venta_data in ventas_data:
            # Buscar cliente
            cliente = next(
                (c for c in self.clientes if c.dni == venta_data["cliente_dni"]), None
            )

            # Calcular total de la venta
            total_venta = Decimal("0.00")
            for prod_detalle in venta_data["productos"]:
                total_venta += prod_detalle["precio_venta"] * prod_detalle["cantidad"]

            # Crear la venta
            venta = Venta.objects.create(
                cliente=cliente,
                fecha=venta_data["fecha"],
                forma_pago=venta_data["forma_pago"],
                entrego=total_venta,  # Asumimos pago completo
            )

            # Crear detalles de venta
            total_venta_calculado = Decimal("0.00")
            for prod_detalle in venta_data["productos"]:
                producto = next(
                    (p for p in self.productos if p.codigo == prod_detalle["codigo"]),
                    None,
                )

                if producto:
                    detalle = DetalleVenta.objects.create(
                        venta=venta,
                        producto=producto,
                        cantidad=prod_detalle["cantidad"],
                        precio_venta=prod_detalle["precio_venta"],
                    )
                    total_venta_calculado += detalle.subtotal_item

            # Actualizar totales de la venta
            venta.total_venta = total_venta_calculado
            venta.saldo = total_venta_calculado - venta.entrego
            venta.save()

            self.stdout.write(
                f"  ✓ Venta creada: {venta.fecha} - {venta.cliente.nombre_apellido} - Total: ${venta.total_venta}"
            )
