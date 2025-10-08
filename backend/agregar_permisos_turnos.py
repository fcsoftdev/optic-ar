"""
Script para agregar permisos de turnos al usuario actual.
Ejecutar: python manage.py shell < agregar_permisos_turnos.py
"""

from django.contrib.auth.models import User, Permission
from django.contrib.contenttypes.models import ContentType
from ventas.models import ServicioTurno, Turno, ConfiguracionCalendario

print("🔐 Configurando permisos para modelos de turnos...")

try:
    # Obtener todos los superusuarios
    superusers = User.objects.filter(is_superuser=True)

    if superusers.exists():
        for user in superusers:
            print(f"✅ Superusuario encontrado: {user.username}")
            print("   (Los superusuarios ya tienen todos los permisos)")

    # Obtener usuarios staff que no son superusuarios
    staff_users = User.objects.filter(is_staff=True, is_superuser=False)

    if staff_users.exists():
        # Obtener los content types para nuestros modelos
        servicioturno_ct = ContentType.objects.get_for_model(ServicioTurno)
        turno_ct = ContentType.objects.get_for_model(Turno)
        config_ct = ContentType.objects.get_for_model(ConfiguracionCalendario)

        # Obtener todos los permisos para estos modelos
        permisos_necesarios = Permission.objects.filter(
            content_type__in=[servicioturno_ct, turno_ct, config_ct]
        )

        for user in staff_users:
            print(f"\n👤 Agregando permisos a: {user.username}")

            for permiso in permisos_necesarios:
                user.user_permissions.add(permiso)
                print(f"   ✅ {permiso.codename}")

            print(f"   🎉 Total permisos agregados: {permisos_necesarios.count()}")

    else:
        print("⚠️  No se encontraron usuarios staff (no superusuarios)")
        print("   Todos los superusuarios ya tienen acceso completo")

    # Mostrar resumen de permisos
    print(f"\n📊 RESUMEN DE PERMISOS:")
    print(f"   Superusuarios (acceso total): {superusers.count()}")
    print(f"   Staff users con permisos: {staff_users.count()}")

    # Listar permisos específicos creados
    print(f"\n🔑 PERMISOS DISPONIBLES:")
    for model, name in [
        (ServicioTurno, "ServicioTurno"),
        (Turno, "Turno"),
        (ConfiguracionCalendario, "ConfiguracionCalendario"),
    ]:
        ct = ContentType.objects.get_for_model(model)
        permisos = Permission.objects.filter(content_type=ct)
        print(f"   {name}:")
        for p in permisos:
            print(f"     - {p.name} ({p.codename})")

except Exception as e:
    print(f"❌ Error configurando permisos: {e}")
    import traceback

    traceback.print_exc()

print("\n✅ Configuración de permisos completada!")
