"""
Serializers para la API REST de Turnos.
"""

from datetime import datetime, timedelta

from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError as DRFValidationError

from .models import ConfiguracionCalendario, Turno


class ConfiguracionCalendarioSerializer(serializers.ModelSerializer):
    """
    Serializer para la configuración del calendario de turnos.

    Expone los campos editables: horarios, duración y días laborables.
    """

    class Meta:
        model = ConfiguracionCalendario
        fields = [
            "id",
            "nombre",
            "hora_apertura",
            "hora_cierre",
            "duracion_turno_default",
            "dias_laborables",
            "activa",
        ]


class TurnoSerializer(serializers.ModelSerializer):
    """
    Serializer completo para el modelo Turno.

    Calcula ``hora_fin`` automáticamente a partir de ``hora_inicio``
    y la configuración activa del calendario si no es provista.
    Expone el nombre del cliente desnormalizado para el frontend.
    """

    cliente_nombre = serializers.CharField(
        source="cliente.nombre_apellido", read_only=True, default=""
    )

    class Meta:
        model = Turno
        fields = [
            "id",
            "fecha",
            "hora_inicio",
            "hora_fin",
            "cliente",
            "cliente_nombre",
            "motivo",
            "observaciones",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "cliente_nombre", "created_at", "updated_at"]
        extra_kwargs = {
            "hora_fin": {"required": False, "allow_null": True},
            "motivo": {"required": False, "allow_blank": True, "allow_null": True},
            "observaciones": {
                "required": False,
                "allow_blank": True,
                "allow_null": True,
            },
        }

    def _calcular_hora_fin(self, hora_inicio: object) -> object:
        """
        Calcula la hora de fin sumando la duración configurada.

        Args:
            hora_inicio: Hora de inicio del turno.

        Returns:
            Hora de fin calculada.
        """
        config = ConfiguracionCalendario.get_configuracion_activa()
        duracion = config.duracion_turno_default if config else 30
        dt = datetime.combine(datetime.today().date(), hora_inicio)
        return (dt + timedelta(minutes=duracion)).time()

    def create(self, validated_data: dict) -> Turno:
        """
        Crea un turno calculando ``hora_fin`` si no fue provista.

        Args:
            validated_data: Datos validados del serializer.

        Returns:
            Instancia de Turno creada.
        """
        if not validated_data.get("hora_fin") and validated_data.get("hora_inicio"):
            validated_data["hora_fin"] = self._calcular_hora_fin(
                validated_data["hora_inicio"]
            )
        try:
            return super().create(validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)

    def update(self, instance: Turno, validated_data: dict) -> Turno:
        """
        Actualiza un turno recalculando ``hora_fin`` si ``hora_inicio`` cambia.

        Args:
            instance: Instancia existente de Turno.
            validated_data: Datos validados con los cambios.

        Returns:
            Instancia de Turno actualizada.
        """
        if "hora_inicio" in validated_data and not validated_data.get("hora_fin"):
            validated_data["hora_fin"] = self._calcular_hora_fin(
                validated_data["hora_inicio"]
            )
        try:
            return super().update(instance, validated_data)
        except DjangoValidationError as exc:
            raise DRFValidationError(exc.message_dict)
