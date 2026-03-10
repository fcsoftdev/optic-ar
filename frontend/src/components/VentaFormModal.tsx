/**
 * @file VentaFormModal.tsx
 * @description Modal para crear o editar una Venta con sus ítems de detalle.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Trash3 } from "react-bootstrap-icons";
import { useCreateVenta, useUpdateVenta, useVenta } from "../hooks/useVentas";
import AsyncSearchableSelect from "./AsyncSearchableSelect";
import ventasService from "../services/ventas.service";
import productosService from "../services/productos.service";
import { ventaSchema, type VentaFormValues } from "../schemas/ventaSchema";
import { FORMA_PAGO_LABELS, type VentaList } from "../services/ventas.service";

/** Props del componente VentaFormModal. */
interface VentaFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Venta existente a editar. Si es null, se crea una nueva. */
  venta?: VentaList | null;
  /** Callback ejecutado tras guardar exitosamente. */
  onSuccess?: () => void;
}

/** Fila vacía por defecto para agregar en el inline de detalles. */
const DETALLE_VACIO = { id: null, producto: 0, cantidad: 1, precio_venta: 0 };

/**
 * Convierte apellido y nombre en la etiqueta del selector: "Apellido, Nombre - DNI".
 */
const formatClienteLabel = (
  apellido: string,
  nombre: string,
  dni: string,
): string => `${apellido}, ${nombre} - ${dni}`;

/**
 * Formatea un número con separador de miles (.) y decimales (,) según el estándar argentino.
 *
 * @param valor - Número a formatear.
 * @returns Cadena con formato monetario argentino. Ejemplo: 63.082,38.
 */
const fmtARS = (valor: number): string =>
  Number.isFinite(valor)
    ? valor.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";

/**
 * Input numérico con edición libre: permite escribir sin re-formatear en cada tecla.
 * Muestra el valor formateado cuando pierde el foco (onBlur).
 */
const NumericInput: React.FC<{
  value: number;
  onChange: (v: number) => void;
  isInvalid?: boolean;
  size?: "sm" | "lg";
}> = ({ value, onChange, isInvalid, size }) => {
  const [raw, setRaw] = useState(() =>
    fmtARS(Number.isFinite(value) ? value : 0),
  );
  const [focused, setFocused] = useState(false);

  // Sincroniza el display cuando el valor cambia externamente (p.ej. auto-fill del precio)
  useEffect(() => {
    if (!focused) {
      setRaw(fmtARS(Number.isFinite(value) ? value : 0));
    }
  }, [value, focused]);

  const commit = (inputValue: string) => {
    const num = parseFloat(inputValue.replace(/\./g, "").replace(",", "."));
    const val = Number.isFinite(num) ? Math.round(num * 100) / 100 : 0;
    onChange(val);
    setRaw(fmtARS(val));
  };

  return (
    <Form.Control
      type="text"
      inputMode="decimal"
      size={size}
      value={raw}
      onChange={(e) => setRaw(e.target.value)}
      onFocus={() => {
        setFocused(true);
        // Al enfocar muestra el número sin formato para facilitar la edición
        setRaw(
          Number.isFinite(value) && value !== 0
            ? String(value).replace(".", ",")
            : "",
        );
      }}
      onBlur={(e) => {
        setFocused(false);
        commit(e.target.value);
      }}
      isInvalid={isInvalid}
    />
  );
};

/**
 * Modal con formulario para crear o editar una Venta.
 *
 * @remarks
 * Incluye un inline dinámico de ítems de detalle. Los totales (subtotal,
 * total venta y saldo) se calculan en tiempo real sin llamadas a la API.
 * Al guardar, el backend maneja el stock automáticamente.
 *
 * @param props - Ver {@link VentaFormModalProps}.
 */
const VentaFormModal: React.FC<VentaFormModalProps> = ({
  show,
  onHide,
  venta,
  onSuccess,
}) => {
  const isEditing = !!venta;

  // ── Datos completos de la venta (solo en edición) ──────────────────────────
  const { data: ventaCompleta, isLoading: loadingVenta } = useVenta(
    venta?.id ?? 0,
  );

  // ── Selectores asincrónicos con debounce ───────────────────────────────────

  /**
   * Carga clientes desde la API filtrando por el texto ingresado.
   * Se usa como `loadOptions` en AsyncSearchableSelect.
   *
   * @param inputValue - Texto de búsqueda (DNI o nombre).
   * @returns Primeros 20 clientes que coincidan.
   */
  const loadClientes = useCallback(async (inputValue: string) => {
    const data = await ventasService.getClientes({
      search: inputValue,
      page_size: 20,
    });
    return data.results.map((c) => ({
      value: c.id,
      label: formatClienteLabel(c.apellido, c.nombre, c.dni),
    }));
  }, []);

  /**
   * Carga todos los clientes sin límite de página para mostrar la lista completa al desplegar.
   */
  const loadAllClientes = useCallback(async () => {
    const data = await ventasService.getClientes({ page_size: 9999 });
    return data.results.map((c) => ({
      value: c.id,
      label: formatClienteLabel(c.apellido, c.nombre, c.dni),
    }));
  }, []);

  /**
   * Mapa en memoria product_id → { precio_venta, label } para autocompletar al
   * seleccionar un producto. Se llena a medida que el usuario busca productos.
   */
  const productoCacheRef = useRef<
    Record<number, { precio: number; label: string }>
  >({});

  /**
   * Carga productos desde la API filtrando por el texto ingresado.
   * Almacena precio y label en el caché local para autocompletar el precio al seleccionar.
   *
   * @param inputValue - Texto de búsqueda (nombre o código).
   * @returns Primeros 20 productos que coincidan.
   */
  const loadProductos = useCallback(async (inputValue: string) => {
    const data = await productosService.getProductos({
      search: inputValue,
      page_size: 20,
      ordering: "nombre",
    });
    return data.results.map((p) => {
      const label = `${p.nombre}${p.codigo ? ` (${p.codigo})` : ""}`;
      productoCacheRef.current[p.id] = {
        precio: Number(p.precio_venta),
        label,
      };
      return { value: p.id, label };
    });
  }, []);

  /**
   * Carga todos los productos sin límite de página para mostrar la lista completa al desplegar.
   * También llena el caché de precios para autocompletar sin necesidad de buscar.
   */
  const loadAllProductos = useCallback(async () => {
    const data = await productosService.getProductos({
      page_size: 9999,
      ordering: "nombre",
    });
    return data.results.map((p) => {
      const label = `${p.nombre}${p.codigo ? ` (${p.codigo})` : ""}`;
      productoCacheRef.current[p.id] = {
        precio: Number(p.precio_venta),
        label,
      };
      return { value: p.id, label };
    });
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createVenta = useCreateVenta();
  const updateVenta = useUpdateVenta();
  const isPending = createVenta.isPending || updateVenta.isPending;
  const mutationError = createVenta.error || updateVenta.error;

  // ── Form ───────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<VentaFormValues>({
    resolver: zodResolver(ventaSchema),
    defaultValues: {
      fecha: today,
      cliente: undefined,
      forma_pago: "CO",
      entrego: 0,
      detalles: [DETALLE_VACIO],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const watchedDetalles = useWatch({ control, name: "detalles" });
  const watchedEntrego = useWatch({ control, name: "entrego" });

  /**
   * Label del cliente seleccionado para mostrar en el selector al editar.
   * Se actualiza cuando el usuario elige un cliente en el AsyncSelect.
   */
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{
    value: number;
    label: string;
  } | null>(null);

  // ── Precarga de valores al editar ──────────────────────────────────────────
  useEffect(() => {
    if (!show) return;

    if (isEditing && ventaCompleta) {
      // Precarga el label del cliente en el estado para mostrarlo en el selector
      if (ventaCompleta.cliente_nombre) {
        setClienteSeleccionado({
          value: ventaCompleta.cliente,
          label: `${ventaCompleta.cliente_nombre} - ${ventaCompleta.cliente_dni}`,
        });
      }
      // Precarga el caché de productos con los datos de los detalles
      ventaCompleta.detalles_ventas.forEach((d) => {
        if (d.producto && d.producto_nombre) {
          productoCacheRef.current[d.producto] = {
            precio: Number(d.precio_venta),
            label: d.producto_nombre,
          };
        }
      });
      reset({
        fecha: ventaCompleta.fecha,
        cliente: ventaCompleta.cliente,
        forma_pago: ventaCompleta.forma_pago,
        entrego: Number(ventaCompleta.entrego),
        detalles:
          ventaCompleta.detalles_ventas.length > 0
            ? ventaCompleta.detalles_ventas.map((d) => ({
                id: d.id,
                producto: d.producto ?? 0,
                cantidad: d.cantidad,
                precio_venta: Number(d.precio_venta),
              }))
            : [DETALLE_VACIO],
      });
    } else if (!isEditing) {
      reset({
        fecha: today,
        cliente: undefined,
        forma_pago: "CO",
        entrego: 0,
        detalles: [DETALLE_VACIO],
      });
    }
  }, [show, isEditing, ventaCompleta, reset, today]);

  // ── Totales calculados en tiempo real ──────────────────────────────────────

  /**
   * Calcula el subtotal de un ítem de detalle.
   *
   * @param cantidad - Cantidad del ítem.
   * @param precio_venta - Precio de venta unitario.
   * @returns Subtotal calculado.
   */
  const calcularSubtotal = (cantidad: number, precio_venta: number): number => {
    const c = Number.isFinite(cantidad) ? cantidad : 0;
    const p = Number.isFinite(precio_venta) ? precio_venta : 0;
    return c * p;
  };

  const totalVenta = useMemo(
    () =>
      (watchedDetalles ?? []).reduce(
        (acc, d) => acc + calcularSubtotal(d.cantidad, d.precio_venta),
        0,
      ),
    [watchedDetalles],
  );

  /** Sincroniza el campo "entregó" con el total de la venta en tiempo real. */
  useEffect(() => {
    setValue("entrego", Math.round(totalVenta * 100) / 100);
  }, [totalVenta, setValue]);

  /** Valor seguro de entrego: evita NaN cuando el campo está vacío. */
  const safeEntrego = Number.isFinite(watchedEntrego) ? watchedEntrego : 0;
  const saldo = safeEntrego - totalVenta;

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = () => {
    reset();
    setClienteSeleccionado(null);
    productoCacheRef.current = {};
    onHide();
  };

  /**
   * Al seleccionar un producto en un detalle, autocompleta el precio de venta.
   *
   * @param index - Índice del ítem en el array de detalles.
   * @param productoId - ID del producto seleccionado.
   */
  const handleProductoChange = (index: number, productoId: number | null) => {
    setValue(`detalles.${index}.producto`, productoId ?? 0);
    const cached = productoId
      ? productoCacheRef.current[productoId]
      : undefined;
    if (cached != null) {
      setValue(`detalles.${index}.precio_venta`, cached.precio);
    }
  };

  const onSubmit = async (values: VentaFormValues) => {
    const payload = {
      fecha: values.fecha,
      cliente: values.cliente,
      forma_pago: values.forma_pago,
      entrego: values.entrego,
      detalles: values.detalles.map((d) => ({
        ...(d.id ? { id: d.id } : {}),
        producto: d.producto,
        cantidad: d.cantidad,
        precio_venta: d.precio_venta,
      })),
    };

    try {
      if (isEditing && venta) {
        await updateVenta.mutateAsync({ id: venta.id, data: payload });
      } else {
        await createVenta.mutateAsync(payload);
      }
      onSuccess?.();
      handleClose();
    } catch {
      // El error se muestra a través de mutationError
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Modal
      show={show}
      onHide={handleClose}
      size="xl"
      backdrop="static"
      scrollable
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? `Editar Venta #${venta?.id}` : "Nueva Venta"}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          {isEditing && loadingVenta ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando venta...</p>
            </div>
          ) : (
            <>
              {mutationError && (
                <Alert variant="danger" className="mb-3">
                  {(mutationError as any)?.response?.data
                    ? JSON.stringify((mutationError as any).response.data)
                    : "Error al guardar la venta."}
                </Alert>
              )}

              {/* ── Datos generales ───────────────────────────────────── */}
              <Row className="g-3 mb-4">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label>
                      Cliente <span className="text-danger">*</span>
                    </Form.Label>
                    <Controller
                      name="cliente"
                      control={control}
                      render={({ field }) => (
                        <AsyncSearchableSelect
                          loadOptions={loadClientes}
                          loadAllOptions={loadAllClientes}
                          value={field.value}
                          onChange={(v) => {
                            field.onChange(v);
                            if (!v) setClienteSeleccionado(null);
                          }}
                          onSelectOption={(opt) => {
                            if (opt) setClienteSeleccionado(opt);
                          }}
                          placeholder="Buscar por DNI o nombre..."
                          isInvalid={!!errors.cliente}
                          selectedOption={clienteSeleccionado}
                        />
                      )}
                    />
                    {errors.cliente && (
                      <div className="invalid-feedback d-block">
                        {errors.cliente.message}
                      </div>
                    )}
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>
                      Fecha <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      {...register("fecha")}
                      isInvalid={!!errors.fecha}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.fecha?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>
                      Forma de pago <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Select
                      {...register("forma_pago")}
                      isInvalid={!!errors.forma_pago}
                    >
                      {Object.entries(FORMA_PAGO_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">
                      {errors.forma_pago?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>

                <Col md={2}>
                  <Form.Group>
                    <Form.Label>
                      Entregó ($) <span className="text-danger">*</span>
                    </Form.Label>
                    <Controller
                      name="entrego"
                      control={control}
                      render={({ field }) => (
                        <NumericInput
                          value={field.value}
                          onChange={field.onChange}
                          isInvalid={!!errors.entrego}
                        />
                      )}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.entrego?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              {/* ── Ítems de detalle ───────────────────────────────────── */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <Form.Label className="mb-0 fw-semibold">
                  Productos{" "}
                  <Badge bg="secondary" pill>
                    {fields.length}
                  </Badge>
                </Form.Label>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => append(DETALLE_VACIO)}
                  type="button"
                >
                  <PlusCircle size={15} className="me-1" />
                  Agregar Producto
                </Button>
              </div>

              {errors.detalles && !Array.isArray(errors.detalles) && (
                <Alert variant="warning" className="py-2">
                  {errors.detalles.message}
                </Alert>
              )}

              <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                <Table bordered hover size="sm" className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th style={{ minWidth: "220px" }}>Producto</th>
                      <th style={{ width: "90px" }}>Cant.</th>
                      <th style={{ width: "120px" }}>Precio ($)</th>
                      <th style={{ width: "110px" }} className="text-end">
                        Subtotal
                      </th>
                      <th style={{ width: "50px" }} />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => {
                      const cantidad = watchedDetalles?.[index]?.cantidad ?? 0;
                      const precio =
                        watchedDetalles?.[index]?.precio_venta ?? 0;
                      const subtotal = calcularSubtotal(cantidad, precio);

                      return (
                        <tr key={field.id}>
                          <td>
                            <Controller
                              name={`detalles.${index}.producto`}
                              control={control}
                              render={({ field: f }) => (
                                <AsyncSearchableSelect
                                  loadOptions={loadProductos}
                                  loadAllOptions={loadAllProductos}
                                  value={f.value || null}
                                  onChange={(v) =>
                                    handleProductoChange(index, v)
                                  }
                                  placeholder="Buscar producto..."
                                  isInvalid={
                                    !!(errors.detalles?.[index] as any)
                                      ?.producto
                                  }
                                  selectedOption={
                                    f.value
                                      ? productoCacheRef.current[f.value]
                                        ? {
                                            value: f.value,
                                            label:
                                              productoCacheRef.current[f.value]
                                                .label,
                                          }
                                        : null
                                      : null
                                  }
                                />
                              )}
                            />
                            {(errors.detalles?.[index] as any)?.producto && (
                              <div
                                className="invalid-feedback d-block"
                                style={{ fontSize: "0.8em" }}
                              >
                                {
                                  (errors.detalles?.[index] as any)?.producto
                                    ?.message
                                }
                              </div>
                            )}
                          </td>
                          <td>
                            <Form.Control
                              type="number"
                              min="1"
                              step="1"
                              size="sm"
                              {...register(`detalles.${index}.cantidad`, {
                                valueAsNumber: true,
                              })}
                              isInvalid={
                                !!(errors.detalles?.[index] as any)?.cantidad
                              }
                            />
                          </td>
                          <td>
                            <Controller
                              name={`detalles.${index}.precio_venta`}
                              control={control}
                              render={({ field: f }) => (
                                <NumericInput
                                  value={f.value}
                                  onChange={f.onChange}
                                  isInvalid={
                                    !!(errors.detalles?.[index] as any)
                                      ?.precio_venta
                                  }
                                  size="sm"
                                />
                              )}
                            />
                          </td>
                          <td className="text-end align-middle">
                            <span className="text-muted">
                              ${fmtARS(subtotal)}
                            </span>
                          </td>
                          <td className="text-center align-middle">
                            <Button
                              variant="outline-danger"
                              size="sm"
                              type="button"
                              disabled={fields.length === 1}
                              onClick={() => remove(index)}
                              title="Eliminar ítem"
                            >
                              <Trash3 size={13} />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </div>

              {/* ── Totales ────────────────────────────────────────────── */}
              <div className="d-flex flex-column align-items-end gap-1 mt-2">
                <div className="d-flex gap-3">
                  <span className="text-muted">Total venta:</span>
                  <strong>${fmtARS(totalVenta)}</strong>
                </div>
                <div className="d-flex gap-3">
                  <span className="text-muted">Entregó:</span>
                  <strong>${fmtARS(safeEntrego)}</strong>
                </div>
                <div className="d-flex gap-3">
                  <span className="text-muted">Saldo:</span>
                  <strong
                    className={
                      saldo < 0
                        ? "text-danger"
                        : saldo > 0
                          ? "text-success"
                          : ""
                    }
                  >
                    ${fmtARS(saldo)}
                  </strong>
                </div>
              </div>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isPending || (isEditing && loadingVenta)}
          >
            {isPending && (
              <Spinner animation="border" size="sm" className="me-1" />
            )}
            {isEditing ? "Guardar cambios" : "Crear venta"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default VentaFormModal;
