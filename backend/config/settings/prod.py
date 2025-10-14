"""
Django settings for config project - PRODUCTION ENVIRONMENT

This file contains only the settings that are specific to the production environment.
It imports all common settings from base.py and overrides only what's necessary.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ["puntodevista.pythonanywhere.com"]


# Database for production
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": "puntodevista$default",
        "USER": "puntodevista",
        "PASSWORD": "Opticar.889",
        "HOST": "puntodevista.mysql.pythonanywhere-services.com",
        "PORT": "3306",
        "OPTIONS": {
            "init_command": "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# Static files configuration for production
STATIC_ROOT = "/home/puntodevista/optic-ar/backend/staticfiles"

# Media files configuration for production
MEDIA_ROOT = "/home/puntodevista/optic-ar/backend/media"

# Security settings for production
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"

# Additional security settings (uncomment as needed)
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_HSTS_SECONDS = 31536000  # 1 year
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True
