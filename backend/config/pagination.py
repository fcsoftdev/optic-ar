"""
Módulo de paginación personalizada para la API REST.

Define clases de paginación reutilizables con soporte para controlar
el tamaño de página desde el cliente via query param.
"""

from rest_framework.pagination import PageNumberPagination


class StandardPagination(PageNumberPagination):
    """
    Paginación estándar con soporte para `page_size` configurable por el cliente.

    El cliente puede pasar `?page_size=N` para obtener más (o menos) resultados
    por página. Útil cuando se necesita cargar todos los registros de una vez
    para selectores/combos, pasando un valor grande como `page_size=9999`.

    Attributes:
        page_size (int): Tamaño de página por defecto.
        page_size_query_param (str): Nombre del query param para cambiar el tamaño.
        max_page_size (int): Límite máximo de resultados por página.
    """

    page_size: int = 10
    page_size_query_param: str = "page_size"
    max_page_size: int = 10000
