from rest_framework import serializers
from .models import Marca, Categoria, SubCategoria, Producto


class MarcaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Marca
        fields = ["id", "nombre"]


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ["id", "nombre"]


class SubCategoriaSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)

    class Meta:
        model = SubCategoria
        fields = ["id", "nombre", "categoria", "categoria_nombre"]


class SubCategoriaListSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubCategoria
        fields = ["id", "nombre"]


class ProductoSerializer(serializers.ModelSerializer):
    marca_nombre = serializers.CharField(source="marca.nombre", read_only=True)
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    sub_categoria_nombre = serializers.CharField(
        source="sub_categoria.nombre", read_only=True
    )

    class Meta:
        model = Producto
        fields = [
            "id",
            "codigo",
            "nombre",
            "descripcion",
            "marca",
            "marca_nombre",
            "categoria",
            "categoria_nombre",
            "sub_categoria",
            "sub_categoria_nombre",
            "stock",
            "precio_costo",
            "porcentaje_ganancia",
            "precio_venta",
        ]
        read_only_fields = ["id"]

    def validate_precio_venta(self, value):
        if value and value <= 0:
            raise serializers.ValidationError("El precio de venta debe ser mayor a 0.")
        return value

    def validate_precio_costo(self, value):
        if value and value < 0:
            raise serializers.ValidationError(
                "El precio de costo no puede ser negativo."
            )
        return value

    def validate_stock(self, value):
        if value and value < 0:
            raise serializers.ValidationError("El stock no puede ser negativo.")
        return value


class ProductoListSerializer(serializers.ModelSerializer):
    marca_nombre = serializers.CharField(source="marca.nombre", read_only=True)
    categoria_nombre = serializers.CharField(source="categoria.nombre", read_only=True)
    sub_categoria_nombre = serializers.CharField(
        source="sub_categoria.nombre", read_only=True
    )

    class Meta:
        model = Producto
        fields = [
            "id",
            "codigo",
            "nombre",
            "marca_nombre",
            "categoria_nombre",
            "sub_categoria_nombre",
            "stock",
            "precio_venta",
        ]
