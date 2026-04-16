# Migración reemplazada: las tablas Historical* ya existen en la DB.
# Se usa SeparateDatabaseAndState para que Django conozca el estado del ORM
# sin volver a crear las tablas (evita importar simple_history que fue desinstalado).

import datetime
import django.core.validators
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('productos', '0008_historicalcategoria_historicalmarca_and_more'),
        ('ventas', '0007_split_nombre_apellido_into_apellido_nombre'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],  # tablas ya existen en la DB
            state_operations=[
                migrations.CreateModel(
                    name='HistoricalCliente',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('apellido', models.CharField(max_length=100)),
                        ('nombre', models.CharField(max_length=100)),
                        ('dni', models.CharField(db_index=True, max_length=8)),
                        ('fecha_nacimiento', models.DateField(blank=True, null=True)),
                        ('telefono', models.CharField(blank=True, max_length=16, null=True)),
                        ('mail', models.EmailField(blank=True, max_length=254, null=True)),
                        ('direccion', models.CharField(blank=True, max_length=50, null=True)),
                        ('nro_afiliado', models.CharField(blank=True, max_length=50, null=True)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                        ('obra_social', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='ventas.obrasocial')),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalConsulta',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('fecha', models.DateField(default=datetime.date.today)),
                        ('motivo', models.TextField()),
                        ('diagnostico', models.TextField(blank=True, null=True)),
                        ('tratamiento', models.TextField(blank=True, null=True)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('cliente', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='ventas.cliente')),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalDetalleVenta',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('cantidad', models.PositiveIntegerField(default=1)),
                        ('precio_venta', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                        ('precio_unitario', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                        ('subtotal_item', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                        ('producto', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='productos.producto')),
                        ('venta', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='ventas.venta')),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalGraduacion',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('od_lejos_esferico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('od_lejos_cilindrico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('od_lejos_eje', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MaxValueValidator(180)])),
                        ('oi_lejos_esferico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('oi_lejos_cilindrico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('oi_lejos_eje', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MaxValueValidator(180)])),
                        ('od_cerca_esferico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('od_cerca_cilindrico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('od_cerca_eje', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MaxValueValidator(180)])),
                        ('oi_cerca_esferico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('oi_cerca_cilindrico', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                        ('oi_cerca_eje', models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MaxValueValidator(180)])),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('consulta', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='ventas.consulta')),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalObraSocial',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('nombre', models.CharField(max_length=100)),
                        ('direccion', models.CharField(blank=True, max_length=100, null=True)),
                        ('telefono', models.CharField(blank=True, max_length=16, null=True)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
                migrations.CreateModel(
                    name='HistoricalVenta',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('fecha', models.DateField(default=datetime.date.today)),
                        ('forma_pago', models.CharField(max_length=2)),
                        ('entrego', models.DecimalField(decimal_places=2, max_digits=10)),
                        ('total_venta', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                        ('saldo', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('cliente', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='ventas.cliente')),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
            ],
        ),
    ]
