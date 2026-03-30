from rest_framework import serializers
from decimal import Decimal
from django.core.exceptions import ObjectDoesNotExist
from .models import ObraSocial, Cliente, Consulta, Graduacion, Venta, DetalleVenta
from productos.models import Producto


class ObraSocialSerializer(serializers.ModelSerializer):
    """
    Serializer completo para el modelo ObraSocial.

    Expone todos los campos del modelo para operaciones CRUD.
    """

    class Meta:
        model = ObraSocial
        fields = ["id", "nombre", "direccion", "telefono"]


class ClienteSerializer(serializers.ModelSerializer):
    """
    Serializer completo para el modelo Cliente.

    Incluye el campo desnormalizado `obra_social_nombre` de solo lectura
    para evitar consultas adicionales en el frontend.
    """

    obra_social_nombre = serializers.CharField(
        source="obra_social.nombre", read_only=True
    )

    class Meta:
        model = Cliente
        fields = [
            "id",
            "apellido",
            "nombre",
            "dni",
            "fecha_nacimiento",
            "telefono",
            "mail",
            "direccion",
            "nro_afiliado",
            "obra_social",
            "obra_social_nombre",
        ]
        read_only_fields = ["id"]

    def validate_dni(self, value: str) -> str:
        """
        Valida que el DNI tenga exactamente 8 dígitos numéricos.

        Args:
            value (str): Valor del DNI a validar.

        Returns:
            str: El DNI validado sin modificaciones.

        Raises:
            serializers.ValidationError: Si contiene letras o no tiene 8 dígitos.
        """
        if not value.isdigit():
            raise serializers.ValidationError("El DNI debe contener solo números.")
        if len(value) != 8:
            raise serializers.ValidationError("El DNI debe tener 8 dígitos.")
        return value

    def validate_mail(self, value: str) -> str:
        """
        Valida el formato del email si se proporciona.

        Args:
            value (str): Dirección de email a validar.

        Returns:
            str: El email validado sin modificaciones.

        Raises:
            serializers.ValidationError: Si el email no contiene '@'.
        """
        if value and "@" not in value:
            raise serializers.ValidationError("El email no tiene un formato válido.")
        return value


class ClienteListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de clientes.

    Expone solo los campos necesarios para la vista de tabla,
    reduciendo el tamaño del payload de la API en consultas paginadas.
    """

    obra_social_nombre = serializers.CharField(
        source="obra_social.nombre", read_only=True
    )

    class Meta:
        model = Cliente
        fields = [
            "id",
            "apellido",
            "nombre",
            "dni",
            "telefono",
            "obra_social_nombre",
            "fecha_nacimiento",
        ]


class GraduacionSerializer(serializers.ModelSerializer):
    """
    Serializer para el modelo Graduacion.

    Expone todos los campos de graduación óptica (OD/OI × Lejos/Cerca)
    con esférico, cilíndrico y eje para cada combinación.
    """

    class Meta:
        model = Graduacion
        fields = [
            "id",
            "od_lejos_esferico",
            "od_lejos_cilindrico",
            "od_lejos_eje",
            "oi_lejos_esferico",
            "oi_lejos_cilindrico",
            "oi_lejos_eje",
            "od_cerca_esferico",
            "od_cerca_cilindrico",
            "od_cerca_eje",
            "oi_cerca_esferico",
            "oi_cerca_cilindrico",
            "oi_cerca_eje",
        ]


class ConsultaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para el modelo Consulta.

    Incluye la graduación anidada (opcional) y el nombre del cliente
    desnormalizado para evitar consultas adicionales en el frontend.
    """

    graduacion = GraduacionSerializer(required=False, allow_null=True)
    cliente_nombre = serializers.CharField(
        source="cliente.nombre_apellido", read_only=True
    )

    class Meta:
        model = Consulta
        fields = [
            "id",
            "cliente",
            "cliente_nombre",
            "fecha",
            "motivo",
            "diagnostico",
            "tratamiento",
            "graduacion",
        ]
        read_only_fields = ["id", "cliente_nombre"]

    def create(self, validated_data: dict) -> Consulta:
        """
        Crea una consulta y su graduación anidada en una sola operación.

        Args:
            validated_data (dict): Datos validados incluyendo 'graduacion' opcional.

        Returns:
            Consulta: Instancia creada de la consulta.
        """
        graduacion_data = validated_data.pop("graduacion", None)
        consulta = Consulta.objects.create(**validated_data)
        if graduacion_data:
            Graduacion.objects.create(consulta=consulta, **graduacion_data)
        return consulta

    def update(self, instance: Consulta, validated_data: dict) -> Consulta:
        """
        Actualiza una consulta y crea, actualiza o elimina su graduación.

        Args:
            instance (Consulta): Instancia existente a actualizar.
            validated_data (dict): Datos validados con cambios.

        Returns:
            Consulta: Instancia actualizada de la consulta.
        """
        graduacion_data = validated_data.pop("graduacion", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if graduacion_data is not None:
            if hasattr(instance, "graduacion"):
                grad = instance.graduacion
                for attr, value in graduacion_data.items():
                    setattr(grad, attr, value)
                grad.save()
            else:
                Graduacion.objects.create(consulta=instance, **graduacion_data)

        return instance


class ConsultaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listados de consultas.

    Expone solo los campos necesarios para la vista de tabla,
    incluye el nombre del cliente, un indicador de si tiene graduación
    y los datos de graduación anidados (si existen).
    """

    cliente_nombre = serializers.CharField(
        source="cliente.nombre_apellido", read_only=True
    )
    tiene_graduacion = serializers.SerializerMethodField()
    graduacion = GraduacionSerializer(read_only=True)

    class Meta:
        model = Consulta
        fields = [
            "id",
            "cliente",
            "cliente_nombre",
            "fecha",
            "motivo",
            "diagnostico",
            "tiene_graduacion",
            "graduacion",
        ]

    def get_tiene_graduacion(self, obj: Consulta) -> bool:
        """
        Indica si la consulta tiene una graduación asociada.

        Args:
            obj (Consulta): Instancia de la consulta a verificar.

        Returns:
            bool: True si existe una graduación, False en caso contrario.
        """
        try:
            return obj.graduacion is not None
        except ObjectDoesNotExist:
            return False


# ============================================================
# SERIALIZERS DE VENTAS
# ============================================================


class DetalleVentaReadSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para los ítems de una venta.

    Incluye el nombre del producto desnormalizado para evitar
    consultas adicionales en el frontend.
    """

    producto_nombre = serializers.CharField(
        source="producto.nombre", read_only=True, default=""
    )

    class Meta:
        model = DetalleVenta
        fields = [
            "id",
            "producto",
            "producto_nombre",
            "cantidad",
            "precio_venta",
            "subtotal_item",
        ]
        read_only_fields = ["id", "subtotal_item"]


class DetalleVentaWriteSerializer(serializers.Serializer):
    """
    Serializer de escritura para los ítems de una venta.

    Se usa dentro de VentaSerializer para crear o actualizar
    detalles de manera anidada. El campo ``id`` es opcional y
    se usa para identificar ítems existentes al editar.
    """

    id = serializers.IntegerField(required=False, allow_null=True)
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())
    cantidad = serializers.IntegerField(min_value=1)
    precio_venta = serializers.DecimalField(
        max_digits=10, decimal_places=2, min_value=Decimal("0.01")
    )


class VentaListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para el listado de ventas.

    Expone únicamente los campos necesarios para la tabla ABM.
    """

    cliente_nombre = serializers.CharField(
        source="cliente.nombre_apellido", read_only=True
    )
    cliente_dni = serializers.CharField(source="cliente.dni", read_only=True)
    forma_pago_display = serializers.CharField(
        source="get_forma_pago_display", read_only=True
    )

    class Meta:
        model = Venta
        fields = [
            "id",
            "fecha",
            "cliente",
            "cliente_nombre",
            "cliente_dni",
            "forma_pago",
            "forma_pago_display",
            "entrego",
            "total_venta",
            "saldo",
        ]


class VentaSerializer(serializers.ModelSerializer):
    """
    Serializer completo para crear, ver y actualizar ventas.

    Incluye los ítems de detalle de manera anidada. Al crear o actualizar,
    recalcula ``total_venta`` y ``saldo`` a partir de los subtotales de
    cada detalle. El stock de los productos se gestiona automáticamente
    mediante el método ``save()`` del modelo ``DetalleVenta``.

    Nota sobre eliminación:
        Al eliminar una Venta, la señal ``devolver_stock_al_eliminar_venta``
        restaura el stock de todos los productos involucrados.
    """

    cliente_nombre = serializers.CharField(
        source="cliente.nombre_apellido", read_only=True
    )
    cliente_dni = serializers.CharField(source="cliente.dni", read_only=True)
    forma_pago_display = serializers.CharField(
        source="get_forma_pago_display", read_only=True
    )
    detalles_ventas = DetalleVentaReadSerializer(many=True, read_only=True)
    detalles = DetalleVentaWriteSerializer(many=True, write_only=True)

    class Meta:
        model = Venta
        fields = [
            "id",
            "fecha",
            "cliente",
            "cliente_nombre",
            "cliente_dni",
            "forma_pago",
            "forma_pago_display",
            "entrego",
            "total_venta",
            "saldo",
            "detalles_ventas",
            "detalles",
        ]
        read_only_fields = ["id", "total_venta", "saldo"]

    def _calcular_totales(self, venta: Venta) -> None:
        """
        Recalcula y persiste ``total_venta`` y ``saldo`` de una venta.

        Args:
            venta (Venta): Instancia de Venta cuyos totales se actualizarán.
        """
        total = sum(d.subtotal_item for d in venta.detalles_ventas.all())
        venta.total_venta = total
        venta.saldo = venta.entrego - total
        venta.save(update_fields=["total_venta", "saldo"])

    def create(self, validated_data: dict) -> Venta:
        """
        Crea una venta con sus ítems de detalle en una sola operación.

        El método ``save()`` de ``DetalleVenta`` reduce el stock del
        producto automáticamente al crear cada ítem.

        Args:
            validated_data (dict): Datos validados incluyendo la lista ``detalles``.

        Returns:
            Venta: Instancia creada con totales calculados.
        """
        detalles_data = validated_data.pop("detalles")
        venta = Venta.objects.create(**validated_data)
        for d in detalles_data:
            DetalleVenta.objects.create(
                venta=venta,
                producto=d["producto"],
                cantidad=d["cantidad"],
                precio_venta=d["precio_venta"],
            )
        self._calcular_totales(venta)
        return venta

    def update(self, instance: Venta, validated_data: dict) -> Venta:
        """
        Actualiza una venta y sincroniza sus ítems de detalle.

        - Ítems existentes (tienen ``id``): se actualizan cantidad y precio.
          El modelo ``DetalleVenta.save()`` ajusta el stock por diferencia.
        - Ítems nuevos (sin ``id``): se crean y el stock se reduce.
        - Ítems eliminados (no presentes en la nueva lista): se borran y
          el stock del producto se restaura manualmente.

        Args:
            instance (Venta): Instancia existente a actualizar.
            validated_data (dict): Datos nuevos incluyendo la lista ``detalles``.

        Returns:
            Venta: Instancia actualizada con totales recalculados.
        """
        detalles_data = validated_data.pop("detalles")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        incoming_ids = {d["id"] for d in detalles_data if d.get("id")}

        # Eliminar ítems que ya no están en la nueva lista y devolver stock
        for detalle in instance.detalles_ventas.all():
            if detalle.id not in incoming_ids:
                if detalle.producto:
                    detalle.producto.stock += detalle.cantidad
                    detalle.producto.save()
                detalle.delete()

        # Crear o actualizar los ítems enviados
        for d in detalles_data:
            detalle_id = d.get("id")
            if detalle_id:
                try:
                    detalle = DetalleVenta.objects.get(id=detalle_id, venta=instance)
                    detalle.producto = d["producto"]
                    detalle.cantidad = d["cantidad"]
                    detalle.precio_venta = d["precio_venta"]
                    detalle.save()
                except DetalleVenta.DoesNotExist:
                    DetalleVenta.objects.create(
                        venta=instance,
                        producto=d["producto"],
                        cantidad=d["cantidad"],
                        precio_venta=d["precio_venta"],
                    )
            else:
                DetalleVenta.objects.create(
                    venta=instance,
                    producto=d["producto"],
                    cantidad=d["cantidad"],
                    precio_venta=d["precio_venta"],
                )

        self._calcular_totales(instance)
        return instance
