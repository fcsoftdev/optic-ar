"""Servicios de cálculos financieros para el módulo de Compras."""

from decimal import Decimal, ROUND_HALF_UP


def calcular_precio_costo_promedio(
    stock_actual: Decimal,
    costo_actual: Decimal,
    cantidad_nueva: Decimal,
    costo_nuevo: Decimal,
) -> Decimal:
    """
    Calcula el costo promedio ponderado al incorporar un nuevo lote a un stock existente.

    Fórmula:
        CPP = (stock_actual × costo_actual + cantidad_nueva × costo_nuevo)
              / (stock_actual + cantidad_nueva)

    Casos especiales:
        - Si ``stock_actual <= 0``, el costo pasa a ser directamente ``costo_nuevo``.
        - Si el total de unidades es 0, retorna ``Decimal("0.00")``.

    Args:
        stock_actual: Unidades en stock antes de la compra.
        costo_actual: Costo unitario promedio actual del producto.
        cantidad_nueva: Unidades ingresadas en la nueva compra.
        costo_nuevo: Precio unitario de la nueva compra.

    Returns:
        Decimal: Nuevo costo promedio ponderado redondeado a 2 decimales.

    Example:
        >>> calcular_precio_costo_promedio(
        ...     Decimal("10"), Decimal("100.00"),
        ...     Decimal("5"),  Decimal("120.00")
        ... )
        Decimal('106.67')
    """
    total_unidades = stock_actual + cantidad_nueva

    if total_unidades <= 0:
        return Decimal("0.00")

    if stock_actual <= 0:
        return costo_nuevo.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    return (
        (stock_actual * costo_actual + cantidad_nueva * costo_nuevo) / total_unidades
    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    """
    Calcula el Costo Promedio Ponderado (CPP) dado una lista de lotes de compra.

    Fórmula: CPP = Σ(cantidad_i × precio_unitario_i) / Σ(cantidad_i)

    Esta función permite determinar el costo real por unidad considerando
    todos los lotes comprados a distintos precios, evitando pérdidas al
    fijar el precio de venta.

    Args:
        lotes: Lista de diccionarios con las claves:
               - ``cantidad`` (int): Unidades compradas en ese lote.
               - ``precio_unitario`` (Decimal): Costo por unidad del lote.

    Returns:
        Decimal: Costo promedio ponderado redondeado a 2 decimales.
                 Retorna ``Decimal("0.00")`` si la lista está vacía
                 o el total de unidades es cero.

    Example:
        >>> from decimal import Decimal
        >>> lotes = [
        ...     {"cantidad": 10, "precio_unitario": Decimal("100.00")},
        ...     {"cantidad": 5,  "precio_unitario": Decimal("120.00")},
        ... ]
        >>> calcular_costo_promedio_ponderado(lotes)
        Decimal('106.67')
    """
    if not lotes:
        return Decimal("0.00")

    total_unidades = sum(Decimal(str(l["cantidad"])) for l in lotes)

    if total_unidades == 0:
        return Decimal("0.00")

    total_costo = sum(
        Decimal(str(l["cantidad"])) * Decimal(str(l["precio_unitario"])) for l in lotes
    )

    return (total_costo / total_unidades).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
