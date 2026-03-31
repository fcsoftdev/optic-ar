"""
Django settings for config project - PRODUCTION ENVIRONMENT (Railway)

Requiere las siguientes variables de entorno en Railway:
  SECRET_KEY, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, DATABASE_URL
"""

import dj_database_url

from .base import *

DEBUG = False

SECRET_KEY = os.environ["SECRET_KEY"]

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "").split(",")

# Base de datos desde DATABASE_URL (Railway la inyecta automáticamente)
DATABASES = {
    "default": dj_database_url.config(
        conn_max_age=600,
        ssl_require=True,
    )
}

# WhiteNoise para servir archivos estáticos
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
STATIC_ROOT = BASE_DIR / "staticfiles"

# CORS desde variable de entorno
CORS_ALLOWED_ORIGINS = os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
CORS_ALLOW_CREDENTIALS = True

# Seguridad HTTPS
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
