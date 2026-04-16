"""
Modelos para el módulo de autenticación.

Incluye modelos proxy para definir permisos personalizados del sistema
que no pertenecen a ninguna entidad de negocio específica.
"""

from django.db import models


class AuditoriaConfig(models.Model):
    """
    Modelo proxy para definir el permiso de acceso a la auditoría del sistema.

    No crea ninguna tabla en la base de datos. El permiso generado
    (authentication.ver_auditoria) puede asignarse a grupos o usuarios
    desde el panel de administración de Usuarios/Grupos.
    """

    class Meta:
        managed = False
        db_table = ""
        verbose_name = "Auditoría"
        verbose_name_plural = "Auditoría"
        # Permiso personalizado para controlar acceso al módulo de auditoría
        permissions = [
            ("ver_auditoria", "Puede ver la auditoría del sistema"),
        ]
