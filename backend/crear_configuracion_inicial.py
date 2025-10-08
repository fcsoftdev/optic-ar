"""
Script para crear datos iniciales del sistema de turnos simplificado.

Ejecutar con: python manage.py shell < crear_configuracion_inicial.py
"""

from turnos.models import ConfiguracionCalendario

print("🚀 Creando configuración inicial para el sistema de turnos...")

try:
    config, created = ConfiguracionCalendario.objects.get_or_create(
        nombre="Configuración Principal",
        defaults={
            "hora_apertura": "09:00",
            "hora_cierre": "18:00",
            "duracion_turno_default": 30,
            "activa": True,
        },
    )
    print(f"✅ Configuración Principal - {'Creada' if created else 'Ya existe'}")

except Exception as e:
    print(f"❌ Error creando configuración: {e}")

# Mostrar resumen
print(f"\n📊 RESUMEN:")
print(f"   Configuraciones totales: {ConfiguracionCalendario.objects.count()}")
print(f"\n🎉 ¡Configuración inicial lista para usar!")

# Mostrar configuración activa
config_activa = ConfiguracionCalendario.get_configuracion_activa()
if config_activa:
    print(f"\n⚙️ CONFIGURACIÓN ACTIVA:")
    print(f"   Nombre: {config_activa.nombre}")
    print(f"   Horario: {config_activa.hora_apertura} - {config_activa.hora_cierre}")
    print(f"   Duración por defecto: {config_activa.duracion_turno_default} minutos")
else:
    print(f"\n⚠️ No hay configuración activa")
