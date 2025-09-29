import json
import os

from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils.decorators import method_decorator
from django.views import View
from django.views.decorators.csrf import csrf_exempt
from xhtml2pdf import pisa
from django.conf import settings
from django.contrib.staticfiles import finders  # <-- IMPORT


def link_callback(uri, rel):
    """
    Convierte las URI de HTML (como /static/...) a rutas absolutas del sistema
    para que xhtml2pdf pueda acceder a ellas.
    """
    # Si la URI ya es una ruta absoluta de archivo, devuélvela
    if os.path.isfile(uri):
        return uri

    # Manejo de archivos estáticos
    if uri.startswith(settings.STATIC_URL):
        path = finders.find(uri.replace(settings.STATIC_URL, ""))
        if path:
            return path
        else:
            # Intenta buscar en STATIC_ROOT
            static_file = os.path.join(settings.STATIC_ROOT, uri.replace(settings.STATIC_URL, ""))
            if os.path.exists(static_file):
                return static_file
            return uri

    # Manejo de archivos media
    if uri.startswith(settings.MEDIA_URL):
        path = os.path.join(settings.MEDIA_ROOT, uri.replace(settings.MEDIA_URL, ""))
        if os.path.exists(path):
            return path

    return uri


class GenerarPresupuestoPDFView(View):
    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)

            context = {
                "data": data,
                "STATIC_URL": settings.STATIC_URL,
                "STATIC_ROOT": settings.STATIC_ROOT
            }

            html = render_to_string(
                "ventas/presupuesto_pdf.html",
                context,
            )

            response = HttpResponse(content_type="application/pdf")
            response["Content-Disposition"] = 'attachment; filename="presupuesto.pdf"'

            pisa_status = pisa.CreatePDF(
                src=html,
                dest=response,
                link_callback=link_callback
            )

            if pisa_status.err:
                return HttpResponse("Error al generar PDF", status=500)

            return response

        except Exception as e:
            return HttpResponse("Error inesperado al generar PDF", status=500)
