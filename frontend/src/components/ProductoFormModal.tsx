import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Form,
  InputGroup,
  Modal,
  Row,
} from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import {
  useCategorias,
  useCreateCategoria,
  useCreateMarca,
  useCreateProducto,
  useCreateSubCategoria,
  useDeleteCategoria,
  useDeleteMarca,
  useDeleteSubCategoria,
  useMarcas,
  useSubCategorias,
  useUpdateCategoria,
  useUpdateMarca,
  useUpdateProducto,
  useUpdateSubCategoria,
} from "../hooks/useProductos";
import {
  productoSchema,
  type ProductoFormData,
} from "../schemas/productoSchema";
import type { Producto, HistorialCosto } from "../services/productos.service";
import { useNavStore } from "../stores/useNavStore";
import { useNavigate } from "react-router-dom";
import EntityManagerModal from "./EntityManagerModal";
import SearchableSelect from "./SearchableSelect";

interface ProductoFormModalProps {
  show: boolean;
  onHide: () => void;
  producto?: Producto | null;
}

const ProductoFormModal: React.FC<ProductoFormModalProps> = ({
  show,
  onHide,
  producto,
}) => {
  const isEditing = !!producto;
  const [showMarcaManager, setShowMarcaManager] = useState(false);
  const [showCategoriaManager, setShowCategoriaManager] = useState(false);
  const [showSubCategoriaManager, setShowSubCategoriaManager] = useState(false);
  const { setPendingCompraId } = useNavStore();
  const navigate = useNavigate();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductoFormData>({
    resolver: zodResolver(productoSchema) as any,
    defaultValues: {
      codigo: "",
      nombre: "",
      descripcion: "",
      marca: 0,
      categoria: 0,
      sub_categoria: null,
      stock: 0,
      precio_costo: null,
      porcentaje_ganancia: null,
      precio_venta: 0,
    },
  });

  const selectedCategoria = watch("categoria");

  const { data: marcasData = [], isLoading: loadingMarcas } = useMarcas();
  const { data: categorias = [], isLoading: loadingCategorias } =
    useCategorias();

  // Extraer marcas del resultado paginado o array
  const marcas = Array.isArray(marcasData)
    ? marcasData
    : marcasData?.results || [];
  const { data: subcategorias = [], isLoading: loadingSubcategorias } =
    useSubCategorias(selectedCategoria || undefined);

  const createProducto = useCreateProducto();
  const updateProducto = useUpdateProducto();

  const createMarca = useCreateMarca();
  const updateMarca = useUpdateMarca();
  const deleteMarca = useDeleteMarca();

  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria();

  const createSubCategoria = useCreateSubCategoria();
  const updateSubCategoria = useUpdateSubCategoria();
  const deleteSubCategoria = useDeleteSubCategoria();

  // Función para calcular el precio de venta
  const calcularPrecioVenta = (
    costo: number | null | undefined,
    porcentaje: number | null | undefined,
  ) => {
    if (!costo || costo <= 0) {
      setValue("precio_venta", 0);
      return;
    }
    const porcentajeAplicar = porcentaje ?? 0;
    const ganancia = costo * (porcentajeAplicar / 100);
    const precioVenta = costo + ganancia;
    setValue("precio_venta", Math.round(precioVenta * 100) / 100);
  };

  useEffect(() => {
    if (producto) {
      reset({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        marca: producto.marca,
        categoria: producto.categoria,
        sub_categoria: producto.sub_categoria || null,
        stock: producto.stock,
        precio_costo: producto.precio_costo || null,
        porcentaje_ganancia: producto.porcentaje_ganancia || null,
        precio_venta: producto.precio_venta || 0,
      });
    } else {
      reset({
        codigo: "",
        nombre: "",
        descripcion: "",
        marca: 0,
        categoria: 0,
        sub_categoria: null,
        stock: 0,
        precio_costo: null,
        porcentaje_ganancia: null,
        precio_venta: 0,
      });
    }
  }, [producto, reset]);

  const onSubmit = async (data: ProductoFormData) => {
    try {
      const submitData = {
        ...data,
        sub_categoria: data.sub_categoria || undefined,
        precio_costo: data.precio_costo ?? undefined,
        porcentaje_ganancia: data.porcentaje_ganancia ?? undefined,
        precio_venta: data.precio_venta ?? 0,
      };

      if (isEditing) {
        await updateProducto.mutateAsync({
          id: producto.id,
          data: submitData,
        });
      } else {
        await createProducto.mutateAsync(submitData);
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar producto:", error);
    }
  };

  const handleClose = () => {
    reset();
    onHide();
  };

  // Handlers para Marca
  const handleCreateMarca = async (nombre: string) => {
    const newMarca = await createMarca.mutateAsync(nombre);
    setValue("marca", newMarca.id);
  };

  const handleUpdateMarca = async (id: number, nombre: string) => {
    await updateMarca.mutateAsync({ id, nombre });
  };

  const handleDeleteMarca = async (id: number) => {
    await deleteMarca.mutateAsync(id);
    if (watch("marca") === id) {
      setValue("marca", 0);
    }
  };

  // Handlers para Categoría
  const handleCreateCategoria = async (nombre: string) => {
    const newCategoria = await createCategoria.mutateAsync(nombre);
    setValue("categoria", newCategoria.id);
  };

  const handleUpdateCategoria = async (id: number, nombre: string) => {
    await updateCategoria.mutateAsync({ id, nombre });
  };

  const handleDeleteCategoria = async (id: number) => {
    await deleteCategoria.mutateAsync(id);
    if (watch("categoria") === id) {
      setValue("categoria", 0);
      setValue("sub_categoria", null);
    }
  };

  // Handlers para SubCategoría
  const handleCreateSubCategoria = async (
    nombre: string,
    categoriaId?: number,
  ) => {
    if (!categoriaId) throw new Error("Categoría requerida");
    const newSubCategoria = await createSubCategoria.mutateAsync({
      nombre,
      categoria: categoriaId,
    });
    setValue("sub_categoria", newSubCategoria.id);
  };

  const handleUpdateSubCategoria = async (
    id: number,
    nombre: string,
    categoriaId?: number,
  ) => {
    if (!categoriaId) throw new Error("Categoría requerida");
    await updateSubCategoria.mutateAsync({
      id,
      nombre,
      categoria: categoriaId,
    });
  };

  const handleDeleteSubCategoria = async (id: number) => {
    await deleteSubCategoria.mutateAsync(id);
    if (watch("sub_categoria") === id) {
      setValue("sub_categoria", null);
    }
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Código <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="codigo"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="text"
                        isInvalid={!!errors.codigo}
                        placeholder="Ej: ARN1234"
                      />
                    )}
                  />
                  {errors.codigo && (
                    <Form.Control.Feedback type="invalid">
                      {errors.codigo.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Nombre <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="nombre"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="text"
                        isInvalid={!!errors.nombre}
                        placeholder="Nombre del producto"
                      />
                    )}
                  />
                  {errors.nombre && (
                    <Form.Control.Feedback type="invalid">
                      {errors.nombre.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Controller
                name="descripcion"
                control={control}
                render={({ field }) => (
                  <Form.Control
                    {...field}
                    as="textarea"
                    rows={3}
                    placeholder="Descripción del producto (opcional)"
                  />
                )}
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Marca <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="marca"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={marcas.map((marca) => ({
                          value: marca.id,
                          label: marca.nombre,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Buscar marca..."
                        isInvalid={!!errors.marca}
                        disabled={loadingMarcas}
                        onManageClick={() => setShowMarcaManager(true)}
                        noOptionsMessage="No hay marcas disponibles"
                      />
                    )}
                  />
                  {errors.marca && (
                    <div className="text-danger small mt-1">
                      {errors.marca.message}
                    </div>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Categoría <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="categoria"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={categorias.map((categoria) => ({
                          value: categoria.id,
                          label: categoria.nombre,
                        }))}
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          setValue("sub_categoria", null);
                        }}
                        placeholder="Buscar categoría..."
                        isInvalid={!!errors.categoria}
                        disabled={loadingCategorias}
                        onManageClick={() => setShowCategoriaManager(true)}
                        noOptionsMessage="No hay categorías disponibles"
                      />
                    )}
                  />
                  {errors.categoria && (
                    <div className="text-danger small mt-1">
                      {errors.categoria.message}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Subcategoría</Form.Label>
                  <Controller
                    name="sub_categoria"
                    control={control}
                    render={({ field }) => (
                      <SearchableSelect
                        options={subcategorias.map((subcat) => ({
                          value: subcat.id,
                          label: subcat.nombre,
                        }))}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Buscar subcategoría..."
                        disabled={!selectedCategoria || loadingSubcategorias}
                        onManageClick={() => setShowSubCategoriaManager(true)}
                        isClearable={true}
                        noOptionsMessage="No hay subcategorías disponibles"
                      />
                    )}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Stock <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="stock"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="number"
                        min="0"
                        step="1"
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        isInvalid={!!errors.stock}
                        placeholder="0"
                      />
                    )}
                  />
                  {errors.stock && (
                    <Form.Control.Feedback type="invalid">
                      {errors.stock.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Precio de Costo (ARS)</Form.Label>
                  <Controller
                    name="precio_costo"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <InputGroup>
                        <InputGroup.Text>$</InputGroup.Text>
                        <Form.Control
                          {...field}
                          type="number"
                          min="0"
                          step="0.01"
                          value={value ?? ""}
                          onChange={(e) => {
                            const numValue = (e.target as HTMLInputElement)
                              .valueAsNumber;
                            const newCosto = isNaN(numValue) ? null : numValue;
                            // Obtener porcentaje antes de actualizar el costo
                            const porcentajeActual = getValues(
                              "porcentaje_ganancia",
                            );
                            onChange(newCosto);
                            // Calcular inmediatamente con los valores actuales
                            calcularPrecioVenta(newCosto, porcentajeActual);
                          }}
                          isInvalid={!!errors.precio_costo}
                          placeholder="0.00"
                        />
                        {errors.precio_costo && (
                          <Form.Control.Feedback type="invalid">
                            {errors.precio_costo.message}
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                    )}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label>Porcentaje de Ganancia (%)</Form.Label>
                  <Controller
                    name="porcentaje_ganancia"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <InputGroup>
                        <Form.Control
                          {...field}
                          type="number"
                          min="0"
                          max="999.99"
                          step="0.01"
                          value={value ?? ""}
                          onChange={(e) => {
                            const numValue = (e.target as HTMLInputElement)
                              .valueAsNumber;
                            const newPorcentaje = isNaN(numValue)
                              ? null
                              : numValue;
                            // Obtener costo antes de actualizar el porcentaje
                            const costoActual = getValues("precio_costo");
                            onChange(newPorcentaje);
                            // Calcular inmediatamente con los valores actuales
                            calcularPrecioVenta(costoActual, newPorcentaje);
                          }}
                          isInvalid={!!errors.porcentaje_ganancia}
                          placeholder="0.00"
                        />
                        <InputGroup.Text>%</InputGroup.Text>
                        {errors.porcentaje_ganancia && (
                          <Form.Control.Feedback type="invalid">
                            {errors.porcentaje_ganancia.message}
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                    )}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>
                    Precio de Venta (ARS) <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="precio_venta"
                    control={control}
                    render={({ field: { value, onChange, ...field } }) => (
                      <InputGroup>
                        <InputGroup.Text>$</InputGroup.Text>
                        <Form.Control
                          {...field}
                          type="number"
                          step="0.01"
                          value={value ?? ""}
                          readOnly
                          isInvalid={!!errors.precio_venta}
                          placeholder="0.00"
                          style={{ backgroundColor: "#e9ecef" }}
                        />
                        {errors.precio_venta && (
                          <Form.Control.Feedback type="invalid">
                            {errors.precio_venta.message}
                          </Form.Control.Feedback>
                        )}
                      </InputGroup>
                    )}
                  />
                  <Form.Text className="text-muted">
                    Se calcula automáticamente: Precio Costo + Porcentaje
                    Ganancia
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {/* Historial de costos (solo en edición) */}
            {isEditing &&
              producto?.historial_costos &&
              producto.historial_costos.length > 0 && (
                <Row className="mb-3">
                  <Col md={12}>
                    <Form.Label className="text-muted">
                      Historial de Precio
                    </Form.Label>
                    <div className="d-flex gap-2">
                      {producto.historial_costos.map(
                        (h: HistorialCosto, i: number) => (
                          <div
                            key={i}
                            className="border rounded px-3 py-2 bg-light text-center"
                            style={{
                              minWidth: 130,
                              cursor: h.compra_id ? "pointer" : "default",
                              transition: "box-shadow 0.15s",
                            }}
                            role={h.compra_id ? "button" : undefined}
                            title={h.compra_id ? "Ver compra" : undefined}
                            onClick={() => {
                              if (h.compra_id) {
                                setPendingCompraId(h.compra_id);
                                navigate("/compras", {
                                  state: { compraId: h.compra_id },
                                });
                                handleClose();
                              }
                            }}
                            onMouseEnter={(e) => {
                              if (h.compra_id)
                                (
                                  e.currentTarget as HTMLDivElement
                                ).style.boxShadow = "0 0 0 2px #0d6efd";
                            }}
                            onMouseLeave={(e) => {
                              (
                                e.currentTarget as HTMLDivElement
                              ).style.boxShadow = "";
                            }}
                          >
                            <div className="fw-semibold text-dark">
                              $
                              {parseFloat(h.precio_compra).toLocaleString(
                                "es-AR",
                                { minimumFractionDigits: 2 },
                              )}
                            </div>
                            <div className="text-muted small">{h.fecha}</div>
                            {h.compra_id ? (
                              <div
                                className="text-primary"
                                style={{ fontSize: "0.7rem" }}
                              >
                                Ver compra →
                              </div>
                            ) : (
                              <div
                                className="text-warning"
                                style={{ fontSize: "0.7rem" }}
                              >
                                Aumento masivo
                              </div>
                            )}
                          </div>
                        ),
                      )}
                    </div>
                  </Col>
                </Row>
              )}

            {(createProducto.isError || updateProducto.isError) && (
              <Alert variant="danger" className="mt-3">
                Error al guardar el producto. Por favor, intente nuevamente.
              </Alert>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modales de gestión */}
      <EntityManagerModal
        show={showMarcaManager}
        onHide={() => setShowMarcaManager(false)}
        title="Marcas"
        entityType="marca"
        items={marcas}
        onCreate={handleCreateMarca}
        onUpdate={handleUpdateMarca}
        onDelete={handleDeleteMarca}
        isLoading={loadingMarcas}
      />

      <EntityManagerModal
        show={showCategoriaManager}
        onHide={() => setShowCategoriaManager(false)}
        title="Categorías"
        entityType="categoria"
        items={categorias}
        onCreate={handleCreateCategoria}
        onUpdate={handleUpdateCategoria}
        onDelete={handleDeleteCategoria}
        isLoading={loadingCategorias}
      />

      <EntityManagerModal
        show={showSubCategoriaManager}
        onHide={() => setShowSubCategoriaManager(false)}
        title="Subcategorías"
        entityType="subcategoria"
        items={subcategorias}
        categorias={categorias}
        selectedCategoria={selectedCategoria}
        onCreate={handleCreateSubCategoria}
        onUpdate={handleUpdateSubCategoria}
        onDelete={handleDeleteSubCategoria}
        isLoading={loadingSubcategorias}
      />
    </>
  );
};

export default ProductoFormModal;
