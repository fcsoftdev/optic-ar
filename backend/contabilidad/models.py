"""
Modelos para el módulo de Contabilidad.

Nota: Este módulo usa un modelo proxy para mostrar la sección en el admin.
El Reporte de Caja se genera a partir de datos de Ventas, Compras y Gastos.
"""
from django.db import models


class ReporteCaja(models.Model):
    """
    Modelo proxy para que aparezca la sección Contabilidad en el admin.
    No crea ninguna tabla en la base de datos.
    """
    
    # Campo auxiliar para que Django no tenga problemas
    id = models.AutoField(primary_key=True)
    
    class Meta:
        managed = False  # No crear tabla en la base de datos
        db_table = ''  # No usar ninguna tabla
        verbose_name = "Reporte de Caja"
        verbose_name_plural = "Reporte de Caja"
        # Permisos personalizados para controlar acceso
        permissions = [
            ("ver_reporte_caja", "Puede ver el reporte de caja"),
        ]
