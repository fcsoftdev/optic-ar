"""
Clases de permisos personalizadas para la API REST.

Extienden DjangoModelPermissions para exigir el permiso de visualización
(view_*) también en peticiones GET, además de los permisos estándar
de escritura (add, change, delete).
"""

from rest_framework.permissions import DjangoModelPermissions


class PermisoModeloCompleto(DjangoModelPermissions):
    """
    Permiso que exige los cuatro permisos de modelo de Django:
    view (GET), add (POST), change (PUT/PATCH) y delete (DELETE).

    DjangoModelPermissions por defecto no exige 'view_*' para GET.
    Esta clase lo agrega, de modo que un usuario sin 'turnos.view_turno'
    recibe 403 al listar o consultar turnos, igual que si intentara eliminar
    sin 'turnos.delete_turno'.

    Los superusuarios ignoran todas las comprobaciones de permiso
    directamente en Django, por lo que siguen teniendo acceso total.
    """

    perms_map = {
        "GET": ["%(app_label)s.view_%(model_name)s"],
        "OPTIONS": [],
        "HEAD": [],
        "POST": ["%(app_label)s.add_%(model_name)s"],
        "PUT": ["%(app_label)s.change_%(model_name)s"],
        "PATCH": ["%(app_label)s.change_%(model_name)s"],
        "DELETE": ["%(app_label)s.delete_%(model_name)s"],
    }
