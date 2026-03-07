from rest_framework import serializers
from django.core.exceptions import ObjectDoesNotExist
from .models import ObraSocial, Cliente, Consulta, Graduacion


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
            "nombre_apellido",
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
            "nombre_apellido",
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
