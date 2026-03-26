"""
Serializadores para el ABM de Usuarios y Grupos.

Expone:
- PermissionSerializer: permisos disponibles (solo lectura)
- GroupSerializer: CRUD de grupos con asignación de permisos
- UserSerializer: CRUD de usuarios con contraseña y asignación de grupos/permisos
"""

from typing import Any

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

User = get_user_model()


class ContentTypeSerializer(serializers.ModelSerializer):
    """Serializer auxiliar para mostrar el app/modelo del permiso."""

    class Meta:
        model = ContentType
        fields = ["app_label", "model"]


class PermissionSerializer(serializers.ModelSerializer):
    """
    Serializer de solo lectura para permisos de Django.

    Agrupa app_label y model del ContentType junto con el codename
    para facilitar la presentación en el frontend.
    """

    app_label = serializers.CharField(source="content_type.app_label", read_only=True)
    model = serializers.CharField(source="content_type.model", read_only=True)

    class Meta:
        model = Permission
        fields = ["id", "name", "codename", "app_label", "model"]


class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD para grupos de Django.

    Permite leer y asignar permisos mediante lista de IDs.
    """

    permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        write_only=True,
        source="permissions",
        required=False,
    )
    user_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = ["id", "name", "permissions", "permission_ids", "user_count"]

    def get_user_count(self, obj: Group) -> int:
        """Cantidad de usuarios que pertenecen al grupo."""
        return obj.user_set.count()


class PerfilSerializer(serializers.ModelSerializer):
    """
    Serializer para que el usuario actualice su propio perfil.

    Solo expone los campos editables por el propio usuario:
    first_name, last_name y email.
    """

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id", "username"]

    def validate_email(self, value: str) -> str:
        """Valida que el email no esté en uso por otro usuario."""
        qs = User.objects.filter(email=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ese email ya está en uso.")
        return value


class UserListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listado de usuarios."""

    groups = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    is_superuser = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "is_superuser",
            "groups",
            "date_joined",
        ]
        read_only_fields = ["id", "date_joined"]


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer CRUD completo para usuarios.

    - password: write-only, opcional en actualizaciones (PATCH).
    - group_ids: IDs de los grupos a asignar.
    - permission_ids: permisos individuales adicionales al grupo.
    """

    password = serializers.CharField(
        write_only=True,
        required=False,
        style={"input_type": "password"},
        min_length=8,
    )
    groups = GroupSerializer(many=True, read_only=True)
    group_ids = serializers.PrimaryKeyRelatedField(
        queryset=Group.objects.all(),
        many=True,
        write_only=True,
        source="groups",
        required=False,
    )
    user_permissions = PermissionSerializer(many=True, read_only=True)
    permission_ids = serializers.PrimaryKeyRelatedField(
        queryset=Permission.objects.all(),
        many=True,
        write_only=True,
        source="user_permissions",
        required=False,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "password",
            "groups",
            "group_ids",
            "user_permissions",
            "permission_ids",
        ]
        read_only_fields = ["id"]

    def validate_username(self, value: str) -> str:
        """Valida que el username no esté ya en uso (excluyendo la instancia actual)."""
        qs = User.objects.filter(username=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Ya existe un usuario con ese nombre.")
        return value

    def create(self, validated_data: dict) -> Any:
        """Crea el usuario aplicando hashing de contraseña."""
        groups = validated_data.pop("groups", [])
        permissions = validated_data.pop("user_permissions", [])
        password = validated_data.pop("password", None)

        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()
        user.groups.set(groups)
        user.user_permissions.set(permissions)
        return user

    def update(self, instance: Any, validated_data: dict) -> Any:
        """Actualiza el usuario. La contraseña solo se cambia si se envía."""
        groups = validated_data.pop("groups", None)
        permissions = validated_data.pop("user_permissions", None)
        password = validated_data.pop("password", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if groups is not None:
            instance.groups.set(groups)
        if permissions is not None:
            instance.user_permissions.set(permissions)

        return instance
