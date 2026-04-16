# Migración reemplazada: las tablas Historical* ya existen en la DB.
# Se usa SeparateDatabaseAndState para que Django conozca el estado del ORM
# sin volver a crear las tablas (evita importar simple_history que fue desinstalado).

import datetime
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('compras', '0009_add_precio_compra_to_historialcosto'),
        ('productos', '0008_historicalcategoria_historicalmarca_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],  # tablas ya existen en la DB
            state_operations=[
                migrations.CreateModel(
                    name='HistoricalCompra',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('fecha', models.DateField(default=datetime.date.today)),
                        ('total', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                        ('proveedor', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='compras.proveedor')),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalDetalleCompra',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('cantidad', models.PositiveIntegerField()),
                        ('precio_unitario', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                        ('porcentaje_ganancia', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=5)),
                        ('precio_venta', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                        ('subtotal', models.DecimalField(decimal_places=2, max_digits=10)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('compra', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='compras.compra')),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                        ('producto', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='productos.producto')),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalGasto',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('fecha', models.DateField(default=datetime.date.today)),
                        ('descripcion', models.CharField(max_length=50)),
                        ('total', models.DecimalField(decimal_places=2, default=Decimal('0.00'), max_digits=10)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalProveedor',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('nombre', models.CharField(max_length=50)),
                        ('direccion', models.CharField(max_length=50)),
                        ('telefono', models.CharField(max_length=50)),
                        ('alias', models.CharField(max_length=50)),
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
