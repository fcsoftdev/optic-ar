from django.core.management.base import BaseCommand
from productos.models import Marca, Categoria, SubCategoria, Producto
import random


class Command(BaseCommand):
    help = "Genera productos de prueba para testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--cantidad",
            type=int,
            default=100,
            help="Cantidad de productos a generar (default: 100)",
        )

    def handle(self, *args, **options):
        cantidad = options["cantidad"]

        marcas_data = [
            "Ray-Ban",
            "Oakley",
            "Prada",
            "Gucci",
            "Versace",
            "Tom Ford",
            "Persol",
            "Carrera",
            "Vogue",
            "Arnette",
        ]
        marcas = []
        for nombre in marcas_data:
            marca, created = Marca.objects.get_or_create(nombre=nombre)
            marcas.append(marca)
            if created:
                self.stdout.write(f"Marca creada: {nombre}")

        categorias_data = {
            "Armazones": ["Armazones de plástico", "Armazones de metal"],
            "Lentes": ["Lentes desechables", "Lentes mensuales"],
            "Gafas de Sol": ["Gafas de sol polarizadas", "Gafas deportivas"],
        }

        categorias = {}
        subcategorias = []

        for cat_nombre, subcat_lista in categorias_data.items():
            categoria, created = Categoria.objects.get_or_create(nombre=cat_nombre)
            categorias[cat_nombre] = categoria
            if created:
                self.stdout.write(f"Categoría creada: {cat_nombre}")

            for subcat_nombre in subcat_lista:
                subcategoria, created = SubCategoria.objects.get_or_create(
                    nombre=subcat_nombre, categoria=categoria
                )
                subcategorias.append(subcategoria)
                if created:
                    self.stdout.write(f"Subcategoría creada: {subcat_nombre}")

        modelos = [
            "Aviator",
            "Wayfarer",
            "Round",
            "Cat Eye",
            "Clubmaster",
            "Rectangular",
            "Oversized",
            "Sport",
            "Classic",
            "Modern",
        ]

        colores = [
            "Negro",
            "Marrón",
            "Transparente",
            "Azul",
            "Verde",
            "Rojo",
            "Rosa",
            "Dorado",
            "Plateado",
        ]

        self.stdout.write("\nGenerando productos...")

        for i in range(cantidad):
            marca = random.choice(marcas)
            categoria = random.choice(list(categorias.values()))
            subcategoria = random.choice(
                [sc for sc in subcategorias if sc.categoria == categoria]
            )
            modelo = random.choice(modelos)
            color = random.choice(colores)

            codigo = f"{marca.nombre[:3].upper()}{random.randint(1000, 9999)}"
            nombre = f"{modelo} {marca.nombre} {color}"
            descripcion = f"{modelo} {color} de la marca {marca.nombre}. Estilo moderno y elegante."

            precio_costo = random.uniform(5000, 30000)
            precio_venta = precio_costo * random.uniform(1.5, 2.5)
            stock = random.randint(0, 50)

            producto, created = Producto.objects.get_or_create(
                codigo=codigo,
                defaults={
                    "nombre": nombre,
                    "descripcion": descripcion,
                    "marca": marca,
                    "categoria": categoria,
                    "sub_categoria": subcategoria,
                    "precio_costo": round(precio_costo, 2),
                    "precio_venta": round(precio_venta, 2),
                    "stock": stock,
                },
            )

            if created:
                if (i + 1) % 10 == 0:
                    self.stdout.write(f"Creados {i + 1}/{cantidad} productos...")

        self.stdout.write(
            self.style.SUCCESS(f"\n✓ {cantidad} productos generados exitosamente!")
        )
