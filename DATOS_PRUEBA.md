# Script de Carga de Datos de Prueba

Este script carga datos de prueba completos para el sistema de gestión de ópticas Optic-AR.

## ✅ Ejecución Rápida

```bash
cd backend

# Cargar datos de prueba
python3 manage.py cargar_datos_prueba

# Ver estadísticas del sistema
python3 manage.py mostrar_estadisticas
```

## 📊 Datos Cargados en el Sistema

Después de ejecutar el comando, tendrás el sistema completamente poblado con:

### Datos Maestros

- **10 Marcas**: Ray-Ban, Oakley, Prada, Gucci, Versace, Arnette, Vulk, Rusty, Hawkers, Soho
- **4 Categorías**: Anteojos, Lentes de Contacto, Accesorios, Cristales
- **14 Subcategorías**: Organizadas por categoría (De Sol, Recetados, Deportivos, etc.)
- **8 Obras Sociales**: OSDE, Swiss Medical, Galeno, IOMA, OSECAC, PAMI, Medifé, Accord Salud
- **3 Proveedores**: Luxottica Argentina, Distribuidora Óptica SA, Importadora Vision Plus
- **5 Clientes**: Con datos completos (DNI, teléfono, obra social, etc.)

### 📦 20 Productos Realistas

Variedad de productos que encontrarías en una óptica real:

| Código  | Producto               | Marca   | Categoría           | Precio Venta |
| ------- | ---------------------- | ------- | ------------------- | ------------ |
| RB3025  | Aviador Clásico        | Ray-Ban | Anteojos De Sol     | $25,000      |
| OAK001  | Holbrook               | Oakley  | Anteojos Deportivos | $35,000      |
| PR01    | Milano                 | Prada   | Anteojos Recetados  | $45,000      |
| GUC200  | Fashion Style          | Gucci   | Anteojos De Sol     | $55,000      |
| LC001   | Lentes Diarios x30     | Soho    | Lentes de Contacto  | $28,000      |
| ACC001  | Estuche Rígido Premium | Soho    | Accesorios          | $3,000       |
| CRIS001 | Cristales Bifocales    | Soho    | Cristales           | $15,000      |

_...y 13 productos más con precios y características variadas_

### 💰 5 Compras con Detalles

Compras distribuidas en los últimos 30 días:

- **Total invertido**: $2,337,000.00
- **322 unidades** en stock después de las compras
- **Valor del inventario**: $2,221,200.00
- Actualizaciones automáticas de stock y precios

### 💵 6 Ventas Realizadas

Ventas en los últimos 6 días:

- **Total vendido**: $225,000.00
- Diferentes formas de pago (Contado, Débito, Crédito, Transferencia, QR)
- Descuento automático de stock
- Clientes con obras sociales asignadas

## Contenido Generado

El comando `python manage.py cargar_datos_prueba` carga:

### Datos Maestros

- **10 Marcas**: Ray-Ban, Oakley, Prada, Gucci, Versace, Arnette, Vulk, Rusty, Hawkers, Soho
- **4 Categorías**: Anteojos, Lentes de Contacto, Accesorios, Cristales
- **15 Subcategorías**: Organizadas por categoría (De Sol, Recetados, Deportivos, etc.)
- **8 Obras Sociales**: OSDE, Swiss Medical, Galeno, IOMA, OSECAC, PAMI, Medifé, Accord Salud

### Productos (20 en total)

Variedad de productos realistas incluyendo:

- Anteojos de sol de diferentes marcas (Ray-Ban Aviador, Oakley Holbrook, etc.)
- Anteojos recetados (Prada Milano, Soho Retro)
- Lentes de contacto (diarios, mensuales, de color)
- Accesorios (estuches, paños, líquidos, cadenas)
- Cristales (bifocales, progresivos)

Cada producto incluye:

- Código único
- Nombre descriptivo
- Marca, categoría y subcategoría
- Precios de costo y venta realistas (en pesos argentinos)
- Stock inicial en 0 (se actualiza con las compras)

### Proveedores (3)

- Luxottica Argentina
- Distribuidora Óptica SA
- Importadora Vision Plus

### Clientes (5)

Clientes con datos completos:

- DNI único
- Nombre completo
- Fecha de nacimiento
- Teléfono
- Obra social asignada
- Número de afiliado

### Compras (5)

Compras distribuidas en los últimos 30 días con:

- Diferentes proveedores
- Múltiples productos por compra
- Cantidades variadas
- Precios de costo y venta
- **Actualización automática de stock** de productos

### Ventas (6)

Ventas recientes (últimos 6 días) con:

- Diferentes clientes
- Formas de pago variadas (Contado, Débito, Crédito, Transferencia, QR)
- Productos vendidos con cantidades
- **Descuento automático de stock**

## Uso

### Cargar datos de prueba

```bash
cd backend
python manage.py cargar_datos_prueba
```

### Limpiar y recargar datos

Si necesitas limpiar la base de datos y volver a cargar los datos:

```bash
# Eliminar la base de datos SQLite
rm db.sqlite3

# Aplicar migraciones
python manage.py migrate

# Cargar datos de prueba
python manage.py cargar_datos_prueba
```

### Crear un superusuario

Para acceder al admin de Django:

```bash
python manage.py createsuperuser
```

## Características del Script

### Transaccionalidad

El script usa `transaction.atomic()` para garantizar que todos los datos se carguen correctamente o se deshagan los cambios en caso de error.

### Idempotencia

El script usa `get_or_create()` para evitar duplicados. Si ejecutas el comando múltiples veces, no creará registros duplicados.

### Relaciones Completas

- Los productos están correctamente relacionados con marcas, categorías y subcategorías
- Las compras incluyen detalles con productos y actualizan el stock automáticamente
- Las ventas están vinculadas a clientes con obras sociales

### Precios Realistas

Los precios están en pesos argentinos y reflejan valores de mercado aproximados (año 2026):

- Anteojos de sol de marca: $11,000 - $55,000
- Lentes de contacto: $18,000 - $28,000
- Accesorios: $1,500 - $5,000
- Cristales: $15,000 - $24,000

## Notas Técnicas

### Signals de Django

El sistema utiliza signals que se activan automáticamente:

- Al crear un `DetalleCompra`, se actualiza el stock y precios del producto
- Al crear un `DetalleVenta`, se descuenta el stock del producto
- Los totales de compras y ventas se calculan mediante signals

### Formato de Nombres

Los modelos aplican `.title()` automáticamente en el método `save()` para:

- Marcas
- Categorías
- Subcategorías
- Obras Sociales
- Nombres de clientes y proveedores

## Verificación de Datos

Después de ejecutar el script, puedes verificar los datos:

```bash
# Acceder al shell de Django
python manage.py shell

# Verificar productos con stock
from productos.models import Producto
productos = Producto.objects.filter(stock__gt=0)
for p in productos:
    print(f"{p.codigo} - {p.nombre}: Stock {p.stock}")

# Verificar ventas
from ventas.models import Venta
ventas = Venta.objects.all()
for v in ventas:
    print(f"{v.fecha} - {v.cliente.nombre_apellido}: ${v.total_venta}")

# Verificar compras
from compras.models import Compra
compras = Compra.objects.all()
for c in compras:
    print(f"{c.fecha} - {c.proveedor.nombre}: ${c.total}")
```

## Ubicación del Script

```
backend/productos/management/commands/
├── cargar_datos_prueba.py    # Comando para cargar datos
└── mostrar_estadisticas.py   # Comando para ver estadísticas
```

## Comandos Disponibles

### 1. Cargar Datos de Prueba

```bash
python manage.py cargar_datos_prueba
```

Carga todos los datos de prueba en el sistema (marcas, productos, compras, ventas, etc.)

### 2. Mostrar Estadísticas

```bash
python manage.py mostrar_estadisticas
```

Muestra un resumen completo del sistema con:

- Cantidad de marcas, categorías, productos
- Stock total y valor del inventario
- Obras sociales, clientes, proveedores
- Total de compras y ventas
- Top 5 productos más vendidos
- Top 5 productos con más stock

## Dependencias Requeridas

Asegúrate de tener instaladas todas las dependencias:

```bash
pip install -r requeriments/dev.txt
pip install xhtml2pdf djangorestframework django-cors-headers
```
