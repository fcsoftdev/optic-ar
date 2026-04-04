"""
Django settings for config project - PRODUCTION ENVIRONMENT (Railway)

Requiere las siguientes variables de entorno en Railway:
  SECRET_KEY, ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, DATABASE_URL
"""

import dj_database_url

from .base import *

DEBUG = False

SECRET_KEY = os.environ["SECRET_KEY"]

ALLOWED_HOSTS = [
    h.strip() for h in os.environ.get("ALLOWED_HOSTS", "").split(",") if h.strip()
]
# Railway inyecta automáticamente estos dominios en el entorno
for _var in ("RAILWAY_PUBLIC_DOMAIN", "RAILWAY_PRIVATE_DOMAIN"):
    if _domain := os.environ.get(_var):
        ALLOWED_HOSTS.append(_domain)
# Dominios usados por Railway para healthcheck interno
ALLOWED_HOSTS.append("healthcheck.railway.app")
ALLOWED_HOSTS.append("127.0.0.1")
ALLOWED_HOSTS.append("localhost")

# Base de datos desde DATABASE_URL (Railway la inyecta automáticamente)
DATABASES = {
    "default": dj_database_url.config(
        conn_max_age=600,
        ssl_require=True,
    )
}

# WhiteNoise para servir archivos estáticos
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
# STATICFILES_STORAGE fue eliminado en Django 5.1; se usa STORAGES
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}
STATIC_ROOT = BASE_DIR / "staticfiles"

# CORS desde variable de entorno
CORS_ALLOWED_ORIGINS = [
    o.strip()
    for o in os.environ.get("CORS_ALLOWED_ORIGINS", "").split(",")
    if o.strip()
]
CORS_ALLOW_CREDENTIALS = True

# Seguridad HTTPS
# Railway maneja SSL en su proxy; el contenedor solo recibe HTTP interno
SECURE_SSL_REDIRECT = False
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
