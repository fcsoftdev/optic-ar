import { zodResolver } from "@hookform/resolvers/zod";
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
import { PlusCircle, Trash } from "react-bootstrap-icons";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  useCreateCompra,
  useUpdateCompra,
  useCompra,
} from "../hooks/useCompras";
import { compraSchema, type CompraFormValues } from "../schemas/compraSchema";
import type { CompraList, Proveedor } from "../services/compras.service";
import productosService from "../services/productos.service";
import comprasService from "../services/compras.service";
import AsyncSearchableSelect from "./AsyncSearchableSelect";
import ProveedorFormModal from "./ProveedorFormModal";

/** Fila vacía por defecto para el inline de detalles. */
const DETALLE_VACIO = {
  id: null,
  producto: 0,
  cantidad: 1,
  precio_unitario: 0,
  porcentaje_ganancia: 0,
  precio_venta: 0,
};

/**
 * Formatea un número con separador de miles (.) y decimales (,) en formato argentino.
 *
 * @param valor - Número a formatear.
 * @returns Cadena con formato monetario argentino. Ejemplo: 12.500,00.
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
  placeholder?: string;
}> = ({ value, onChange, isInvalid, size, placeholder }) => {
  const [raw, setRaw] = useState(
    Number.isFinite(value) && value !== 0 ? fmtARS(value) : "",
  );
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setRaw(Number.isFinite(value) && value !== 0 ? fmtARS(value) : "");
    }
  }, [value, focused]);

  const commit = (str: string) => {
    const normalized = str.replace(/\./g, "").replace(",", ".");
    const val = parseFloat(normalized);
    if (Number.isFinite(val)) {
      onChange(val);
      setRaw(fmtARS(val));
    } else {
      onChange(0);
      setRaw("");
    }
  };

  return (
    <Form.Control
      type="text"
      inputMode="decimal"
      size={size}
      value={raw}
      placeholder={placeholder}
      onChange={(e) => {
        const newRaw = e.target.value;
        setRaw(newRaw);
        // Propagar el valor parseado mientras se escribe
        const normalized = newRaw.replace(/\./g, "").replace(",", ".");
        const val = parseFloat(normalized);
        if (Number.isFinite(val)) {
          onChange(val);
        }
      }}
      onFocus={() => {
        setFocused(true);
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
 * Props para el componente CompraFormModal.
 */
interface CompraFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Compra a editar. Si es `null` o `undefined`, opera en modo creación. */
  compra?: CompraList | null;
  /** Callback ejecutado tras guardar exitosamente. */
  onSuccess?: () => void;
}

/**
 * Modal con formulario para crear o editar una Compra.
 *
 * @remarks
 * Incluye un inline dinámico de ítems. Al crear/editar un ítem, el backend
 * actualiza automáticamente el stock y los precios del producto involucrado.
 * El total se calcula en tiempo real (cantidad × precio_unitario).
 * Permite crear un proveedor nuevo desde el mismo formulario.
 *
 * @param props - Ver {@link CompraFormModalProps}.
 */
const CompraFormModal: React.FC<CompraFormModalProps> = ({
  show,
  onHide,
  compra,
  onSuccess,
}) => {
  const isEditing = !!compra;

  const { data: compraCompleta, isLoading: loadingCompra } = useCompra(
    compra?.id ?? 0,
  );

  // ── Cache de precios de productos ─────────────────────────────────────────
  const productoCacheRef = useRef<
    Record<number, { precio_venta: number; label: string }>
  >({});

  // ── Estado del proveedor seleccionado (label para AsyncSelect) ────────────
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<{
    value: number;
    label: string;
  } | null>(null);

  const [showProveedorModal, setShowProveedorModal] = useState(false);

  // ── Loaders para selects asíncronos ───────────────────────────────────────

  /**
   * Carga proveedores desde la API filtrando por texto.
   *
   * @param inputValue - Texto de búsqueda.
   * @returns Lista de opciones {value, label}.
   */
  const loadProveedores = useCallback(async (inputValue: string) => {
    const data = await comprasService.getProveedores({
      search: inputValue,
      page_size: 20,
    });
    return data.results.map((p) => ({ value: p.id, label: p.nombre }));
  }, []);

  /**
   * Carga todos los proveedores al abrir el dropdown.
   *
   * @returns Lista completa de proveedores.
   */
  const loadAllProveedores = useCallback(async () => {
    const data = await comprasService.getProveedores({ page_size: 9999 });
    return data.results.map((p) => ({ value: p.id, label: p.nombre }));
  }, []);

  /**
   * Carga productos desde la API filtrando por texto.
   * Almacena precios en el caché local para autocompletar al seleccionar.
   *
   * @param inputValue - Texto de búsqueda.
   * @returns Lista de opciones {value, label}.
   */
  const loadProductos = useCallback(async (inputValue: string) => {
    const data = await productosService.getProductos({
      search: inputValue,
      page_size: 20,
      ordering: "nombre",
    });
    return data.results.map((p) => {
      const label = `${p.nombre}${p.codigo ? ` (${p.codigo})` : ""}${p.marca_nombre ? ` [${p.marca_nombre}]` : ""}`;
      productoCacheRef.current[p.id] = {
        precio_venta: Number(p.precio_venta),
        label,
      };
      return { value: p.id, label };
    });
  }, []);

  /**
   * Carga todos los productos al abrir el dropdown.
   * También llena el caché de precios.
   *
   * @returns Lista completa de productos.
   */
  const loadAllProductos = useCallback(async () => {
    const data = await productosService.getProductos({
      page_size: 9999,
      ordering: "nombre",
    });
    return data.results.map((p) => {
      const label = `${p.nombre}${p.codigo ? ` (${p.codigo})` : ""}${p.marca_nombre ? ` [${p.marca_nombre}]` : ""}`;
      productoCacheRef.current[p.id] = {
        precio_venta: Number(p.precio_venta),
        label,
      };
      return { value: p.id, label };
    });
  }, []);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createCompra = useCreateCompra();
  const updateCompra = useUpdateCompra();
  const isPending = createCompra.isPending || updateCompra.isPending;
  const mutationError = createCompra.error || updateCompra.error;

  // ── Form ───────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().split("T")[0];

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CompraFormValues>({
    resolver: zodResolver(compraSchema) as any,
    defaultValues: {
      fecha: today,
      proveedor: undefined,
      detalles: [DETALLE_VACIO],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "detalles",
  });

  const watchedDetalles = useWatch({ control, name: "detalles" });

  // ── Precarga de valores al editar ──────────────────────────────────────────
  useEffect(() => {
    if (!show) return;

    if (isEditing && compraCompleta) {
      if (compraCompleta.proveedor && compraCompleta.proveedor_nombre) {
        setProveedorSeleccionado({
          value: compraCompleta.proveedor,
          label: compraCompleta.proveedor_nombre,
        });
      }

      compraCompleta.detalles_productos.forEach((d) => {
        if (d.producto && d.producto_nombre) {
          productoCacheRef.current[d.producto] = {
            precio_venta: Number(d.precio_venta),
            label: d.producto_nombre,
          };
        }
      });

      reset({
        fecha: compraCompleta.fecha,
        proveedor: compraCompleta.proveedor ?? undefined,
        detalles:
          compraCompleta.detalles_productos.length > 0
            ? compraCompleta.detalles_productos.map((d) => ({
                id: d.id,
                producto: d.producto ?? 0,
                cantidad: d.cantidad,
                precio_unitario: Number(d.precio_unitario),
                porcentaje_ganancia: Number(d.porcentaje_ganancia),
                precio_venta: Number(d.precio_venta),
              }))
            : [DETALLE_VACIO],
      });
    } else if (!isEditing) {
      setProveedorSeleccionado(null);
      reset({
        fecha: today,
        proveedor: undefined,
        detalles: [DETALLE_VACIO],
      });
    }
  }, [show, isEditing, compraCompleta, reset, today]);

  // ── Total calculado en tiempo real ────────────────────────────────────────
  const totalCompra = useMemo(() => {
    return (watchedDetalles ?? []).reduce((acc, d) => {
      const c = Number.isFinite(d.cantidad) ? d.cantidad : 0;
      const p = Number.isFinite(d.precio_unitario) ? d.precio_unitario : 0;
      return acc + c * p;
    }, 0);
  }, [watchedDetalles]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleClose = () => {
    reset();
    setProveedorSeleccionado(null);
    productoCacheRef.current = {};
    onHide();
  };

  /**
   * Al seleccionar un producto en un ítem, autocompleta precio_unitario
   * desde el precio_costo del producto.
   *
   * @param index - Índice del ítem en el array de detalles.
   * @param productoId - ID del producto seleccionado.
   */
  const handleProductoChange = (index: number, productoId: number | null) => {
    setValue(`detalles.${index}.producto`, productoId ?? 0);
  };

  /**
   * Al crear un proveedor desde el modal inline, lo auto-selecciona
   * en el selector del formulario de compra.
   *
   * @param nuevo - Proveedor recién creado.
   */
  const handleProveedorCreado = (nuevo: Proveedor) => {
    setProveedorSeleccionado({ value: nuevo.id, label: nuevo.nombre });
    setValue("proveedor", nuevo.id);
  };

  const onSubmit = async (values: CompraFormValues) => {
    const payload = {
      fecha: values.fecha,
      proveedor: values.proveedor,
      detalles: values.detalles.map((d) => ({
        ...(d.id ? { id: d.id } : {}),
        producto: d.producto,
        cantidad: d.cantidad,
        precio_unitario: d.precio_unitario,
        porcentaje_ganancia: d.porcentaje_ganancia,
      })),
    };

    try {
      if (isEditing && compra) {
        await updateCompra.mutateAsync({ id: compra.id, data: payload });
      } else {
        await createCompra.mutateAsync(payload);
      }
      onSuccess?.();
      handleClose();
    } catch {
      // El error se muestra vía mutationError
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        show={show}
        onHide={handleClose}
        size="xl"
        backdrop="static"
        scrollable
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? `Editar Compra #${compra?.id}` : "Nueva Compra"}
          </Modal.Title>
        </Modal.Header>

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Modal.Body>
            {isEditing && loadingCompra ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Cargando compra...</p>
              </div>
            ) : (
              <>
                {mutationError && (
                  <Alert variant="danger" className="mb-3">
                    {(mutationError as any)?.response?.data
                      ? JSON.stringify((mutationError as any).response.data)
                      : "Error al guardar la compra."}
                  </Alert>
                )}

                {/* ── Datos generales ─────────────────────────────────── */}
                <Row className="g-3 mb-4">
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>
                        Proveedor <span className="text-danger">*</span>
                      </Form.Label>
                      <div className="d-flex gap-2">
                        <div style={{ flex: 1 }}>
                          <Controller
                            name="proveedor"
                            control={control}
                            render={({ field }) => (
                              <AsyncSearchableSelect
                                loadOptions={loadProveedores}
                                loadAllOptions={loadAllProveedores}
                                value={field.value ?? null}
                                onChange={(v) => {
                                  field.onChange(v);
                                  if (!v) setProveedorSeleccionado(null);
                                }}
                                onSelectOption={(opt) => {
                                  if (opt) setProveedorSeleccionado(opt);
                                }}
                                placeholder="Buscar proveedor..."
                                selectedOption={proveedorSeleccionado}
                                isInvalid={!!errors.proveedor}
                              />
                            )}
                          />
                          {errors.proveedor && (
                            <div
                              className="text-danger"
                              style={{
                                fontSize: "0.875em",
                                marginTop: "0.25rem",
                              }}
                            >
                              {errors.proveedor.message}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          type="button"
                          title="Nuevo proveedor"
                          onClick={() => setShowProveedorModal(true)}
                        >
                          +
                        </Button>
                      </div>
                    </Form.Group>
                  </Col>

                  <Col md={3}>
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
                </Row>

                {/* ── Ítems de detalle ─────────────────────────────────── */}
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

                <div style={{ maxHeight: "340px", overflowY: "auto" }}>
                  <Table bordered hover size="sm" className="mb-0">
                    <thead className="table-secondary sticky-top">
                      <tr>
                        <th style={{ minWidth: "220px" }}>Producto</th>
                        <th style={{ width: "80px" }}>Cant.</th>
                        <th style={{ width: "130px" }}>P. Costo ($)</th>
                        <th style={{ width: "110px" }}>% Ganancia</th>
                        <th style={{ width: "130px" }}>P. Venta ($)</th>
                        <th style={{ width: "110px" }} className="text-end">
                          Subtotal
                        </th>
                        <th style={{ width: "50px" }} />
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => {
                        const cantidad =
                          watchedDetalles?.[index]?.cantidad ?? 0;
                        const precioCosto =
                          watchedDetalles?.[index]?.precio_unitario ?? 0;
                        const c = Number.isFinite(cantidad) ? cantidad : 0;
                        const p = Number.isFinite(precioCosto)
                          ? precioCosto
                          : 0;
                        const subtotal = c * p;

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
                                      f.value &&
                                      productoCacheRef.current[f.value]
                                        ? {
                                            value: f.value,
                                            label:
                                              productoCacheRef.current[f.value]
                                                .label,
                                          }
                                        : null
                                    }
                                  />
                                )}
                              />
                            </td>

                            <td>
                              <Controller
                                name={`detalles.${index}.cantidad`}
                                control={control}
                                render={({ field: f }) => (
                                  <Form.Control
                                    type="number"
                                    min={1}
                                    size="sm"
                                    value={f.value || ""}
                                    onChange={(e) =>
                                      f.onChange(parseInt(e.target.value) || 0)
                                    }
                                    isInvalid={
                                      !!(errors.detalles?.[index] as any)
                                        ?.cantidad
                                    }
                                  />
                                )}
                              />
                            </td>

                            <td>
                              <Controller
                                name={`detalles.${index}.precio_unitario`}
                                control={control}
                                render={({ field: f }) => (
                                  <NumericInput
                                    value={f.value}
                                    onChange={(newCosto) => {
                                      f.onChange(newCosto);
                                      const pct =
                                        watchedDetalles?.[index]
                                          ?.porcentaje_ganancia ?? 0;
                                      setValue(
                                        `detalles.${index}.precio_venta`,
                                        Math.round(
                                          newCosto * (1 + pct / 100) * 100,
                                        ) / 100,
                                      );
                                    }}
                                    size="sm"
                                    isInvalid={
                                      !!(errors.detalles?.[index] as any)
                                        ?.precio_unitario
                                    }
                                  />
                                )}
                              />
                            </td>

                            <td>
                              <Controller
                                name={`detalles.${index}.porcentaje_ganancia`}
                                control={control}
                                render={({ field: f }) => (
                                  <NumericInput
                                    value={f.value}
                                    onChange={(newPct) => {
                                      f.onChange(newPct);
                                      const costo =
                                        watchedDetalles?.[index]
                                          ?.precio_unitario ?? 0;
                                      setValue(
                                        `detalles.${index}.precio_venta`,
                                        Math.round(
                                          costo * (1 + newPct / 100) * 100,
                                        ) / 100,
                                      );
                                    }}
                                    size="sm"
                                    placeholder="0,00"
                                    isInvalid={
                                      !!(errors.detalles?.[index] as any)
                                        ?.porcentaje_ganancia
                                    }
                                  />
                                )}
                              />
                            </td>

                            <td>
                              <Controller
                                name={`detalles.${index}.precio_venta`}
                                control={control}
                                render={({ field: f }) => (
                                  <NumericInput
                                    value={f.value}
                                    onChange={(newVenta) => {
                                      f.onChange(newVenta);
                                      const costo =
                                        watchedDetalles?.[index]
                                          ?.precio_unitario ?? 0;
                                      if (costo > 0) {
                                        setValue(
                                          `detalles.${index}.porcentaje_ganancia`,
                                          Math.round(
                                            ((newVenta - costo) / costo) *
                                              100 *
                                              100,
                                          ) / 100,
                                        );
                                      }
                                    }}
                                    size="sm"
                                    isInvalid={
                                      !!(errors.detalles?.[index] as any)
                                        ?.precio_venta
                                    }
                                  />
                                )}
                              />
                            </td>

                            <td className="text-end align-middle">
                              <small>{fmtARS(subtotal)}</small>
                            </td>

                            <td className="text-center align-middle">
                              <Button
                                variant="outline-danger"
                                size="sm"
                                type="button"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                              >
                                <Trash size={13} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </>
            )}
          </Modal.Body>

          <Modal.Footer className="justify-content-between">
            <div className="fw-semibold fs-5">
              Total:{" "}
              <span className="text-primary">${fmtARS(totalCompra)}</span>
            </div>
            <div className="d-flex gap-2">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={isPending}>
                {isPending
                  ? "Guardando..."
                  : isEditing
                    ? "Guardar cambios"
                    : "Registrar compra"}
              </Button>
            </div>
          </Modal.Footer>
        </Form>
      </Modal>

      <ProveedorFormModal
        show={showProveedorModal}
        onHide={() => setShowProveedorModal(false)}
        onCreated={handleProveedorCreado}
      />
    </>
  );
};

export default CompraFormModal;
