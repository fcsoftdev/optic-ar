"""
Servicio de auditoría centralizada para Optic-AR.

Provee funciones puras para construir el JSON de detalle de cada operación
(snapshot completo para crear/eliminar, diff para editar) y la función
``registrar`` que persiste el RegistroAuditoria en la base de datos.

Uso desde un ViewSet:
    from auditoria.services import registrar, snapshot_compra, diff_compra

    # En create():
    registrar(request.user, "crear", "compra", compra.id, snapshot_compra(compra))

    # En update():
    antes = capturar_estado_compra(instance)
    # ... super().update() ...
    detalle = diff_compra(antes, instance)
    registrar(request.user, "editar", "compra", instance.id, detalle)
"""

from decimal import Decimal
from typing import Any


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _decimal_str(valor) -> str | None:
    """Convierte Decimal/float/None a string para serialización JSON."""
    if valor is None:
        return None
    return str(Decimal(str(valor)))


def _diff_campos(antes: dict, despues: dict) -> dict:
    """
    Retorna solo los campos que cambiaron entre dos dicts.

    Args:
        antes: Estado anterior del objeto.
        despues: Estado nuevo del objeto.

    Returns:
        Dict con los campos que cambiaron en formato {campo: {antes, despues}}.
    """
    cambios = {}
    for campo in despues:
        val_antes = str(antes.get(campo, "")) if antes.get(campo) is not None else None
        val_despues = str(despues[campo]) if despues[campo] is not None else None
        if val_antes != val_despues:
            cambios[campo] = {"antes": val_antes, "despues": val_despues}
    return cambios


# ---------------------------------------------------------------------------
# Compra
# ---------------------------------------------------------------------------

def capturar_estado_compra(compra) -> dict:
    """
    Captura el estado completo de una Compra con sus ítems y datos de productos.

    Se llama ANTES de realizar la operación (update/destroy) para tener
    el estado previo disponible para el diff.

    Args:
        compra: Instancia de Compra con prefetch de detalles_productos y producto.

    Returns:
        Dict con cabecera e ítems completos.
    """
    items = []
    for detalle in compra.detalles_productos.select_related("producto").all():
        producto = detalle.producto
        items.append({
            "id": detalle.id,
            "producto_id": producto.id if producto else None,
            "producto": str(producto) if producto else "Sin producto",
            "cantidad": detalle.cantidad,
            "precio_unitario": _decimal_str(detalle.precio_unitario),
            "porcentaje_ganancia": _decimal_str(detalle.porcentaje_ganancia),
            "precio_venta": _decimal_str(detalle.precio_venta),
            "subtotal": _decimal_str(detalle.subtotal),
            "stock_producto": producto.stock if producto else None,
            "precio_costo_producto": _decimal_str(producto.precio_costo) if producto else None,
        })
    return {
        "proveedor_id": compra.proveedor_id,
        "proveedor": str(compra.proveedor) if compra.proveedor else "",
        "fecha": str(compra.fecha),
        "total": _decimal_str(compra.total),
        "items": items,
    }


def snapshot_compra(compra) -> dict:
    """
    Genera el JSON de detalle para una operación de CREACIÓN o ELIMINACIÓN de Compra.

    Args:
        compra: Instancia de Compra ya guardada (para crear) o antes de eliminar.

    Returns:
        Dict con snapshot completo de la compra.
    """
    return capturar_estado_compra(compra)


def diff_compra(estado_antes: dict, compra_nueva) -> dict:
    """
    Genera el JSON de detalle para una operación de EDICIÓN de Compra.

    Compara el estado anterior capturado antes del update contra el estado
    nuevo luego de aplicar los cambios.

    Args:
        estado_antes: Dict retornado por capturar_estado_compra() antes del update.
        compra_nueva: Instancia de Compra ya actualizada.

    Returns:
        Dict con cambios en cabecera e ítems (solo los que cambiaron).
    """
    # Diff de cabecera
    cabecera_antes = {
        "proveedor": estado_antes["proveedor"],
        "fecha": estado_antes["fecha"],
        "total": estado_antes["total"],
    }
    cabecera_nueva = {
        "proveedor": str(compra_nueva.proveedor) if compra_nueva.proveedor else "",
        "fecha": str(compra_nueva.fecha),
        "total": _decimal_str(compra_nueva.total),
    }
    cambios_cabecera = _diff_campos(cabecera_antes, cabecera_nueva)

    # Diff de ítems
    ids_antes = {item["id"]: item for item in estado_antes["items"]}
    items_nuevos = list(compra_nueva.detalles_productos.select_related("producto").all())
    ids_nuevos = {d.id for d in items_nuevos}

    items_diff = []

    # Ítems eliminados
    for det_id, item_antes in ids_antes.items():
        if det_id not in ids_nuevos:
            items_diff.append({
                "accion": "eliminado",
                "producto": item_antes["producto"],
                "cantidad": item_antes["cantidad"],
                "stock_devuelto": item_antes["cantidad"],
            })

    # Ítems nuevos o modificados
    for detalle in items_nuevos:
        producto = detalle.producto
        if detalle.id not in ids_antes:
            # Ítem nuevo
            items_diff.append({
                "accion": "agregado",
                "producto_id": producto.id if producto else None,
                "producto": str(producto) if producto else "Sin producto",
                "cantidad": detalle.cantidad,
                "precio_unitario": _decimal_str(detalle.precio_unitario),
                "precio_venta": _decimal_str(detalle.precio_venta),
                "stock_nuevo": producto.stock if producto else None,
                "precio_costo_nuevo": _decimal_str(producto.precio_costo) if producto else None,
            })
        else:
            # Ítem existente — solo incluir si cambió algo
            item_antes = ids_antes[detalle.id]
            cambios_item = _diff_campos(
                {
                    "cantidad": str(item_antes["cantidad"]),
                    "precio_unitario": item_antes["precio_unitario"],
                    "porcentaje_ganancia": item_antes["porcentaje_ganancia"],
                    "precio_venta": item_antes["precio_venta"],
                    "stock_producto": str(item_antes["stock_producto"]) if item_antes["stock_producto"] is not None else None,
                    "precio_costo_producto": item_antes["precio_costo_producto"],
                },
                {
                    "cantidad": str(detalle.cantidad),
                    "precio_unitario": _decimal_str(detalle.precio_unitario),
                    "porcentaje_ganancia": _decimal_str(detalle.porcentaje_ganancia),
                    "precio_venta": _decimal_str(detalle.precio_venta),
                    "stock_producto": str(producto.stock) if producto and producto.stock is not None else None,
                    "precio_costo_producto": _decimal_str(producto.precio_costo) if producto else None,
                },
            )
            if cambios_item:
                items_diff.append({
                    "accion": "modificado",
                    "producto": str(producto) if producto else "Sin producto",
                    "cambios": cambios_item,
                })

    return {
        "cabecera": cambios_cabecera,
        "items": items_diff,
    }


# ---------------------------------------------------------------------------
# Venta
# ---------------------------------------------------------------------------

def capturar_estado_venta(venta) -> dict:
    """
    Captura el estado completo de una Venta con sus ítems y datos de productos.

    Args:
        venta: Instancia de Venta con prefetch de detalles_ventas y producto.

    Returns:
        Dict con cabecera e ítems completos.
    """
    items = []
    for detalle in venta.detalles_ventas.select_related("producto").all():
        producto = detalle.producto
        items.append({
            "id": detalle.id,
            "producto_id": producto.id if producto else None,
            "producto": str(producto) if producto else "Sin producto",
            "cantidad": detalle.cantidad,
            "precio_venta": _decimal_str(detalle.precio_venta),
            "subtotal_item": _decimal_str(detalle.subtotal_item),
            "stock_producto": producto.stock if producto else None,
        })
    return {
        "cliente_id": venta.cliente_id,
        "cliente": str(venta.cliente) if venta.cliente else "",
        "fecha": str(venta.fecha),
        "forma_pago": venta.forma_pago,
        "forma_pago_display": venta.get_forma_pago_display(),
        "entrego": _decimal_str(venta.entrego),
        "total_venta": _decimal_str(venta.total_venta),
        "saldo": _decimal_str(venta.saldo),
        "items": items,
    }


def snapshot_venta(venta) -> dict:
    """
    Genera el JSON de detalle para una operación de CREACIÓN o ELIMINACIÓN de Venta.

    Args:
        venta: Instancia de Venta ya guardada (para crear) o antes de eliminar.

    Returns:
        Dict con snapshot completo de la venta.
    """
    return capturar_estado_venta(venta)


def diff_venta(estado_antes: dict, venta_nueva) -> dict:
    """
    Genera el JSON de detalle para una operación de EDICIÓN de Venta.

    Args:
        estado_antes: Dict retornado por capturar_estado_venta() antes del update.
        venta_nueva: Instancia de Venta ya actualizada.

    Returns:
        Dict con cambios en cabecera e ítems (solo los que cambiaron).
    """
    cabecera_antes = {
        "cliente": estado_antes["cliente"],
        "fecha": estado_antes["fecha"],
        "forma_pago": estado_antes["forma_pago"],
        "entrego": estado_antes["entrego"],
        "total_venta": estado_antes["total_venta"],
        "saldo": estado_antes["saldo"],
    }
    cabecera_nueva = {
        "cliente": str(venta_nueva.cliente) if venta_nueva.cliente else "",
        "fecha": str(venta_nueva.fecha),
        "forma_pago": venta_nueva.forma_pago,
        "entrego": _decimal_str(venta_nueva.entrego),
        "total_venta": _decimal_str(venta_nueva.total_venta),
        "saldo": _decimal_str(venta_nueva.saldo),
    }
    cambios_cabecera = _diff_campos(cabecera_antes, cabecera_nueva)

    ids_antes = {item["id"]: item for item in estado_antes["items"]}
    items_nuevos = list(venta_nueva.detalles_ventas.select_related("producto").all())
    ids_nuevos = {d.id for d in items_nuevos}

    items_diff = []

    for det_id, item_antes in ids_antes.items():
        if det_id not in ids_nuevos:
            items_diff.append({
                "accion": "eliminado",
                "producto": item_antes["producto"],
                "cantidad": item_antes["cantidad"],
                "stock_devuelto": item_antes["cantidad"],
            })

    for detalle in items_nuevos:
        producto = detalle.producto
        if detalle.id not in ids_antes:
            items_diff.append({
                "accion": "agregado",
                "producto_id": producto.id if producto else None,
                "producto": str(producto) if producto else "Sin producto",
                "cantidad": detalle.cantidad,
                "precio_venta": _decimal_str(detalle.precio_venta),
                "stock_nuevo": producto.stock if producto else None,
            })
        else:
            item_antes = ids_antes[detalle.id]
            cambios_item = _diff_campos(
                {
                    "cantidad": str(item_antes["cantidad"]),
                    "precio_venta": item_antes["precio_venta"],
                    "stock_producto": str(item_antes["stock_producto"]) if item_antes["stock_producto"] is not None else None,
                },
                {
                    "cantidad": str(detalle.cantidad),
                    "precio_venta": _decimal_str(detalle.precio_venta),
                    "stock_producto": str(producto.stock) if producto and producto.stock is not None else None,
                },
            )
            if cambios_item:
                items_diff.append({
                    "accion": "modificado",
                    "producto": str(producto) if producto else "Sin producto",
                    "cambios": cambios_item,
                })

    return {
        "cabecera": cambios_cabecera,
        "items": items_diff,
    }


# ---------------------------------------------------------------------------
# Producto
# ---------------------------------------------------------------------------

def _campos_producto(producto) -> dict:
    """Extrae los campos auditables de un Producto."""
    return {
        "nombre": producto.nombre,
        "descripcion": producto.descripcion or "",
        "codigo": producto.codigo,
        "stock": str(producto.stock) if producto.stock is not None else None,
        "precio_costo": _decimal_str(producto.precio_costo),
        "porcentaje_ganancia": _decimal_str(producto.porcentaje_ganancia),
        "precio_venta": _decimal_str(producto.precio_venta),
        "marca": str(producto.marca) if producto.marca else None,
        "categoria": str(producto.categoria) if producto.categoria else None,
        "sub_categoria": str(producto.sub_categoria) if producto.sub_categoria else None,
    }


def snapshot_producto(producto) -> dict:
    """
    Genera el JSON de detalle para una operación de CREACIÓN o ELIMINACIÓN de Producto.

    Args:
        producto: Instancia de Producto.

    Returns:
        Dict con todos los campos auditables del producto.
    """
    return _campos_producto(producto)


def diff_producto(estado_antes: dict, producto_nuevo) -> dict:
    """
    Genera el JSON de detalle para una operación de EDICIÓN de Producto.

    Args:
        estado_antes: Dict retornado por _campos_producto() antes del update.
        producto_nuevo: Instancia de Producto ya actualizada.

    Returns:
        Dict con solo los campos que cambiaron en formato {campo: {antes, despues}}.
    """
    return _diff_campos(estado_antes, _campos_producto(producto_nuevo))


def capturar_estado_producto(producto) -> dict:
    """
    Captura el estado actual de un Producto para usar como estado_antes.

    Args:
        producto: Instancia de Producto.

    Returns:
        Dict con los campos auditables del producto.
    """
    return _campos_producto(producto)


# ---------------------------------------------------------------------------
# Turno
# ---------------------------------------------------------------------------

def _campos_turno(turno) -> dict:
    """Extrae los campos auditables de un Turno."""
    return {
        "cliente_id": turno.cliente_id,
        "cliente": str(turno.cliente) if turno.cliente else "",
        "fecha": str(turno.fecha),
        "hora_inicio": str(turno.hora_inicio),
        "hora_fin": str(turno.hora_fin) if turno.hora_fin else None,
        "motivo": turno.motivo or "",
        "observaciones": turno.observaciones or "",
    }


def snapshot_turno(turno) -> dict:
    """
    Genera el JSON de detalle para una operación de ELIMINACIÓN de Turno.

    Args:
        turno: Instancia de Turno antes de ser eliminada.

    Returns:
        Dict con todos los campos auditables del turno.
    """
    return _campos_turno(turno)


def diff_turno(estado_antes: dict, turno_nuevo) -> dict:
    """
    Genera el JSON de detalle para una operación de EDICIÓN de Turno.

    Args:
        estado_antes: Dict retornado por _campos_turno() antes del update.
        turno_nuevo: Instancia de Turno ya actualizada.

    Returns:
        Dict con solo los campos que cambiaron en formato {campo: {antes, despues}}.
    """
    return _diff_campos(estado_antes, _campos_turno(turno_nuevo))


def capturar_estado_turno(turno) -> dict:
    """
    Captura el estado actual de un Turno para usar como estado_antes.

    Args:
        turno: Instancia de Turno.

    Returns:
        Dict con los campos auditables del turno.
    """
    return _campos_turno(turno)


# ---------------------------------------------------------------------------
# Función central de registro
# ---------------------------------------------------------------------------

def registrar(
    usuario: Any,
    accion: str,
    modelo: str,
    objeto_id: int,
    detalle: dict,
) -> "RegistroAuditoria":  # noqa: F821
    """
    Persiste un RegistroAuditoria en la base de datos.

    Args:
        usuario: Instancia del usuario autenticado (o None para sistema).
        accion: Clave de acción — "crear", "editar" o "eliminar".
        modelo: Clave de modelo — "compra", "venta", "producto" o "turno".
        objeto_id: ID del objeto afectado.
        detalle: JSON con el snapshot o diff de la operación.

    Returns:
        Instancia de RegistroAuditoria creada.
    """
    from auditoria.models import RegistroAuditoria

    return RegistroAuditoria.objects.create(
        usuario=usuario if usuario and usuario.is_authenticated else None,
        accion=accion,
        modelo=modelo,
        objeto_id=objeto_id,
        detalle=detalle,
    )
