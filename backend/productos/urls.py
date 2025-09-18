from django.urls import path
from . import views

urlpatterns = [
    path("get_subcategorias/", views.get_subcategorias, name="get_subcategorias"),
]
