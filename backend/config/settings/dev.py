"""
Django settings for config project - DEVELOPMENT ENVIRONMENT

This file contains settings specific to the development environment.
It imports from base.py and overrides settings as needed.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Hosts permitidos en desarrollo
ALLOWED_HOSTS = ["localhost", "127.0.0.1", "0.0.0.0"]

# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
        # "ENGINE": "django.db.backends.mysql",
        # "NAME": BASE_DIR / "db.sqlite3",
        # "NAME": "opticardb",
        # "USER": "opticaruser",
        # "PASSWORD": "Opticar#889",
        # "HOST": "localhost",
        # "PORT": "3306",
    }
}

# Configuración de archivos estáticos para desarrollo
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# Media files (uploads) - desarrollo
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Email backend para desarrollo (console)
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Logging para desarrollo
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

# Django Debug Toolbar (opcional - puedes instalarlo con pip install django-debug-toolbar)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
# INTERNAL_IPS = ['127.0.0.1']
