"""
Comando Django para mostrar estadísticas del sistema.
Uso: python manage.py mostrar_estadisticas
"""

from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db.models import Sum

from productos.models import Producto, Marca, Categoria, SubCategoria
from ventas.models import Venta, DetalleVenta, ObraSocial, Cliente
from compras.models import Compra, Proveedor


class Command(BaseCommand):
    help = "Muestra estadísticas del sistema"

    def handle(self, *args, **kwargs):
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("ESTADÍSTICAS DEL SISTEMA - OPTIC-AR"))
        self.stdout.write("=" * 60)

        self._mostrar_marcas()
        self._mostrar_categorias()
        self._mostrar_productos()
        self._mostrar_obras_sociales()
        self._mostrar_clientes()
        self._mostrar_proveedores()
        self._mostrar_compras()
        self._mostrar_ventas()
        self._mostrar_ganancia()
        self._mostrar_top_vendidos()
        self._mostrar_top_stock()

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(self.style.SUCCESS("✅ Sistema operativo"))
        self.stdout.write("=" * 60 + "\n")

    def _mostrar_marcas(self):
        total_marcas = Marca.objects.count()
        self.stdout.write(f"\n📊 MARCAS: {total_marcas}")
        for marca in Marca.objects.all()[:5]:
            cantidad = Producto.objects.filter(marca=marca).count()
            self.stdout.write(f"  • {marca.nombre}: {cantidad} productos")

    def _mostrar_categorias(self):
        total_categorias = Categoria.objects.count()
        total_subcategorias = SubCategoria.objects.count()
        self.stdout.write(f"\n📂 CATEGORÍAS: {total_categorias}")
        self.stdout.write(f"📂 SUBCATEGORÍAS: {total_subcategorias}")
        for cat in Categoria.objects.all():
            subcats = SubCategoria.objects.filter(categoria=cat).count()
            productos = Producto.objects.filter(categoria=cat).count()
            self.stdout.write(
                f"  • {cat.nombre}: {subcats} subcategorías, {productos} productos"
            )

    def _mostrar_productos(self):
        total_productos = Producto.objects.count()
        productos_con_stock = Producto.objects.filter(stock__gt=0).count()
        productos_sin_stock = Producto.objects.filter(stock=0).count()
        stock_total = sum([p.stock for p in Producto.objects.all()])

        self.stdout.write(f"\n📦 PRODUCTOS: {total_productos}")
        self.stdout.write(f"  • Con stock: {productos_con_stock}")
        self.stdout.write(f"  • Sin stock: {productos_sin_stock}")
        self.stdout.write(f"  • Stock total: {stock_total} unidades")

        # Valor del inventario
        valor_inventario = Decimal("0.00")
        for producto in Producto.objects.filter(stock__gt=0):
            if producto.precio_costo:
                valor_inventario += producto.stock * producto.precio_costo

        self.stdout.write(f"  • Valor del inventario (costo): ${valor_inventario:,.2f}")

        # Guardar para cálculo de ganancia
        self.valor_inventario = valor_inventario
        self.stock_total = stock_total

    def _mostrar_obras_sociales(self):
        total_obras_sociales = ObraSocial.objects.count()
        self.stdout.write(f"\n🏥 OBRAS SOCIALES: {total_obras_sociales}")

    def _mostrar_clientes(self):
        total_clientes = Cliente.objects.count()
        self.stdout.write(f"\n👥 CLIENTES: {total_clientes}")
        for cliente in Cliente.objects.all()[:5]:
            ventas_count = Venta.objects.filter(cliente=cliente).count()
            os_nombre = (
                cliente.obra_social.nombre if cliente.obra_social else "Sin obra social"
            )
            self.stdout.write(
                f"  • {cliente.nombre_apellido} ({os_nombre}): {ventas_count} ventas"
            )

    def _mostrar_proveedores(self):
        total_proveedores = Proveedor.objects.count()
        self.stdout.write(f"\n🏢 PROVEEDORES: {total_proveedores}")
        for proveedor in Proveedor.objects.all():
            compras_count = Compra.objects.filter(proveedor=proveedor).count()
            self.stdout.write(f"  • {proveedor.nombre}: {compras_count} compras")

    def _mostrar_compras(self):
        total_compras = Compra.objects.count()
        total_monto_compras = sum([c.total for c in Compra.objects.all()])
        self.stdout.write(f"\n💰 COMPRAS: {total_compras}")
        self.stdout.write(f"  • Monto total: ${total_monto_compras:,.2f}")

    def _mostrar_ventas(self):
        total_ventas = Venta.objects.count()
        total_monto_ventas = sum([v.total_venta for v in Venta.objects.all()])
        self.stdout.write(f"\n💵 VENTAS: {total_ventas}")
        self.stdout.write(f"  • Monto total: ${total_monto_ventas:,.2f}")

        # Guardar para cálculo de ganancia
        self.total_monto_ventas = total_monto_ventas

    def _mostrar_ganancia(self):
        if hasattr(self, "total_monto_ventas") and hasattr(self, "valor_inventario"):
            # Cálculo básico de ganancia (ventas - inversión en inventario vendido)
            ganancia = self.total_monto_ventas
            self.stdout.write(f"\n📈 INGRESOS POR VENTAS: ${ganancia:,.2f}")

    def _mostrar_top_vendidos(self):
        self.stdout.write("\n🏆 TOP 5 PRODUCTOS MÁS VENDIDOS:")
        top_vendidos = (
            DetalleVenta.objects.values("producto__nombre", "producto__codigo")
            .annotate(total_vendido=Sum("cantidad"))
            .order_by("-total_vendido")[:5]
        )

        if top_vendidos:
            for i, item in enumerate(top_vendidos, 1):
                self.stdout.write(
                    f"  {i}. {item['producto__codigo']} - {item['producto__nombre']}: "
                    f"{item['total_vendido']} unidades"
                )
        else:
            self.stdout.write("  No hay ventas registradas")

    def _mostrar_top_stock(self):
        self.stdout.write("\n📦 TOP 5 PRODUCTOS CON MÁS STOCK:")
        top_stock = Producto.objects.filter(stock__gt=0).order_by("-stock")[:5]

        if top_stock:
            for i, producto in enumerate(top_stock, 1):
                self.stdout.write(
                    f"  {i}. {producto.codigo} - {producto.nombre}: {producto.stock} unidades"
                )
        else:
            self.stdout.write("  No hay productos con stock")
