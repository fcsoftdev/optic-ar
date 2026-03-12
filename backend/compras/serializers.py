from decimal import Decimal

from rest_framework import serializers

from productos.models import Producto

from .models import Compra, DetalleCompra, Gasto, Proveedor


class ProveedorSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Proveedor."""

    class Meta:
        model = Proveedor
        fields = ["id", "nombre", "direccion", "telefono", "alias"]
        extra_kwargs = {
            "direccion": {"required": False, "allow_blank": True, "default": ""},
            "telefono": {"required": False, "allow_blank": True, "default": ""},
            "alias": {"required": False, "allow_blank": True, "default": ""},
        }


class DetalleCompraReadSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para los ítems de una compra.

    Incluye el nombre del producto desnormalizado para evitar
    consultas adicionales en el frontend.
    """

    producto_nombre = serializers.CharField(
        source="producto.nombre", read_only=True, default=""
    )

    class Meta:
        model = DetalleCompra
        fields = [
            "id",
            "producto",
            "producto_nombre",
            "cantidad",
            "precio_unitario",
            "precio_venta",
            "subtotal",
        ]
        read_only_fields = ["id", "subtotal"]


class DetalleCompraWriteSerializer(serializers.Serializer):
    """
    Serializer de escritura para los ítems de una compra.

    Se usa dentro de CompraSerializer para crear o actualizar detalles
    de manera anidada. El campo ``id`` es opcional para identificar
    ítems existentes al editar.
    """

    id = serializers.IntegerField(required=False, allow_null=True)
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)
    precio_unitario = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("0.01")
    )
    precio_venta = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("0.01")
    )


class CompraListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para el listado de compras.

    Expone solo los campos necesarios para la tabla ABM,
    incluyendo el nombre del proveedor desnormalizado y
    la cantidad de ítems.
    """

    proveedor_nombre = serializers.CharField(
        source="proveedor.nombre", read_only=True, default=""
    )
    cantidad_items = serializers.SerializerMethodField()

    class Meta:
        model = Compra
        fields = [
            "id",
            "fecha",
            "proveedor",
            "proveedor_nombre",
            "cantidad_items",
            "total",
        ]

    def get_cantidad_items(self, obj: Compra) -> int:
        """
        Retorna la cantidad de ítems de la compra.

        Args:
            obj (Compra): Instancia de la compra.

        Returns:
            int: Número de ítems.
        """
        return obj.detalles_productos.count()


class CompraSerializer(serializers.ModelSerializer):
    """
    Serializer completo para crear, ver y actualizar compras con ítems anidados.

    Al crear o actualizar, gestiona el stock y precios de los productos
    involucrados a través del método ``save()`` de ``DetalleCompra``.
    Al eliminar un ítem durante una edición, revierte manualmente el stock.
    La eliminación completa de una Compra es manejada por la señal
    ``descontar_stock_al_eliminar_compra``.
    """

    proveedor_nombre = serializers.CharField(
        source="proveedor.nombre", read_only=True, default=""
    )
    detalles_productos = DetalleCompraReadSerializer(many=True, read_only=True)
    detalles = DetalleCompraWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Compra
        fields = [
            "id",
            "fecha",
            "proveedor",
            "proveedor_nombre",
            "total",
            "detalles_productos",
            "detalles",
        ]
        read_only_fields = ["id", "total"]

    def create(self, validated_data: dict) -> Compra:
        """
        Crea una compra y sus detalles anidados en una sola operación.

        Recalcula el total tras guardar todos los ítems. El stock y los
        precios de cada producto se actualizan mediante DetalleCompra.save().

        Args:
            validated_data (dict): Datos validados incluyendo 'detalles'.

        Returns:
            Compra: Instancia creada de la compra.
        """
        detalles_data = validated_data.pop("detalles")
        compra = Compra.objects.create(**validated_data)
        for detalle_data in detalles_data:
            detalle_data.pop("id", None)
            DetalleCompra.objects.create(compra=compra, **detalle_data)
        compra.total = sum(d.subtotal for d in compra.detalles_productos.all())
        compra.save(update_fields=["total"])
        return compra

    def update(self, instance: Compra, validated_data: dict) -> Compra:
        """
        Actualiza una compra y sus detalles anidados.

        Para los ítems eliminados revierte el stock del producto.
        Para los ítems modificados o nuevos, DetalleCompra.save()
        ajusta el stock según la diferencia de cantidades.

        Args:
            instance (Compra): Instancia existente a actualizar.
            validated_data (dict): Datos validados con los cambios.

        Returns:
            Compra: Instancia actualizada de la compra.
        """
        detalles_data = validated_data.pop("detalles", [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        incoming_ids = {d["id"] for d in detalles_data if d.get("id")}

        # Eliminar detalles removidos y revertir su stock
        for detalle in instance.detalles_productos.all():
            if detalle.id not in incoming_ids:
                if detalle.producto:
                    detalle.producto.stock -= detalle.cantidad
                    if detalle.producto.stock < 0:
                        detalle.producto.stock = 0
                    detalle.producto.save()
                detalle.delete()

        # Crear o actualizar detalles recibidos
        for detalle_data in detalles_data:
            det_id = detalle_data.pop("id", None)
            if det_id:
                try:
                    detalle = DetalleCompra.objects.get(pk=det_id)
                    # Si cambia el producto, revertir stock del producto anterior
                    old_producto = detalle.producto
                    new_producto = detalle_data.get("producto", old_producto)
                    if old_producto and new_producto != old_producto:
                        old_producto.stock -= detalle.cantidad
                        if old_producto.stock < 0:
                            old_producto.stock = 0
                        old_producto.save()
                    for attr, value in detalle_data.items():
                        setattr(detalle, attr, value)
                    detalle.save()
                except DetalleCompra.DoesNotExist:
                    DetalleCompra.objects.create(compra=instance, **detalle_data)
            else:
                DetalleCompra.objects.create(compra=instance, **detalle_data)

        # Recalcular total
        instance.refresh_from_db()
        instance.total = sum(d.subtotal for d in instance.detalles_productos.all())
        instance.save(update_fields=["total"])
        return instance


class GastoSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Gasto."""

    class Meta:
        model = Gasto
        fields = ["id", "fecha", "descripcion", "total"]
