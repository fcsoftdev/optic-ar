"""URL configuration for the contabilidad app."""

from django.urls import path

from .views import ReporteCajaAPIView

urlpatterns = [
    path("reporte-caja/", ReporteCajaAPIView.as_view(), name="reporte_caja"),
]
