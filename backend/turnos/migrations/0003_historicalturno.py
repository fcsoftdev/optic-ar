# Migración reemplazada: la tabla HistoricalTurno ya existe en la DB.
# Se usa SeparateDatabaseAndState para que Django conozca el estado del ORM
# sin volver a crear la tabla (evita importar simple_history que fue desinstalado).

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('turnos', '0002_add_dias_laborables'),
        ('ventas', '0008_historicalcliente_historicalconsulta_and_more'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[],  # tabla ya existe en la DB
            state_operations=[
                migrations.CreateModel(
                    name='HistoricalTurno',
                    fields=[
                        ('id', models.BigIntegerField(auto_created=True, blank=True, db_index=True)),
                        ('fecha', models.DateField()),
                        ('hora_inicio', models.TimeField()),
                        ('hora_fin', models.TimeField(blank=True, null=True)),
                        ('motivo', models.TextField(blank=True, null=True)),
                        ('observaciones', models.TextField(blank=True, null=True)),
                        ('created_at', models.DateTimeField(blank=True, null=True)),
                        ('updated_at', models.DateTimeField(blank=True, null=True)),
                        ('history_id', models.AutoField(primary_key=True, serialize=False)),
                        ('history_date', models.DateTimeField(db_index=True)),
                        ('history_change_reason', models.CharField(max_length=100, null=True)),
                        ('history_type', models.CharField(max_length=1)),
                        ('cliente', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to='ventas.cliente')),
                        ('created_by', models.ForeignKey(blank=True, db_constraint=False, null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='+', to=settings.AUTH_USER_MODEL)),
                        ('history_user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='+', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={'ordering': ('-history_date', '-history_id'), 'get_latest_by': ('history_date', 'history_id')},
                ),
            ],
        ),
    ]
