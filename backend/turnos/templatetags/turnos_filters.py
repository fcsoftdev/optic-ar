"""
Filtros personalizados para templates del sistema de turnos.
"""

from django import template

register = template.Library()


@register.filter
def lookup(dictionary, key):
    """
    Filtro para acceder a claves dinámicas en diccionarios desde templates.

    Uso: {{ diccionario|lookup:clave_variable }}
    """
    if dictionary is None:
        return None
    return dictionary.get(key, None)


@register.filter
def get_item(dictionary, key):
    """
    Filtro alternativo para acceder a elementos de diccionario.

    Uso: {{ diccionario|get_item:clave }}
    """
    return dictionary.get(key)
