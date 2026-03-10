"""
Migración para separar el campo nombre_apellido en dos campos: apellido y nombre.

El valor existente se divide tomando la última palabra como apellido
y el resto como nombre/s. Si el campo tiene una sola palabra, se asigna
íntegramente a apellido y nombre queda vacío.
"""

from django.db import migrations, models


def split_nombre_apellido(apps, schema_editor):
    """Populate apellido and nombre from the existing nombre_apellido field."""
    Cliente = apps.get_model("ventas", "Cliente")
    for cliente in Cliente.objects.all():
        nombre_apellido = (cliente.nombre_apellido or "").strip()
        parts = nombre_apellido.split()
        if len(parts) >= 2:
            cliente.apellido = parts[-1]
            cliente.nombre = " ".join(parts[:-1])
        elif len(parts) == 1:
            cliente.apellido = parts[0]
            cliente.nombre = ""
        else:
            cliente.apellido = ""
            cliente.nombre = ""
        cliente.save()


def reverse_split(apps, schema_editor):
    """Reconstruct nombre_apellido from apellido and nombre."""
    Cliente = apps.get_model("ventas", "Cliente")
    for cliente in Cliente.objects.all():
        parts = [p for p in [cliente.nombre, cliente.apellido] if p]
        cliente.nombre_apellido = " ".join(parts)
        cliente.save()


class Migration(migrations.Migration):

    dependencies = [
        ("ventas", "0006_alter_cliente_options"),
    ]

    operations = [
        # 1. Agregar los nuevos campos como opcionales (para la migración de datos)
        migrations.AddField(
            model_name="cliente",
            name="apellido",
            field=models.CharField(
                verbose_name="Apellido", max_length=100, default="", blank=True
            ),
        ),
        migrations.AddField(
            model_name="cliente",
            name="nombre",
            field=models.CharField(
                verbose_name="Nombre/s", max_length=100, default="", blank=True
            ),
        ),
        # 2. Migrar los datos existentes
        migrations.RunPython(split_nombre_apellido, reverse_code=reverse_split),
        # 3. Eliminar el campo original
        migrations.RemoveField(
            model_name="cliente",
            name="nombre_apellido",
        ),
        # 4. Hacer los campos obligatorios (quitar blank=True del default)
        migrations.AlterField(
            model_name="cliente",
            name="apellido",
            field=models.CharField(verbose_name="Apellido", max_length=100),
        ),
        migrations.AlterField(
            model_name="cliente",
            name="nombre",
            field=models.CharField(verbose_name="Nombre/s", max_length=100),
        ),
    ]
