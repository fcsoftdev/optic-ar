"""
Script para crear datos iniciales del sistema de turnos.

Ejecutar con: python manage.py shell < crear_datos_iniciales.py
"""

from ventas.models import ServicioTurno, ConfiguracionCalendario
from datetime import timedelta

print("🚀 Creando datos iniciales para el sistema de turnos...")

# Crear servicios básicos
try:
    servicio1, created1 = ServicioTurno.objects.get_or_create(
        nombre="Consulta Visual",
        defaults={
            "descripcion": "Examen completo de la vista y revisión oftalmológica",
            "duracion_estimada": timedelta(minutes=30),
            "precio_base": 2500.00,
        },
    )
    print(f"✅ Consulta Visual - {'Creado' if created1 else 'Ya existe'}")

    servicio2, created2 = ServicioTurno.objects.get_or_create(
        nombre="Reparación De Anteojos",
        defaults={
            "descripcion": "Reparación y ajuste de marcos y cristales",
            "duracion_estimada": timedelta(minutes=15),
            "precio_base": 1200.00,
        },
    )
    print(f"✅ Reparación de Anteojos - {'Creado' if created2 else 'Ya existe'}")

    servicio3, created3 = ServicioTurno.objects.get_or_create(
        nombre="Entrega De Anteojos",
        defaults={
            "descripcion": "Entrega y ajuste final de anteojos nuevos",
            "duracion_estimada": timedelta(minutes=20),
            "precio_base": 0.00,
        },
    )
    print(f"✅ Entrega de Anteojos - {'Creado' if created3 else 'Ya existe'}")

    servicio4, created4 = ServicioTurno.objects.get_or_create(
        nombre="Control De Rutina",
        defaults={
            "descripcion": "Control periódico y seguimiento de tratamiento",
            "duracion_estimada": timedelta(minutes=20),
            "precio_base": 1500.00,
        },
    )
    print(f"✅ Control de Rutina - {'Creado' if created4 else 'Ya existe'}")

except Exception as e:
    print(f"❌ Error creando servicios: {e}")

# Crear configuración del calendario
try:
    config, created_config = ConfiguracionCalendario.objects.get_or_create(
        nombre="Configuración Principal",
        defaults={
            "hora_apertura": "09:00",
            "hora_cierre": "18:00",
            "dias_laborables": [0, 1, 2, 3, 4, 5],  # Lunes a Sábado
            "duracion_slot_minima": 15,
            "tiempo_preparacion": 5,
            "horas_recordatorio": 24,
            "activa": True,
        },
    )
    print(
        f"✅ Configuración del Calendario - {'Creada' if created_config else 'Ya existe'}"
    )

except Exception as e:
    print(f"❌ Error creando configuración: {e}")

# Mostrar resumen
print(f"\n📊 RESUMEN:")
print(f"   Servicios totales: {ServicioTurno.objects.count()}")
print(f"   Configuraciones: {ConfiguracionCalendario.objects.count()}")
print(f"\n🎉 ¡Datos iniciales listos para usar!")
