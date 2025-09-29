from django.urls import path
from .views import GenerarPresupuestoPDFView

urlpatterns = [
    path(
        "generar-presupuesto-pdf/",
        GenerarPresupuestoPDFView.as_view(),
        name="generar_presupuesto_pdf",
    ),
]
