# Product Requirements Document (PRD)

## Sistema de Gestión para Ópticas "Optic-AR"

**Versión:** 1.2  
**Fecha:** 31 de marzo de 2026  
**Autor:** Equipo de Desarrollo Optic-AR

---

## 1. Resumen Ejecutivo

### 1.1 Visión del Producto

Optic-AR es un sistema integral de gestión empresarial diseñado específicamente para ópticas que combina funcionalidades de inventario, ventas, compras, atención al paciente y contabilidad en una plataforma web moderna y fácil de usar.

### 1.2 Objetivos del Sistema

- **Optimizar** la gestión de inventario de productos ópticos (armazones, lentes, accesorios)
- **Centralizar** el registro de clientes/pacientes con historias clínicas completas
- **Automatizar** procesos de compra, venta y control de stock
- **Facilitar** el seguimiento de graduaciones y consultas oftalmológicas
- **Proporcionar** control financiero con reportes de caja y contabilidad básica
- **Mejorar** la experiencia del usuario con búsquedas inteligentes y UI responsiva

### 1.3 Stack Tecnológico

- **Backend:** Django 5.2.4 + Django REST Framework 3.15.2
- **Frontend:** React 19.1.1 + TypeScript + Vite 7.1.11
- **Base de datos:** SQLite (desarrollo) / PostgreSQL (producción)
- **UI Framework:** React Bootstrap 2.10.10
- **Estado servidor:** TanStack React Query 5.90.7
- **Estado global:** Zustand 5.x (con middleware persist)
- **Validación:** Zod 4.1.12
- **Formularios:** React Hook Form 7.66.0
- **Calendario:** FullCalendar 6.x (dayGrid + timeGrid + interaction)
- **Selects con búsqueda:** react-select 5.x
- **Autenticación:** JWT (SimpleJWT) — access token en memoria, refresh token en HttpOnly cookie

---

## 2. Módulos del Sistema

### 2.1 MÓDULO DE PRODUCTOS

#### 2.1.1 Gestión de Productos

**Descripción:** Catálogo completo de productos ópticos con control de inventario.

**Entidades principales:**

- **Producto:** Código, nombre, descripción, marca, categoría, subcategoría, stock, precio_costo, precio_venta
- **Marca:** Nombre (Ray-Ban, Oakley, Prada, etc.)
- **Categoría:** Armazones, Lentes, Gafas de Sol, Accesorios
- **SubCategoría:** Armazones de plástico/metal, Lentes desechables/mensuales, etc.

**Funcionalidades:**

1. **CRUD Completo de Productos**
   - **Crear producto:** Formulario con validación en tiempo real
     - Código: Obligatorio, alfanumérico, hasta 50 caracteres
     - Nombre: Obligatorio, hasta 200 caracteres, TitleCase automático
     - Descripción: Opcional, texto largo
     - Marca: Obligatoria, select con búsqueda (SearchableSelect)
     - Categoría: Obligatoria, select con búsqueda
     - Subcategoría: Opcional, filtrada dinámicamente por categoría seleccionada
     - Stock: Entero no negativo, por defecto 0
     - Precio de costo: Decimal (10,2), opcional
     - Precio de venta: Decimal (10,2), obligatorio, mínimo 0.01
   - **Editar producto:** Mismo formulario pre-cargado con datos existentes
   - **Eliminar producto:** Confirmación + validación de referencias (ventas/compras)
   - **Vista de listado:** Tabla paginada con búsqueda y filtros avanzados

2. **Búsqueda y Filtrado Avanzado**
   - **Búsqueda por texto:** Debounce de 500ms, busca en código, nombre y descripción
   - **Filtro por marca:** Dropdown con todas las marcas disponibles
   - **Filtro por categoría:** Dropdown dinámico
   - **Filtro por subcategoría:** Dropdown que se habilita solo si hay categoría seleccionada, se resetea automáticamente al cambiar categoría
   - **Botón "Limpiar":** Resetea todos los filtros y vuelve a la página 1
   - **Paginación inteligente:** 10 productos por página, muestra rangos (1...3 4 5...11)

3. **Gestión de Entidades Relacionadas**
   - **Modal EntityManager:** CRUD in-line para Marca, Categoría y Subcategoría desde el formulario de producto
   - **Crear:** InputGroup con botón "Agregar"
   - **Editar:** Modo inline con botones Guardar/Cancelar
   - **Eliminar:** Confirmación + manejo de errores de foreign key (mostrar alerta si está en uso)
   - **Validación:** Solo letras y espacios, TitleCase automático en backend

4. **Visualización de Stock**
   - **Colores semafóricos:**
     - Rojo (table-danger): Stock ≤ 1
     - Amarillo (table-warning): Stock entre 2-10
     - Normal (sin color): Stock > 10

5. **Gestión de Precios en Lote (Admin Django)**
   - **Aumentar precios:** Acción masiva con porcentaje de aumento
     - Validación de porcentaje (mínimo 0.01%)
     - Confirmación antes de aplicar
     - Registro en modelo `UltimoCambioPrecio` con:
       - Precio anterior y actual
       - Porcentaje aplicado
       - Lote ID (UUID)
       - Usuario y fecha
   - **Revertir último cambio:** Acción para deshacer el último aumento en lote
     - Solo productos del mismo lote
     - Vuelve al precio anterior registrado
     - Mensaje de confirmación con cantidad de productos afectados

6. **Modelo de Historial de Precios**
   - **UltimoCambioPrecio:** OneToOne con Producto
     - `precio_anterior`: Decimal antes del cambio
     - `precio_actual`: Decimal después del cambio
     - `tipo_ultimo_cambio`: Choices (aumento_lote, manual, reversion)
     - `porcentaje_aplicado`: Opcional, solo para aumentos en lote
     - `lote_id`: CharField para agrupar cambios masivos
     - `fecha_ultimo_cambio`: DateTime auto_now
     - `usuario_ultimo_cambio`: CharField
   - **Métodos:**
     - `puede_revertir()`: Valida si el precio cambió
     - `diferencia_precio()`: Calcula diferencia
     - `porcentaje_cambio_calculado()`: Calcula % de cambio

**Reglas de negocio:**

- El código del producto no necesita ser único (algunos productos sin código)
- Stock no puede ser negativo
- Precio de venta debe ser mayor a 0
- Los precios se almacenan con 2 decimales
- Marca y Categoría se formatean en TitleCase automáticamente
- Al cambiar categoría, la subcategoría se resetea a null
- Al eliminar Marca/Categoría/SubCategoría, los productos relacionados quedan con `SET_NULL`

---

### 2.2 MÓDULO DE VENTAS

#### 2.2.1 Gestión de Clientes/Pacientes

**Descripción:** Registro centralizado de clientes con datos personales y obra social.

**Entidad Cliente:**

- `nombre_apellido`: CharField(150), obligatorio, TitleCase
- `dni`: CharField(8), único, obligatorio
- `fecha_nacimiento`: DateField, opcional
- `telefono`: CharField(16), opcional
- `mail`: EmailField, opcional
- `direccion`: CharField(50), opcional, TitleCase
- `nro_afiliado`: CharField(50), opcional
- `obra_social`: ForeignKey a ObraSocial, SET_NULL

**Funcionalidades:**

1. **CRUD de Clientes**
   - Formulario con validación de DNI único
   - Búsqueda por DNI y nombre
   - Inline de consultas asociadas (TabularInline)
2. **Vista de Cliente**
   - Listado: DNI, nombre, teléfono, obra social, fecha de nacimiento
   - Acceso rápido a consultas desde el listado

**Reglas de negocio:**

- DNI debe ser único en el sistema
- Si se elimina la obra social, el cliente mantiene el registro (SET_NULL)

#### 2.2.2 Obras Sociales

**Entidad ObraSocial:**

- `nombre`: CharField(100), obligatorio, TitleCase
- `direccion`: CharField(100), opcional, TitleCase
- `telefono`: CharField(16), opcional

**Funcionalidades:**

- CRUD simple con búsqueda por nombre

#### 2.2.3 Ventas y Detalles de Venta

**Descripción:** Registro de transacciones de venta con control de stock automático.

**Entidad Venta:**

- `fecha`: DateField, default=date.today
- `cliente`: ForeignKey a Cliente, CASCADE
- `forma_pago`: Choices (Contado, Débito, Crédito, Transferencia, QR)
- `entrego`: Decimal(10,2) - monto entregado por cliente
- `total_venta`: Decimal(10,2), calculado, editable=False
- `saldo`: Decimal(10,2), calculado (entregó - total), editable=False

**Entidad DetalleVenta:**

- `venta`: ForeignKey a Venta, CASCADE
- `producto`: ForeignKey a Producto, SET_NULL
- `cantidad`: PositiveIntegerField, default=1
- `precio_venta`: Decimal(10,2), editable en el inline
- `precio_unitario`: Decimal(10,2), editable=False (copia de precio_venta)
- `subtotal_item`: Decimal(10,2), calculado (cantidad \* precio_venta), editable=False

**Funcionalidades:**

1. **Crear venta con inline de productos**
   - Admin Django con TabularInline para DetalleVenta
   - Autocomplete de productos
   - Cálculo automático de subtotales
   - JavaScript para sumar total_venta en tiempo real
2. **Control de Stock Automático**
   - Al guardar DetalleVenta:
     - Si es edición: Calcula diferencia de cantidad (nueva - vieja)
     - Si es nuevo: Diferencia = cantidad total
     - Reduce stock del producto: `producto.stock -= diferencia_stock`
3. **Campos calculados:**
   - `subtotal_item = cantidad * precio_venta`
   - `total_venta = sum(detalles_ventas.subtotal_item)`
   - `saldo = entrego - total_venta`

**JavaScript del Admin:**

- `ventas/js/detalle_venta.js`: Calcula total en tiempo real al editar el inline

**Reglas de negocio:**

- El precio_venta es editable en el inline (puede diferir del precio_venta del producto)
- Stock se reduce automáticamente al guardar
- Si se edita la cantidad, se ajusta el stock por diferencia
- Si se elimina un DetalleVenta, el stock NO se revierte (requiere ajuste manual)

#### 2.2.4 Consultas Médicas

**Descripción:** Historial clínico de consultas oftalmológicas por paciente.

**Entidad Consulta:**

- `cliente`: ForeignKey a Cliente, CASCADE
- `fecha`: DateField, default=date.today
- `motivo`: TextField, obligatorio
- `diagnostico`: TextField, opcional
- `tratamiento`: TextField, opcional

**Entidad Graduación:**

- `consulta`: OneToOneField a Consulta, CASCADE
- **Ojo Derecho (OD) - Lejos:**
  - `od_lejos_esferico`: Decimal(5,2), opcional
  - `od_lejos_cilindrico`: Decimal(5,2), opcional
  - `od_lejos_eje`: PositiveSmallInteger (0-180), opcional
- **Ojo Izquierdo (OI) - Lejos:**
  - `oi_lejos_esferico`: Decimal(5,2), opcional
  - `oi_lejos_cilindrico`: Decimal(5,2), opcional
  - `oi_lejos_eje`: PositiveSmallInteger (0-180), opcional
- **Ojo Derecho (OD) - Cerca:**
  - `od_cerca_esferico`: Decimal(5,2), opcional
  - `od_cerca_cilindrico`: Decimal(5,2), opcional
  - `od_cerca_eje`: PositiveSmallInteger (0-180), opcional
- **Ojo Izquierdo (OI) - Cerca:**
  - `oi_cerca_esferico`: Decimal(5,2), opcional
  - `oi_cerca_cilindrico`: Decimal(5,2), opcional
  - `oi_cerca_eje`: PositiveSmallInteger (0-180), opcional

**Funcionalidades:**

1. **Inline de Graduación en Consulta**
   - StackedInline en Admin Django
   - Widget personalizado `DecimalFormatWidget` que muestra valores con signo:
     - Positivos: +2.50
     - Negativos: -1.75
   - Validación de rango de ejes (0-180°)
2. **Métodos de formato:**
   - `format_valor(valor)`: Añade símbolo + a positivos
   - `get_od_lejos_esferico_display()`: Retorna valor formateado con signo

**Reglas de negocio:**

- Los valores esféricos y cilíndricos pueden ser positivos o negativos
- Los ejes deben estar entre 0 y 180 grados
- Una consulta puede tener 0 o 1 graduación (OneToOne)

---

### 2.3 MÓDULO DE COMPRAS

#### 2.3.1 Proveedores

**Entidad Proveedor:**

- `nombre`: CharField(50), TitleCase
- `direccion`: CharField(50), TitleCase
- `telefono`: CharField(50)
- `alias`: CharField(50)

**Funcionalidades:**

- CRUD simple con búsqueda por nombre

#### 2.3.2 Compras

**Descripción:** Registro de compras a proveedores con actualización automática de stock y precios.

**Entidad Compra:**

- `proveedor`: ForeignKey a Proveedor, SET_NULL
- `fecha`: DateField, default=date.today
- `total`: Decimal(10,2), calculado, editable=False

**Entidad DetalleCompra:**

- `compra`: ForeignKey a Compra, CASCADE
- `producto`: ForeignKey a Producto, SET_NULL
- `cantidad`: PositiveIntegerField, obligatorio
- `precio_unitario`: Decimal(10,2), default=0 (precio de compra)
- `precio_venta`: Decimal(10,2), default=0 (precio sugerido para venta)
- `subtotal`: Decimal(10,2), calculado, editable=False

**Funcionalidades:**

1. **Inline de productos en compra**
   - TabularInline con autocomplete de productos
   - JavaScript para calcular subtotales en tiempo real
2. **Actualización automática al guardar:**
   - **Stock:** Incrementa stock del producto
     - Si es edición: `stock += (cantidad_nueva - cantidad_vieja)`
     - Si es nuevo: `stock += cantidad`
   - **Precios:** Actualiza precios del producto
     - `producto.precio_costo = precio_unitario`
     - `producto.precio_venta = precio_venta`
   - **Subtotal:** `subtotal = cantidad * precio_unitario`
   - **Total:** `compra.total = sum(detalles_productos.subtotal)`

**JavaScript del Admin:**

- `compras/js/detalle_compra.js`: Calcula subtotales y total en tiempo real

**Reglas de negocio:**

- Al crear/editar DetalleCompra, el stock del producto se incrementa automáticamente
- Los precios del producto se actualizan con los valores de la compra
- Si se elimina un DetalleCompra, el stock NO se revierte (requiere ajuste manual)

#### 2.3.3 Gastos

**Entidad Gasto:**

- `fecha`: DateField, default=date.today
- `descripcion`: CharField(50)
- `total`: Decimal(10,2)

**Funcionalidades:**

- CRUD simple para registro de gastos varios

---

### 2.4 MÓDULO DE CONTABILIDAD

#### 2.4.1 Caja Manual

**Descripción:** Registro diario de ingresos y egresos con balance automático.

**Entidad MovimientoCaja:**

- `ingreso`: Decimal(10,2), default=0
- `egreso`: Decimal(10,2), default=0
- `fecha`: DateField, default=timezone.now
- `observaciones`: TextField, opcional
- `created_by`: ForeignKey a User, SET_NULL
- `created_at`: DateTimeField, auto_now_add
- `updated_at`: DateTimeField, auto_now

**Funcionalidades:**

1. **Registro de movimientos:**
   - Formulario simple con ingreso y egreso
   - Balance calculado automáticamente: `balance = ingreso - egreso`
2. **Restricción de unicidad:**
   - Solo un movimiento por día (constraint en BD)
   - Validación en `clean()` que previene duplicados
3. **Auditoría:**
   - Usuario que creó el registro
   - Fecha de creación y última modificación
4. **Listado con filtros:**
   - Filtro por rango de fechas (Esta semana, Este mes, Últimos 30 días, etc.)
   - Ordenado por fecha descendente

**Reglas de negocio:**

- Solo se permite un movimiento de caja por día
- El balance es una propiedad calculada, no se almacena en BD
- Los campos de auditoría son automáticos

#### 2.4.2 Reporte de Caja

**Descripción:** Vista consolidada de movimientos de caja con totales.

**Funcionalidades:**

- Listado filtrado por rango de fechas
- Columnas: Fecha, Ingreso, Egreso, Balance, Observaciones
- Totales al pie: Sum(Ingresos), Sum(Egresos), Balance Final

---

### 2.5 MÓDULO DE TURNOS

**Descripción:** Sistema simplificado de gestión de turnos con calendario interactivo estilo Google Calendar.

#### 2.5.1 Configuración de Calendario

**Entidad ConfiguracionCalendario:**

- `nombre`: CharField(100), único, default="Configuración Principal"
- `hora_apertura`: TimeField, default="09:00"
- `hora_cierre`: TimeField, default="18:00"
- `duracion_turno_default`: PositiveIntegerField, default=30 (minutos)
- `activa`: BooleanField, default=True

**Funcionalidades:**

1. **CRUD de Configuración (Solo Superusuarios)**
   - Solo puede haber una configuración activa a la vez
   - Define el horario de atención del consultorio
   - Establece la duración predeterminada de los turnos
2. **Método de clase:**
   - `get_configuracion_activa()`: Obtiene la configuración activa del sistema

**Reglas de negocio:**

- Solo superusuarios pueden modificar la configuración
- Solo una configuración puede estar activa a la vez
- La duración del turno se usa para calcular automáticamente la hora de fin

#### 2.5.2 Gestión de Turnos

**Entidad Turno:**

- `cliente`: ForeignKey a Cliente, CASCADE
- `fecha`: DateField, obligatorio
- `hora_inicio`: TimeField, obligatorio
- `hora_fin`: TimeField, calculado automáticamente
- `motivo`: TextField, opcional
- `observaciones`: TextField, opcional (internas del personal)
- `created_by`: ForeignKey a User, SET_NULL
- `created_at`: DateTimeField, auto_now_add
- `updated_at`: DateTimeField, auto_now

**Funcionalidades:**

1. **Calendario Mensual Interactivo**
   - Vista estilo Google Calendar con navegación mes a mes
   - Visualización de todos los turnos del mes
   - Click en día para ver turnos de esa fecha
   - Navegación con botones anterior/siguiente
   - Indicador visual de día actual

2. **CRUD de Turnos**
   - **Crear turno:**
     - Búsqueda de cliente por nombre, DNI o teléfono (AJAX)
     - Selección de fecha y hora de inicio
     - Hora de fin se calcula automáticamente según duración configurada
     - Validación de fecha (no se permiten turnos en fechas pasadas)
     - Validación de conflictos de horario
   - **Editar turno:**
     - Solo turnos futuros pueden editarse
     - Actualización de fecha, hora, motivo u observaciones
     - Recálculo automático de hora de fin
   - **Eliminar turno:**
     - Confirmación requerida
     - Solo turnos futuros pueden eliminarse

3. **Búsqueda y Filtrado**
   - Búsqueda por nombre del cliente, DNI, motivo u observaciones
   - Filtro por fecha (date_hierarchy)
   - Filtro por usuario que creó el turno

4. **API REST de Turnos** (migrado desde AJAX):
   - `GET /api/turnos/`: Listar turnos (filtros: start, end, cliente, search)
   - `POST /api/turnos/`: Crear turno
   - `GET /api/turnos/{id}/`: Detalle de turno
   - `PATCH /api/turnos/{id}/`: Actualizar turno (también usado para drag & drop)
   - `DELETE /api/turnos/{id}/`: Eliminar turno
   - `GET /api/config-calendario/`: Obtener configuración activa
   - `PATCH /api/config-calendario/{id}/`: Actualizar configuración

5. **Calendario Frontend con FullCalendar:**
   - Vista por defecto: `timeGridWeek` (semana con franjas horarias)
   - Vistas disponibles: `timeGridWeek`, `timeGridDay`, `dayGridMonth`
   - **Drag & drop:** mover turno a nueva fecha/hora actualiza vía PATCH
   - **Resize:** ajustar duración del turno (solo hora_fin)
   - `dateClick`: abre modal de creación con fecha/hora pre-cargada
   - `eventClick`: abre modal de edición
   - Slot duration configurable según `ConfiguracionCalendario.duracion_turno_default`
   - Horario visible limitado a `hora_apertura`/`hora_cierre` de la config
   - Localización en español (`@fullcalendar/core/locales/es`)
   - Navegación desde Dashboard: `TurnosHoy` clickeable → `/turnos?date=YYYY-MM-DD&view=timeGridDay`

6. **Generación de PDF**
   - Exportar turno individual a PDF
   - Template personalizado con datos del cliente y turno
   - Librería: xhtml2pdf

7. **Validaciones Automáticas**
   - No se pueden crear turnos en fechas pasadas
   - Detección de conflictos de horario (mismo día, horas solapadas)
   - Cálculo automático de hora de fin según configuración
   - Validación en método `clean()` del modelo

8. **Propiedades Calculadas:**
   - `duracion`: Calcula la duración del turno (hora_fin - hora_inicio)
   - `puede_editar`: Determina si el turno puede ser editado (solo futuros)

**Admin de Turnos:**

- **List display:** Cliente, fecha, hora inicio, hora fin, motivo breve, creado por, fecha creación
- **Filtros:** Fecha, usuario creador
- **Búsqueda:** Nombre del cliente, DNI, motivo, observaciones
- **Readonly fields:** created_at, updated_at, hora_fin
- **Date hierarchy:** Por fecha del turno
- **Permisos:** Solo superusuarios tienen acceso completo

**ConfigCalendarioModal (Frontend):**

- Modal exclusivo para superusuarios
- Edición de hora_apertura, hora_cierre y duracion_turno_default
- Accesible desde el botón de engranaje en `TurnosCalendar`

**Reglas de negocio:**

- Un turno solo puede ser creado para fechas futuras o el día actual
- No pueden existir dos turnos que se solapen en horario
- La hora de fin se calcula automáticamente según la duración configurada
- Solo turnos futuros pueden ser editados o eliminados
- El usuario que crea el turno queda registrado para auditoría
- Los turnos están vinculados al cliente mediante CASCADE (si se elimina el cliente, se eliminan sus turnos)

**Índices de Base de Datos:**

- `(fecha, hora_inicio)`: Para búsquedas rápidas de turnos por fecha
- `(cliente, fecha)`: Para obtener turnos de un cliente específico

---

## 3. Arquitectura Frontend

### 3.1 Estructura de Carpetas

```
frontend/src/
├── components/                    # Componentes React
│   ├── Layout.tsx                 # Layout principal (grid responsive)
│   ├── Layout.css                 # Estilos del layout (CSS variables dark mode)
│   ├── Header.tsx                 # Navbar con toggle de tema y menú de usuario
│   ├── SideNav.tsx                # Menú lateral con filtro por permisos
│   ├── SideNavItem.tsx            # Item individual del menú lateral
│   ├── MainContent.tsx            # Área de contenido con React Router
│   ├── ProtectedRoute.tsx         # Wrapper de ruta con verificación de permisos
│   ├── LoginPage.tsx              # Pantalla de login con JWT
│   ├── DashboardHome.tsx          # Dashboard con tarjetas informativas
│   ├── TurnosHoy.tsx              # Card de turnos del día actual
│   ├── VentasCard.tsx             # Card acceso rápido a ventas
│   ├── ComprasCard.tsx            # Card acceso rápido a compras
│   ├── ProfileModal.tsx           # Modal de perfil de usuario
│   ├── ProductList.tsx            # Lista de productos con filtros
│   ├── ProductoFormModal.tsx      # Modal de crear/editar producto
│   ├── AumentoMasivoModal.tsx     # Modal de aumento masivo de precios
│   ├── BrandList.tsx              # Lista de marcas con CRUD
│   ├── MarcaFormModal.tsx         # Modal de crear/editar marca
│   ├── EntityManagerModal.tsx     # Modal CRUD de entidades relacionadas
│   ├── SearchableSelect.tsx       # Select con búsqueda (react-select, dark mode)
│   ├── AsyncSearchableSelect.tsx  # Select async para búsqueda de clientes
│   ├── ClienteList.tsx            # Lista de clientes/pacientes
│   ├── ClienteFormModal.tsx       # Modal de crear/editar cliente
│   ├── ClienteConsultasModal.tsx  # Modal historial clínico del cliente
│   ├── ConsultationList.tsx       # Lista de consultas médicas
│   ├── ConsultationFormModal.tsx  # Modal de consulta con graduación
│   ├── InsuranceProvider.tsx      # Lista de obras sociales
│   ├── ObraSocialFormModal.tsx    # Modal de crear/editar obra social
│   ├── ObraSocialManagerModal.tsx # Modal CRUD de obras sociales
│   ├── SalesList.tsx              # Lista de ventas
│   ├── VentaFormModal.tsx         # Modal de crear/editar venta
│   ├── ProveedorComprasModal.tsx  # Modal historial de compras por proveedor
│   ├── PurchaseList.tsx           # Lista de compras
│   ├── CompraFormModal.tsx        # Modal de crear/editar compra
│   ├── ExpensesList.tsx           # Lista de gastos
│   ├── GastoFormModal.tsx         # Modal de crear/editar gasto
│   ├── SuppliersList.tsx          # Lista de proveedores
│   ├── ProveedorFormModal.tsx     # Modal de crear/editar proveedor
│   ├── TurnosCalendar.tsx         # Calendario FullCalendar con CRUD completo
│   ├── TurnoFormModal.tsx         # Modal de crear/editar turno
│   ├── ConfigCalendarioModal.tsx  # Modal de configuración del calendario
│   ├── ReporteCaja.tsx            # Reporte de caja con filtros de fecha
│   ├── UserList.tsx               # ABM de usuarios (solo staff)
│   ├── GroupList.tsx              # ABM de grupos/roles (solo staff)
│   ├── ListHeader.tsx             # Cabecera reutilizable para listados
│   ├── PaginationBar.tsx          # Paginación inteligente reutilizable
│   ├── AddButton.tsx              # Botón reutilizable "Agregar"
│   └── WindowsModal.tsx           # Modal genérico reutilizable
├── hooks/                         # Custom hooks React Query
│   ├── useProductos.ts            # Productos, marcas, categorías, subcategorías
│   ├── useVentas.ts               # Ventas, clientes, obras sociales, consultas
│   ├── useCompras.ts              # Compras, proveedores, gastos
│   ├── useTurnos.ts               # Turnos y configuración de calendario
│   ├── useReporteCaja.ts          # Reporte de caja con filtros
│   ├── useUsers.ts                # Usuarios y grupos
│   ├── useAuth.ts                 # Login/logout con silentRefresh
│   ├── usePerfil.ts               # Perfil del usuario autenticado
│   ├── usePermiso.ts              # Helper de verificación de permisos
│   └── useExportConsultas.ts      # Exportación de consultas médicas
├── services/                      # Capa HTTP (axios)
│   ├── api.ts                     # Cliente axios con interceptor JWT
│   ├── auth.service.ts            # Login, logout, silentRefresh
│   ├── productos.service.ts       # CRUD productos y entidades relacionadas
│   ├── ventas.service.ts          # CRUD ventas, clientes, obras sociales, consultas
│   ├── compras.service.ts         # CRUD compras, proveedores, gastos
│   ├── turnos.service.ts          # CRUD turnos y configuración calendario
│   ├── reporteCaja.service.ts     # Reporte de caja
│   ├── users.service.ts           # ABM de usuarios y grupos
│   └── perfil.service.ts          # Perfil del usuario
├── schemas/                       # Validaciones Zod
│   ├── productoSchema.ts          # Producto, marca, categoría
│   ├── ventaSchema.ts             # Venta y detalle
│   ├── compraSchema.ts            # Compra y detalle
│   ├── turnoSchema.ts             # Turno
│   ├── clienteSchema.ts           # Cliente
│   ├── obraSocialSchema.ts        # Obra social
│   ├── consultaSchema.ts          # Consulta y graduación
│   ├── marcaSchema.ts             # Marca
│   ├── login.schema.ts            # Credenciales de login
│   ├── perfil.schema.ts           # Cambio de perfil/contraseña
│   └── users.schema.ts            # Usuario y grupos
└── stores/                        # Estado global (Zustand)
    ├── useAuthStore.ts            # Access token en memoria + datos del usuario
    ├── useThemeStore.ts           # Tema light/dark/auto con persist
    └── useNavStore.ts             # Navegación interna (ej: pendingCompraId)
```

### 3.2 Patrones Implementados

#### 3.2.1 Separación de Responsabilidades

- **Services:** Funciones puras de HTTP, sin lógica React
- **Hooks:** Lógica de React Query con cache y mutaciones
- **Stores:** Estado global con Zustand (auth, tema, navegación)
- **Componentes:** Solo lógica de UI y presentación

#### 3.2.2 Cache Invalidation Pattern

**Regla crítica:** Después de TODA mutación (create/update/delete), ejecutar:

```typescript
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: ["marcas"] });
  await queryClient.refetchQueries({ queryKey: ["marcas"] });
};
```

#### 3.2.3 Debounce Pattern

Búsqueda con delay de 500ms para evitar exceso de peticiones al backend y mantener el foco del input.

#### 3.2.4 Controlled Forms

Todos los formularios usan `react-hook-form` con `Controller` + `zodResolver` para validación en tiempo real.

### 3.3 Sistema de Autenticación

**Flujo JWT con HttpOnly cookies:**

1. El usuario ingresa credenciales en `LoginPage` → `auth.service.ts` envía `POST /api/token/`
2. El backend devuelve `access` (JWT corto) en el body y `refresh` en HttpOnly cookie
3. `useAuthStore` guarda el access token **solo en memoria** (no localStorage) para minimizar XSS
4. Al recargar la página, `App.tsx` llama a `silentRefresh()` → `POST /api/token/refresh/` usando la cookie → restaura la sesión sin que el usuario deba re-loguearse
5. `api.ts` incluye el access token en el header `Authorization: Bearer ...` de cada petición
6. El logout llama a `POST /api/token/blacklist/` para invalidar el refresh token en el servidor

**Stores Zustand:**

- `useAuthStore` — access token + datos del usuario (`id`, `username`, `is_staff`, `is_superuser`, `groups`, `permissions[]`). Sin persist (solo memoria).
- `useThemeStore` — tema activo (`light` | `dark` | `auto`). Con persist en localStorage (clave `opticar-theme`).
- `useNavStore` — estado de navegación interna (ej: `pendingCompraId` para redirigir a /compras).

### 3.4 Sistema de Permisos

**Permisos granulares de Django en el frontend:**

- El backend incluye en el token (o en `/api/me/`) la lista de permisos en formato `"app_label.codename"`
- `usePermiso.ts` expone `tienePermiso(perm)` que verifica el array del usuario
- Los superusuarios tienen acceso a todo (`is_superuser = true` cortocircuita la verificación)
- `ProtectedRoute` redirige a `/` si el usuario no tiene el permiso requerido
- `SideNav` filtra automáticamente los ítems del menú según los permisos del usuario autenticado
- Rutas con `requiresStaff`: solo accesibles si `is_staff = true` (Usuarios, Grupos)

### 3.5 Sistema de Temas (Dark Mode)

- Tres modos: **Claro**, **Oscuro**, **Auto** (sigue preferencia del SO)
- Botón en `Header` cicla `light → dark → auto` con ícono contextual (SunFill / MoonFill / CircleHalf)
- `App.tsx` aplica `data-bs-theme` al elemento `<html>` via `useEffect`
- El modo `auto` usa `window.matchMedia('(prefers-color-scheme: dark)')` y escucha cambios en tiempo real
- Todos los componentes usan variables CSS de Bootstrap (`var(--bs-body-bg)`, `var(--bs-body-color)`, etc.) en lugar de colores hardcodeados
- `SearchableSelect` y `AsyncSearchableSelect` usan estilos dinámicos de react-select basados en CSS variables

### 3.6 Layout y Responsividad

- **Desktop** (≥ md): SideNav fijo a la izquierda (3 columnas) + contenido (9 columnas)
- **Mobile** (< md): SideNav oculto, abre como Offcanvas desde botón hamburguesa en Header
- `Layout.css` define clases `.layout-root`, `.layout-content`, `.layout-row` con media queries
- Scroll habilitado en el contenido principal en ambas resoluciones

### 3.7 Dashboard

**`DashboardHome`** — Vista principal al iniciar sesión:

- **`TurnosHoy`**: Card azul que muestra los turnos del día actual. Consulta `/api/turnos/?start=hoy&end=hoy`. Click en el encabezado navega a `/turnos?date=YYYY-MM-DD&view=timeGridDay`.
- **`VentasCard`**: Card verde de acceso rápido al módulo de Ventas.
- **`ComprasCard`**: Card amarilla de acceso rápido al módulo de Compras.

### 3.8 Componentes Clave

#### 3.8.1 SearchableSelect

**Props:**

- `options`: Array<{ value: number, label: string }>
- `value`: number | null | undefined
- `onChange`: (value: number | null) => void
- `placeholder`, `isInvalid`, `disabled`
- `onManageClick?`: Función para abrir modal de gestión
- `isClearable`: Permite limpiar selección
- `noOptionsMessage`: Mensaje cuando no hay opciones

**Características:**

- Wrapper de `react-select` con estilos Bootstrap adaptados a dark mode
- Botón opcional de gestión (ícono engranaje)
- Estados de foco y error integrados
- Todos los colores via CSS variables (compatible con dark mode)

#### 3.8.2 EntityManagerModal

**Props:**

- `show`, `onHide`: Control de visibilidad
- `title`: Título del modal
- `entityType`: "marca" | "categoria" | "subcategoria"
- `items`: Array de entidades a mostrar
- `categorias?`: Para subcategorías (selector de categoría padre)
- `selectedCategoria?`: Categoría pre-seleccionada
- `onCreate`, `onUpdate`, `onDelete`: Callbacks de CRUD
- `isLoading`: Estado de carga

**Características:**

- Crear: InputGroup con botón "Agregar"
- Editar: Modo inline con Save/Cancel
- Eliminar: Confirmación + manejo de errores de FK
- Lista con scroll (max-height: 400px)
- Badge para categoría en subcategorías

#### 3.8.3 ProductoFormModal

**Estado interno:**

- `showMarcaManager`, `showCategoriaManager`, `showSubCategoriaManager`: Control de modales
- `selectedCategoria`: Watch de categoría para filtrar subcategorías

**Características:**

- 3 `SearchableSelect` con botones de gestión
- Al cambiar categoría, resetea subcategoría
- Inputs numéricos con redondeo a 2 decimales
- Validación en tiempo real con Zod
- Diferencia entre modo crear y editar (título, botones)

#### 3.8.4 ProductList

**Estado:**

- `searchTerm` y `debouncedSearchTerm`: Búsqueda con delay
- `selectedCategoria`, `selectedSubCategoria`: Filtros
- `currentPage`: Paginación
- `selectedProducts`: Array de IDs seleccionados
- `showModal`, `editingProducto`: Control de modal

**Características:**

- Tabla con sticky header y scroll vertical
- Filtros dinámicos que resetean página a 1
- Paginación inteligente con rangos
- Botón "Limpiar" que resetea todos los filtros
- Estados de loading y error
- Edición y eliminación inline
- Modal `AumentoMasivoModal` para aumento de precios en lote desde el frontend

#### 3.8.5 TurnosCalendar

**Características:**

- Basado en FullCalendar con plugins `dayGrid`, `timeGrid`, `interaction`
- Vistas: `timeGridWeek` (default), `timeGridDay`, `dayGridMonth`
- Drag & drop: `eventDrop` y `eventResize` → PATCH a la API
- `dateClick` → abre `TurnoFormModal` con fecha/hora pre-populada
- `eventClick` → abre `TurnoFormModal` en modo edición
- Rango de fechas visible actualizado dinámicamente vía `datesSet` → recarga datos
- Navegación deep-link: acepta `?date=` y `?view=` en la URL (desde `TurnosHoy`)
- `ConfigCalendarioModal` accesible solo para superusuarios

#### 3.8.6 UserList y GroupList

**UserList:**

- ABM completo de usuarios del sistema
- Asignación de grupos y permisos individuales
- Solo visible para `is_staff = true`

**GroupList:**

- ABM de grupos/roles con asignación de permisos
- Solo visible para `is_staff = true`

#### 3.8.7 PaginationBar

- Paginación inteligente reutilizable: muestra `1 ... 3 4 5 ... 11`
- Props: `currentPage`, `totalPages`, `onPageChange`

#### 3.8.8 ListHeader

- Cabecera reutilizable para todas las listas
- Props: `title`, `icon`, `onAdd`, `addLabel`, acciones adicionales

---

## 4. Arquitectura Backend

### 4.1 Estructura Django

```
backend/
├── config/              # Configuración del proyecto
│   ├── settings/        # Settings por entorno (base.py, dev.py, prod.py)
│   ├── urls.py          # URLs raíz (incluye /api/ y cada app)
│   ├── admin.py         # Admin site personalizado
│   └── pagination.py    # Paginación global (PAGE_SIZE=10)
├── authentication/      # App de autenticación
│   ├── views.py         # /api/me/ (datos del usuario autenticado)
│   └── urls.py          # URLs de auth (token/, token/refresh/, token/blacklist/)
├── productos/           # App de productos
│   ├── models.py        # Marca, Categoria, SubCategoria, Producto, UltimoCambioPrecio
│   ├── viewsets.py      # ViewSets DRF
│   ├── serializers.py   # Serializers DRF
│   ├── urls.py          # URLs de API
│   ├── admin.py         # Admin con actions personalizadas
│   └── management/      # Comandos de gestión
│       └── commands/
│           └── generar_productos.py
├── ventas/              # App de ventas
│   ├── models.py        # ObraSocial, Cliente, Venta, DetalleVenta, Consulta, Graduacion
│   ├── viewsets.py      # ViewSets DRF
│   ├── serializers.py   # Serializers DRF
│   ├── urls.py          # URLs de API
│   ├── admin.py         # Admin con inlines y JavaScript
│   └── static/ventas/js/
├── compras/             # App de compras
│   ├── models.py        # Proveedor, Compra, DetalleCompra, Gasto
│   ├── viewsets.py      # ViewSets DRF
│   ├── serializers.py   # Serializers DRF
│   ├── urls.py          # URLs de API
│   ├── admin.py         # Admin con inlines
│   └── static/compras/js/
├── contabilidad/        # App de contabilidad
│   ├── models.py        # MovimientoCaja
│   ├── services.py      # Lógica de reporte de caja
│   └── admin.py         # Admin con filtros personalizados
└── turnos/              # App de turnos
    ├── models.py        # ConfiguracionCalendario, Turno
    ├── viewsets.py      # ViewSets DRF (Turno, ConfiguracionCalendario)
    ├── serializers.py   # Serializers DRF
    ├── views.py         # Vista de PDF (Django view)
    ├── admin.py         # Admin con permisos restringidos
    ├── urls.py          # URLs de API + PDF
    ├── templates/       # Template PDF
    └── static/turnos/   # Assets del admin
```

### 4.2 API REST con DRF

#### 4.2.1 ViewSets Implementados

```python
# productos/viewsets.py
class MarcaViewSet(viewsets.ModelViewSet): ...
class CategoriaViewSet(viewsets.ModelViewSet): ...
class SubCategoriaViewSet(viewsets.ModelViewSet): ...
class ProductoViewSet(viewsets.ModelViewSet):
    # get_serializer_class() retorna ProductoListSerializer en "list"
    # y ProductoSerializer en create/update/retrieve
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["marca", "categoria", "sub_categoria"]
    search_fields = ["codigo", "nombre", "descripcion"]

# ventas/viewsets.py
class ObraSocialViewSet(viewsets.ModelViewSet): ...
class ClienteViewSet(viewsets.ModelViewSet): ...
class VentaViewSet(viewsets.ModelViewSet): ...
class ConsultaViewSet(viewsets.ModelViewSet): ...

# compras/viewsets.py
class ProveedorViewSet(viewsets.ModelViewSet): ...
class CompraViewSet(viewsets.ModelViewSet): ...
class GastoViewSet(viewsets.ModelViewSet): ...

# turnos/viewsets.py
class TurnoViewSet(viewsets.ModelViewSet):
    # Sin paginación (pagination_class = None): devuelve array completo
    # Filtros: start, end, cliente, search
class ConfiguracionCalendarioViewSet(viewsets.ModelViewSet): ...

# contabilidad/viewsets.py (servicios)
# Reporte de caja expuesto via services.py con filtros de fecha
```

#### 4.2.2 URLs de API

```python
# productos/urls.py
router = DefaultRouter()
router.register(r"marcas", viewsets.MarcaViewSet)
router.register(r"categorias", viewsets.CategoriaViewSet)
router.register(r"subcategorias", viewsets.SubCategoriaViewSet)
router.register(r"productos", viewsets.ProductoViewSet)

urlpatterns = router.urls
```

**Endpoints generados:**

- `GET /api/marcas/`, `POST /api/marcas/`, `GET/PUT/DELETE /api/marcas/{id}/`
- (Igual para categorias, subcategorias, productos, clientes, obras-sociales, ventas, consultas, proveedores, compras, gastos, turnos)

**Filtros en productos:**

- `GET /api/productos/?search=ray` - Búsqueda por texto
- `GET /api/productos/?marca=1` - Filtrar por marca
- `GET /api/productos/?categoria=2` - Filtrar por categoría
- `GET /api/productos/?sub_categoria=3` - Filtrar por subcategoría
- `GET /api/productos/?page=2` - Paginación

**Endpoints del módulo Turnos (API REST — migrado desde AJAX):**

- `GET /api/turnos/` — Listar turnos (query params: `start`, `end`, `cliente`, `search`). Sin paginación (devuelve array completo)
- `POST /api/turnos/` — Crear turno
- `GET /api/turnos/{id}/` — Detalle de turno
- `PATCH /api/turnos/{id}/` — Actualizar turno (parcial, también para drag & drop)
- `DELETE /api/turnos/{id}/` — Eliminar turno
- `GET /api/config-calendario/` — Obtener configuración activa
- `PATCH /api/config-calendario/{id}/` — Actualizar configuración (solo superusuarios)
- `GET /turnos/api/generar-pdf-turno/{id}/` — Generar PDF del turno (Django view, no DRF)

#### 4.2.3 Serializers

```python
class ProductoSerializer(serializers.ModelSerializer):
    marca_nombre = serializers.CharField(source="marca.nombre", read_only=True)
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    sub_categoria_nombre = serializers.CharField(
        source="sub_categoria.nombre", read_only=True
    )

    class Meta:
        model = Producto
        fields = [
            "id", "codigo", "nombre", "descripcion",
            "marca", "marca_nombre",
            "categoria", "categoria_nombre",
            "sub_categoria", "sub_categoria_nombre",
            "stock", "precio_costo", "precio_venta"
        ]
```

**Ventajas:**

- Campos relacionados denormalizados (`marca_nombre`) evitan consultas adicionales en frontend
- Serializer simplificado para listados (menos datos transferidos)
- Validaciones automáticas de tipo y valores

### 4.3 Admin Personalizado

#### 4.3.1 JavaScript en Admin

**Ejemplo: `productos/js/filtro_subcategorias.js`**

- Filtra subcategorías dinámicamente según la categoría seleccionada
- Usa AJAX para obtener opciones

**Ejemplo: `ventas/js/detalle_venta.js`**

- Calcula total_venta sumando subtotales del inline
- Actualiza campo readonly en tiempo real

#### 4.3.2 Actions Personalizadas

```python
@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    actions = ["aumentar_precios", "revertir_ultimo_cambio"]

    def aumentar_precios(self, request, queryset):
        # 1. Mostrar formulario de porcentaje
        # 2. Aplicar aumento a todos los seleccionados
        # 3. Registrar en UltimoCambioPrecio
        # 4. Mostrar mensaje de confirmación
```

#### 4.3.3 Widgets Personalizados

```python
class DecimalFormatWidget(forms.TextInput):
    def format_value(self, value):
        if value and Decimal(value) > 0:
            return f"+{value}"
        return str(value)
```

---

## 5. Reglas de Negocio Críticas

### 5.1 Stock

1. **Compras incrementan stock:** Al guardar DetalleCompra, `producto.stock += cantidad`
2. **Ventas reducen stock:** Al guardar DetalleVenta, `producto.stock -= cantidad`
3. **Ediciones ajustan stock:** Se calcula diferencia entre valor nuevo y viejo
4. **Eliminaciones NO revierten stock:** Requiere ajuste manual

### 5.2 Precios

1. **Compras actualizan precios:** `producto.precio_costo` y `producto.precio_venta` se actualizan desde DetalleCompra
2. **Ventas pueden tener precio custom:** El precio_venta del DetalleVenta puede diferir del precio_venta del Producto
3. **Precios decimales:** Siempre con 2 decimales, validación en backend y frontend
4. **Aumentos en lote:** Se registran en `UltimoCambioPrecio` para permitir reversión

### 5.3 Relaciones

1. **SET_NULL en referencias:** Si se elimina Marca/Categoría/Proveedor/ObraSocial, los objetos relacionados quedan con `null`
2. **CASCADE en detalles:** Si se elimina Venta/Compra/Consulta, se eliminan sus detalles
3. **Unicidad de DNI:** Cliente.dni debe ser único
4. **Un movimiento de caja por día:** Constraint en BD + validación en clean()

### 5.4 Formateo Automático

1. **TitleCase:** Marca, Categoría, SubCategoria, Producto.nombre, Cliente, Proveedor se formatean en el método `save()`
2. **Graduaciones con signo:** Valores esféricos y cilíndricos se muestran con + o -

### 5.5 Turnos

1. **Validación de fecha:** No se pueden crear turnos en fechas pasadas (solo en `clean()` para nuevos registros)
2. **Cálculo automático:** La hora de fin se calcula según la configuración activa (duración_turno_default)
3. **Conflictos de horario:** El método `clean()` valida que no haya solapamiento de turnos en la misma fecha
4. **Edición restringida:** Solo turnos futuros pueden ser editados (propiedad `puede_editar`)
5. **CASCADE con cliente:** Si se elimina un cliente, se eliminan todos sus turnos
6. **Auditoría:** Usuario creador queda registrado en `created_by` para trazabilidad
7. **Índices optimizados:** `(fecha, hora_inicio)` y `(cliente, fecha)` mejoran performance de búsquedas

---

## 6. Casos de Uso Principales

### 6.1 Registrar Compra

**Actor:** Empleado de óptica

**Flujo (Frontend React):**

1. Ir a la sección "Compras" en el menú lateral
2. Click en "Agregar Compra"
3. Seleccionar proveedor (SearchableSelect) y confirmar fecha
4. En la tabla de detalle de productos:
   - Buscar producto (AsyncSearchableSelect)
   - Ingresar cantidad, precio_unitario y precio_venta
5. El total se calcula automáticamente
6. Al guardar:
   - Stock del producto aumenta
   - precio_costo y precio_venta del producto se actualizan
   - Se calcula el total de la compra

**Resultado:** Producto actualizado con nuevo stock y precios.

### 6.2 Registrar Venta

**Actor:** Empleado de óptica

**Flujo (Frontend React):**

1. Ir a la sección "Ventas" en el menú lateral
2. Click en "Agregar Venta"
3. Buscar y seleccionar cliente (AsyncSearchableSelect por DNI o nombre)
4. Seleccionar forma de pago e ingresar monto entregado
5. En la tabla de detalle, agregar productos con cantidad y precio
6. El total y el saldo se calculan automáticamente
7. Al guardar:
   - Stock del producto disminuye
   - Se registra la venta con saldo calculado

**Resultado:** Venta registrada, stock actualizado, cliente con historial.

### 6.3 Registrar Consulta con Graduación

**Actor:** Oftalmólogo/Optometrista

**Flujo (Frontend React):**

1. Ir a la sección "Consultas" en el menú lateral
2. Click en "Agregar Consulta"
3. Seleccionar cliente, ingresar motivo, diagnóstico y tratamiento
4. Completar la graduación (OD/OI - Lejos/Cerca: esférico, cilíndrico, eje)
5. Guardar

**Resultado:** Historial clínico actualizado con graduación.

### 6.4 Iniciar Sesión

**Actor:** Cualquier usuario del sistema

**Flujo:**

1. Al acceder a la aplicación, si no hay sesión activa se muestra `LoginPage`
2. Ingresar usuario y contraseña → `POST /api/token/`
3. El backend devuelve access token (en body) y refresh token (HttpOnly cookie)
4. La aplicación guarda el access token en memoria y renderiza el layout principal
5. Al recargar la página, `silentRefresh` restaura la sesión automáticamente

**Resultado:** Usuario autenticado con acceso solo a las secciones permitidas por sus permisos.

### 6.5 Buscar y Filtrar Productos

**Actor:** Empleado de óptica (Frontend React)

**Flujo:**

1. Ir a sección "Productos"
2. Opciones de búsqueda:
   - Escribir en barra de búsqueda (código, nombre o descripción)
   - Seleccionar marca del dropdown
   - Seleccionar categoría del dropdown
   - Si hay categoría seleccionada, seleccionar subcategoría
3. Resultados se filtran en tiempo real
4. Click en "Limpiar" para resetear todos los filtros

**Resultado:** Listado filtrado de productos.

### 6.6 Crear Producto con Entidades Nuevas

**Actor:** Empleado de óptica (Frontend React)

**Flujo:**

1. Click en "Agregar Producto"
2. Si la marca no existe:
   - Click en botón de engranaje del select de Marca
   - En el modal, ingresar nombre de marca y click en "Agregar"
   - La marca se crea y se selecciona automáticamente
3. Repetir para Categoría y Subcategoría si es necesario
4. Completar resto de datos del producto
5. Click en "Crear"

**Resultado:** Producto creado con nuevas entidades relacionadas.

### 6.7 Aumentar Precios en Lote

**Actor:** Administrador

**Flujo:**

1. Admin → Productos → Seleccionar productos (checkbox)
2. Acción: "Aumentar precios de costo"
3. Ingresar porcentaje (ej: 10)
4. Confirmar
5. El sistema:
   - Aumenta precio_costo de cada producto seleccionado
   - Registra cambio en UltimoCambioPrecio con lote_id único
6. Mensaje de confirmación: "X productos actualizados"

**Resultado:** Precios actualizados con posibilidad de revertir.

### 6.8 Revertir Último Aumento

**Actor:** Administrador

**Flujo:**

1. Admin → Productos → Seleccionar productos del mismo lote
2. Acción: "Revertir último cambio de precio"
3. Confirmar
4. El sistema:
   - Verifica que todos sean del mismo lote
   - Restaura precio_anterior de cada uno
   - Actualiza UltimoCambioPrecio con tipo "reversion"
5. Mensaje: "X productos revertidos"

**Resultado:** Precios restaurados a valores anteriores.

### 6.9 Agendar Turno

**Actor:** Recepcionista/Personal administrativo

**Flujo:**

1. Ir a la sección "Turnos" (vista de calendario)
2. Navegar al mes/día deseado usando flechas de navegación
3. Click en "Nuevo Turno" o en un día del calendario
4. En el modal de creación:
   - Buscar cliente escribiendo nombre, DNI o teléfono (búsqueda AJAX)
   - Seleccionar cliente de los resultados
   - Elegir fecha del turno (datepicker)
   - Elegir hora de inicio (select con intervalos de 15min)
   - Opcionalmente ingresar motivo de la consulta
5. El sistema:
   - Valida que no sea una fecha pasada
   - Valida que no haya conflicto de horario con otro turno
   - Calcula automáticamente la hora de fin según duración configurada
6. Click en "Guardar"
7. El turno aparece en el calendario

**Resultado:** Turno agendado, visible en el calendario, cliente notificado visualmente.

### 6.10 Ver Turnos del Día

**Actor:** Personal del consultorio

**Flujo:**

1. Ir a la vista de calendario de turnos
2. Click en un día específico del calendario
3. El sistema muestra una lista lateral o modal con:
   - Todos los turnos de ese día
   - Hora de inicio y fin
   - Nombre del cliente
   - Motivo de la consulta (primeros 30 caracteres)
4. Opciones disponibles:
   - Ver detalle completo del turno
   - Editar turno (solo si es futuro)
   - Eliminar turno (con confirmación)
   - Generar PDF del turno

**Resultado:** Visualización clara de la agenda del día.

### 6.11 Editar o Cancelar Turno

**Actor:** Recepcionista

**Flujo:**

1. Desde el calendario, localizar el turno a modificar
2. Click en el turno → "Editar"
3. El sistema valida que sea un turno futuro (propiedad `puede_editar`)
4. Si es editable:
   - Modificar fecha, hora, motivo u observaciones
   - Click en "Actualizar"
   - El sistema revalida conflictos de horario
5. Si es cancelación:
   - Click en "Eliminar"
   - Confirmar la acción
   - El turno desaparece del calendario
6. Si es turno pasado:
   - Mensaje: "No se pueden editar turnos pasados"

**Resultado:** Turno modificado o cancelado según necesidad.

---

## 7. Consideraciones Técnicas

### 7.1 Performance

- **Select relacionados optimizados:** `select_related()` en QuerySets de API para evitar N+1
- **Paginación:** 10 items por página en API y frontend
- **Búsquedas indexadas:** Índices en campos de búsqueda frecuente (lote_id, fecha)
- **Cache de React Query:** Reduce llamadas a la API, staleTime configurable

### 7.2 Seguridad

- **JWT con HttpOnly cookies:** El refresh token jamás es accesible desde JavaScript
- **Access token en memoria:** No se persiste en localStorage para minimizar superficie de ataque XSS
- **Token blacklist:** Al hacer logout, el refresh token se invalida en el servidor (SimpleJWT blacklist)
- **CSRF protection:** Django CSRF tokens en admin
- **CORS configurado:** `django-cors-headers` con whitelist
- **Validación en ambos lados:** Frontend (Zod) y Backend (Django Forms/Serializers/DRF)
- **Rutas protegidas:** `ProtectedRoute` verifica permisos antes de renderizar cada vista
- **Auditoría:** Usuario y fecha de creación en MovimientoCaja y Turnos

### 7.3 Escalabilidad

- **Arquitectura API REST:** Permite múltiples clientes (web, mobile)
- **Base de datos relacional:** SQLite para desarrollo, PostgreSQL para producción
- **Código modular:** Apps Django independientes, componentes React reutilizables

### 7.4 Mantenibilidad

- **Separación de responsabilidades:** Services, Hooks, Components, ViewSets, Serializers
- **TypeScript:** Tipado fuerte en frontend reduce errores en tiempo de ejecución
- **Convenciones de código:** TitleCase automático, decimal con 2 cifras
- **Documentación en código:** Docstrings en Python, JSDoc en TypeScript

---

## 8. Testing (Futuro)

### 8.1 Backend

- Tests unitarios de modelos (save, clean, métodos)
- Tests de ViewSets (CRUD, filtros, paginación)
- Tests de Serializers (validaciones)
- Tests de Admin Actions

### 8.2 Frontend

- Tests de componentes con React Testing Library
- Tests de hooks con React Query Testing
- Tests de servicios con mock de axios
- Tests E2E con Playwright

---

## 9. Roadmap Futuro

### 9.1 Fase 1 (Completada)

- ✅ Módulo de Productos con API REST
- ✅ Frontend con búsqueda y filtros avanzados
- ✅ CRUD inline de entidades relacionadas
- ✅ Paginación inteligente
- ✅ Gestión de precios en lote con reversión
- ✅ Módulo de Turnos con calendario interactivo (Django AJAX templates)
- ✅ Validación automática de conflictos horarios
- ✅ Generación de PDF de turnos

### 9.2 Fase 2 (Completada)

- ✅ Autenticación JWT con HttpOnly cookies y silentRefresh
- ✅ Sistema de permisos granulares en frontend (ProtectedRoute, SideNav)
- ✅ ABM de Usuarios y Grupos desde React (solo staff)
- ✅ Perfil de usuario con cambio de datos y contraseña
- ✅ Dark mode (light/dark/auto) con persistencia y CSS variables
- ✅ Layout responsivo con Offcanvas sidebar para mobile
- ✅ Dashboard con TurnosHoy, VentasCard, ComprasCard
- ✅ Migración de Turnos a API REST + FullCalendar (drag & drop, múltiples vistas)
- ✅ Frontend completo de Ventas (clientes, obras sociales, consultas, graduaciones, ventas)
- ✅ Frontend completo de Compras (proveedores, compras, gastos)
- ✅ Reporte de Caja en React
- ✅ BrandList — gestión de marcas como módulo independiente

### 9.3 Fase 3 (Pendiente)

- ⏳ Deploy en Railway (Backend + Frontend en un solo proyecto)
- ⏳ Variables de entorno seguras en producción (SECRET_KEY, DB_PASSWORD desde env)
- ⏳ WhiteNoise para archivos estáticos en producción
- ⏳ PostgreSQL en producción (migrar desde SQLite/MySQL)
- ⏳ Reportes PDF de ventas y compras desde React
- ⏳ Dashboard con métricas y gráficos (ventas del mes, stock bajo, etc.)
- ⏳ Sistema de notificaciones de turnos (SMS/Email)
- ⏳ Integración con facturación electrónica

### 9.4 Fase 4 (Futuro)

- ⏳ App móvil (React Native)
- ⏳ Multi-sucursal
- ⏳ Integración con plataformas de pago
- ⏳ Turnos con recordatorios automáticos

---

## 10. Anexos

### 10.1 Comando de Datos de Prueba

```bash
# Generar 100 productos aleatorios
python manage.py generar_productos --cantidad 100
```

**Genera:**

- 10 marcas (Ray-Ban, Oakley, Prada, Gucci, etc.)
- 3 categorías con subcategorías
- 100 productos con códigos, precios y stock aleatorios

### 10.2 Variables de Entorno

```env
# frontend/.env (desarrollo)
VITE_API_URL=http://127.0.0.1:8000

# frontend/.env.production (producción)
VITE_API_URL=https://tu-backend.up.railway.app

# backend (variables de entorno en el servidor)
DJANGO_SETTINGS_MODULE=config.settings.prod
DJANGO_SECRET_KEY=<clave-segura-generada>
DATABASE_URL=postgres://<usuario>:<pass>@<host>/<db>
ALLOWED_HOSTS=tu-dominio.up.railway.app
CORS_ALLOWED_ORIGINS=https://tu-frontend.up.railway.app
```

### 10.3 Comandos Útiles

```bash
# Backend
cd backend
pip install -r requeriments/dev.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend
cd frontend
npm install
npm run dev  # http://localhost:5173
npm run build  # Producción
npm run preview  # Preview de build

# Generar datos de prueba
python manage.py generar_productos --cantidad 50
```

---

## 11. Glosario

- **CRUD:** Create, Read, Update, Delete
- **DRF:** Django REST Framework
- **ViewSet:** Clase de DRF que combina lógica de múltiples vistas
- **Serializer:** Clase de DRF para convertir modelos a JSON y validar datos
- **React Query:** Librería para gestión de estado servidor con cache
- **Zustand:** Librería de estado global minimalista para React
- **Debounce:** Técnica para retrasar la ejecución de una función hasta que pasen X milisegundos sin eventos
- **TitleCase:** Formato donde cada palabra comienza con mayúscula
- **Inline:** Formulario anidado en el admin de Django
- **TabularInline:** Inline en formato de tabla
- **StackedInline:** Inline en formato apilado (vertical)
- **JWT:** JSON Web Token — estándar para tokens de autenticación
- **HttpOnly cookie:** Cookie inaccesible desde JavaScript, protege el refresh token
- **silentRefresh:** Proceso de renovación del access token sin intervención del usuario
- **FullCalendar:** Librería JavaScript de calendarios con soporte para drag & drop
- **ProtectedRoute:** Componente React que verifica permisos antes de renderizar una vista
- **Conflicto de horario:** Situación donde dos turnos se solapan en fecha y hora
- **xhtml2pdf:** Librería Python para generar archivos PDF desde HTML
- **CSRF:** Cross-Site Request Forgery — protección contra falsificación de solicitudes
- **Dark mode:** Modo de visualización con fondo oscuro (vía `data-bs-theme` de Bootstrap 5.3)

---

**Fin del Documento**

---

## Información de Contacto

- **Proyecto:** Optic-AR
- **Versión:** 1.2
- **Fecha:** 31 de marzo de 2026
