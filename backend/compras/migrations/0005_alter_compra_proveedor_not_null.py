from django.db import migrations, models
import django.db.models.deletion


def eliminar_compras_sin_proveedor(apps, schema_editor):
    """Elimina las compras que no tienen proveedor asignado antes de hacer el campo NOT NULL."""
    Compra = apps.get_model("compras", "Compra")
    Compra.objects.filter(proveedor__isnull=True).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('compras', '0004_detallecompra_precio_venta'),
    ]

    operations = [
        migrations.RunPython(
            eliminar_compras_sin_proveedor,
            reverse_code=migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='compra',
            name='proveedor',
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.PROTECT,
                to='compras.proveedor',
            ),
        ),
    ]
