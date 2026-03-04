from rest_framework import serializers
from .models import ObraSocial, Cliente


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
