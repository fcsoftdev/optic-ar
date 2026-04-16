from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from auditoria.services import (
    capturar_estado_producto,
    diff_producto,
    registrar,
    snapshot_producto,
)

from .models import Marca, Categoria, SubCategoria, Producto
from .serializers import (
    MarcaSerializer,
    CategoriaSerializer,
    SubCategoriaSerializer,
    ProductoSerializer,
    ProductoListSerializer,
)


class MarcaViewSet(viewsets.ModelViewSet):
    queryset = Marca.objects.all()
    serializer_class = MarcaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]
    ordering = ["nombre"]


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["nombre"]
    ordering_fields = ["nombre"]
    ordering = ["nombre"]


class SubCategoriaViewSet(viewsets.ModelViewSet):
    queryset = SubCategoria.objects.select_related("categoria").all()
    serializer_class = SubCategoriaSerializer
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["categoria"]
    search_fields = ["nombre", "categoria__nombre"]
    ordering_fields = ["nombre", "categoria__nombre"]
    ordering = ["categoria__nombre", "nombre"]


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar Productos.

    Registra un RegistroAuditoria por cada operación crear/editar/eliminar,
    incluyendo el aumento masivo de precios.
    """

    queryset = Producto.objects.select_related(
        "marca", "categoria", "sub_categoria"
    ).all()
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["marca", "categoria", "sub_categoria"]
    search_fields = ["codigo", "nombre", "descripcion"]
    ordering_fields = ["codigo", "nombre", "precio_venta", "stock"]
    ordering = ["codigo"]

    def get_serializer_class(self):
        if self.action == "list":
            return ProductoListSerializer
        return ProductoSerializer

    def create(self, request, *args, **kwargs):
        """Crea un Producto y registra el evento de auditoría."""
        response = super().create(request, *args, **kwargs)
        instance = Producto.objects.select_related(
            "marca", "categoria", "sub_categoria"
        ).get(pk=response.data["id"])
        registrar(request.user, "crear", "producto", instance.id, snapshot_producto(instance))
        return response

    def update(self, request, *args, **kwargs):
        """Actualiza un Producto y registra el diff en auditoría."""
        instance = self.get_object()
        estado_antes = capturar_estado_producto(instance)
        response = super().update(request, *args, **kwargs)
        instance.refresh_from_db()
        detalle = diff_producto(estado_antes, instance)
        registrar(request.user, "editar", "producto", instance.id, detalle)
        return response

    def destroy(self, request, *args, **kwargs):
        """Elimina un Producto y registra el snapshot en auditoría."""
        instance = self.get_object()
        detalle = snapshot_producto(instance)
        objeto_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        registrar(request.user, "eliminar", "producto", objeto_id, detalle)
        return response

    @action(detail=False, methods=["post"], url_path="aumento_masivo")
    def aumento_masivo(self, request):
        """
        Aplica un porcentaje de aumento al precio_costo de los productos indicados.

        Body: { "ids": [1, 2, 3], "porcentaje": 15.5 }

        Registra un RegistroAuditoria de tipo "editar" por cada producto afectado.
        """
        ids = request.data.get("ids", [])
        porcentaje = request.data.get("porcentaje")

        if not ids or porcentaje is None:
            return Response(
                {"detail": "Se requieren 'ids' y 'porcentaje'."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            porcentaje = Decimal(str(porcentaje))
        except Exception:
            return Response(
                {"detail": "'porcentaje' debe ser un número válido."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if porcentaje <= 0:
            return Response(
                {"detail": "El porcentaje debe ser mayor a cero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from compras.models import HistorialCostoProducto

        productos = Producto.objects.select_related(
            "marca", "categoria", "sub_categoria"
        ).filter(id__in=ids)
        actualizados = 0
        hoy = timezone.now().date()

        with transaction.atomic():
            for producto in productos:
                estado_antes = capturar_estado_producto(producto)

                costo_anterior = producto.precio_costo or Decimal("0.00")
                nuevo_costo = (costo_anterior * (1 + porcentaje / 100)).quantize(
                    Decimal("0.01")
                )
                pct_ganancia = producto.porcentaje_ganancia or Decimal("0.00")
                nuevo_precio_venta = (nuevo_costo * (1 + pct_ganancia / 100)).quantize(
                    Decimal("0.01")
                )

                producto.precio_costo = nuevo_costo
                producto.precio_venta = nuevo_precio_venta
                producto.save(update_fields=["precio_costo", "precio_venta"])

                HistorialCostoProducto.objects.create(
                    producto=producto,
                    compra=None,
                    precio_costo=nuevo_costo,
                    precio_compra=nuevo_costo,
                    fecha=hoy,
                )
                historial_ids = list(
                    HistorialCostoProducto.objects.filter(producto=producto)
                    .order_by("-fecha", "-id")
                    .values_list("id", flat=True)
                )
                if len(historial_ids) > 4:
                    HistorialCostoProducto.objects.filter(
                        id__in=historial_ids[4:]
                    ).delete()

                producto.refresh_from_db()
                detalle = diff_producto(estado_antes, producto)
                registrar(request.user, "editar", "producto", producto.id, detalle)

                actualizados += 1

        return Response({"actualizados": actualizados}, status=status.HTTP_200_OK)
