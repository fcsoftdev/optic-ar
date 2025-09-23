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
    if uri.startswith(settings.STATIC_URL):
        path = finders.find(uri.replace(settings.STATIC_URL, ""))
        if path:
            return path
        else:
            if settings.DEBUG:
                print(f"DEBUG: Archivo estático no encontrado: {uri}")
            return uri

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
        data = json.loads(request.body)

        # ahora pasamos STATIC_URL para usar en el HTML
        html = render_to_string(
            "ventas/presupuesto_pdf.html",
            {"data": data, "STATIC_URL": settings.STATIC_URL},
        )

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = 'attachment; filename="presupuesto.pdf"'

        pisa_status = pisa.CreatePDF(
            src=html,
            dest=response,
            link_callback=link_callback,
        )
        if pisa_status.err:
            return HttpResponse("Error al generar PDF", status=500)
        return response
