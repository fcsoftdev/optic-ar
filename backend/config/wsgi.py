"""
WSGI config for config project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")

import json

_django_app = get_wsgi_application()


def application(environ, start_response):
    """
    Wrapper WSGI que intercepta /health/ antes de que Django valide ALLOWED_HOSTS.
    Esto permite que el healthcheck de Railway funcione sin importar el Host header.
    """
    path = environ.get("PATH_INFO", "")
    if path == "/health/":
        body = json.dumps({"status": "ok"}).encode()
        start_response(
            "200 OK",
            [
                ("Content-Type", "application/json"),
                ("Content-Length", str(len(body))),
            ],
        )
        return [body]
    return _django_app(environ, start_response)
