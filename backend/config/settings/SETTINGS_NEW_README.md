# Configuración de Settings

Este proyecto usa una estructura modular de configuración con archivos separados para diferentes entornos.

## Estructura de archivos:

```
config/
├── settings/
│   ├── __init__.py
│   ├── base.py      # Configuración común (INSTALLED_APPS, MIDDLEWARE, etc.)
│   ├── dev.py       # Solo diferencias para desarrollo
│   └── prod.py      # Solo diferencias para producción
├── settings.py          # Archivo original (backup)
├── settings_dev.py      # Archivo anterior (backup)
└── settings_prod.py     # Archivo anterior (backup)
```

## Cómo usar:

### Desarrollo local:

```bash
python manage.py runserver --settings=config.settings.dev
```

### Producción:

```bash
python manage.py runserver --settings=config.settings.prod
```

### Variables de entorno:

También puedes usar variables de entorno para especificar qué configuración usar:

```bash
export DJANGO_SETTINGS_MODULE=config.settings.dev
# o
export DJANGO_SETTINGS_MODULE=config.settings.prod
```

## Ventajas de esta estructura:

### ✅ Sin duplicación de código:

- `INSTALLED_APPS`, `MIDDLEWARE`, `TEMPLATES` están solo en `base.py`
- Cada entorno solo define sus diferencias específicas

### ✅ Fácil mantenimiento:

- Agregar una nueva app: solo modificar `base.py`
- Cambiar configuración común: solo modificar `base.py`
- Configuraciones específicas: solo modificar `dev.py` o `prod.py`

### ✅ Estructura clara:

- `base.py`: Todo lo que comparten los entornos
- `dev.py`: DEBUG=True, base de datos local, etc.
- `prod.py`: DEBUG=False, base de datos de producción, seguridad, etc.

## Diferencias principales:

### Development (settings/dev.py):

- DEBUG = True
- ALLOWED_HOSTS = ['127.0.0.1', 'localhost']
- Base de datos local (MySQL o SQLite)
- Archivos estáticos en ruta relativa

### Production (settings/prod.py):

- DEBUG = False
- ALLOWED_HOSTS = ['puntodevista.pythonanywhere.com']
- Base de datos MySQL de producción
- Configuraciones de seguridad adicionales
- Rutas absolutas para archivos estáticos

## Para PythonAnywhere:

1. Usar `--settings=config.settings.prod`
2. Actualizar el archivo WSGI: `from config.settings import prod as settings`
3. Ejecutar migraciones y collectstatic

## Notas:

- Los archivos antiguos se mantienen como backup
- La configuración común está centralizada en `base.py`
- Cada entorno importa la base y solo define sus diferencias
