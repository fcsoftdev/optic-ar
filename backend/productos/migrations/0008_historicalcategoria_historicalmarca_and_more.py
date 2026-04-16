# Migración reemplazada: las tablas Historical* ya existen en la DB.
# Se usa SeparateDatabaseAndState para que Django conozca el estado del ORM
# sin volver a crear las tablas (evita importar simple_history que fue desinstalado).

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0007_producto_porcentaje_ganancia'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],  # tablas ya existen en la DB
            state_operations=[
                migrations.CreateModel(
                    name='HistoricalCategoria',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('nombre', models.CharField(max_length=100)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalMarca',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('nombre', models.CharField(max_length=100)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalProducto',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('codigo', models.CharField(max_length=50)),
                        ('nombre', models.CharField(max_length=200)),
                        ('descripcion', models.TextField(blank=True, null=True)),
                        ('stock', models.IntegerField(default=0)),
                        ('precio_costo', models.DecimalField(decimal_places=2, max_digits=10, null=True, blank=True)),
                        ('precio_venta', models.DecimalField(decimal_places=2, max_digits=10, null=True, blank=True)),
                        ('porcentaje_ganancia', models.DecimalField(decimal_places=2, max_digits=5, null=True, blank=True)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalSubCategoria',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('nombre', models.CharField(max_length=100)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
            ],
        ),
    ]
