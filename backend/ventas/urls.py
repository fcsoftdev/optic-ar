from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GenerarPresupuestoPDFView
from . import viewsets

# Router para API REST
router = DefaultRouter()
router.register(r"obras-sociales", viewsets.ObraSocialViewSet)
router.register(r"clientes", viewsets.ClienteViewSet)
router.register(r"consultas", viewsets.ConsultaViewSet)
router.register(r"ventas", viewsets.VentaViewSet)

urlpatterns = [
    # API REST endpoints
    path("api/", include(router.urls)),
    # Vista legacy
    path(
        "generar-presupuesto-pdf/",
        GenerarPresupuestoPDFView.as_view(),
        name="generar_presupuesto_pdf",
    ),
]
