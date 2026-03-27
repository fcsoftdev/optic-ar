import React, { useState, useEffect, useRef, type JSX } from "react";
import { Button, Col, Form, Row, Table, Spinner, Alert } from "react-bootstrap";
import { BoxSeam, PencilSquare, Trash } from "react-bootstrap-icons";
import ListHeader from "./ListHeader";
import { usePermiso } from "../hooks/usePermiso";
import {
  useProductos,
  useDeleteProducto,
  useMarcas,
  useCategorias,
  useSubCategorias,
} from "../hooks/useProductos";
import ProductoFormModal from "./ProductoFormModal";
import AumentoMasivoModal from "./AumentoMasivoModal";
import productosService, { type Producto } from "../services/productos.service";

const obtenerClaseStock = (stock: number): string => {
  if (stock <= 1) {
    return "table-danger";
  } else if (stock >= 2 && stock <= 10) {
    return "table-warning";
  }
  return "";
};

const ProductList: React.FC = (): JSX.Element => {
  const { tienePermiso } = usePermiso();
  const puedeEditar = tienePermiso("productos.change_producto");
  const puedeEliminar = tienePermiso("productos.delete_producto");
  const hayAcciones = puedeEditar || puedeEliminar;
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showAumentoModal, setShowAumentoModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedMarca, setSelectedMarca] = useState<number | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(
    null,
  );
  const [selectedSubCategoria, setSelectedSubCategoria] = useState<
    number | null
  >(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);

  // Debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // Espera 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductos({
    search: debouncedSearchTerm,
    marca: selectedMarca || undefined,
    categoria: selectedCategoria || undefined,
    sub_categoria: selectedSubCategoria || undefined,
  });
  const deleteProducto = useDeleteProducto();
  const { data: marcasData } = useMarcas();
  const { data: categorias } = useCategorias();
  const { data: subcategorias } = useSubCategorias(
    selectedCategoria || undefined,
  );

  const products = data?.pages.flatMap((p) => p.results) ?? [];
  const marcas = Array.isArray(marcasData)
    ? marcasData
    : marcasData?.results || [];
  const categoriasData = categorias || [];
  const subcategoriasData = subcategorias || [];

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleMarcaChange = (marcaId: number | null) => {
    setSelectedMarca(marcaId);
  };

  const handleCategoriaChange = (categoriaId: number | null) => {
    setSelectedCategoria(categoriaId);
    setSelectedSubCategoria(null); // Reset subcategoría al cambiar categoría
  };

  const handleSubCategoriaChange = (subCategoriaId: number | null) => {
    setSelectedSubCategoria(subCategoriaId);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(products.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleDeleteProduct = (productId: number) => {
    if (confirm("¿Está seguro de eliminar este producto?")) {
      deleteProducto.mutate(productId);
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const handleDeleteSelected = () => {
    if (
      confirm(`¿Está seguro de eliminar ${selectedProducts.length} productos?`)
    ) {
      selectedProducts.forEach((id) => {
        deleteProducto.mutate(id);
      });
      setSelectedProducts([]);
    }
  };

  const handleEditProduct = async (productId: number) => {
    try {
      const fullProducto = await productosService.getProducto(productId);
      setEditingProducto(fullProducto);
      setShowModal(true);
    } catch (error) {
      console.error("Error al cargar producto:", error);
    }
  };

  const handleAddProduct = () => {
    setEditingProducto(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProducto(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearchTerm(searchTerm);
  };

  if (isLoading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        Error al cargar productos: {(error as Error).message}
      </Alert>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 80px)",
      }}
    >
      <div style={{ flex: "0 0 auto" }}>
        <ListHeader
          title="Productos"
          count={data?.pages[0]?.count || 0}
          icon={<BoxSeam size={26} viewBox="0 0 16 16" />}
          addLabel="Producto"
          onAdd={handleAddProduct}
          canAdd={tienePermiso("productos.add_producto")}
        >
          {puedeEliminar && selectedProducts.length > 0 && (
            <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
              <Trash size={16} className="me-1" />
              Eliminar seleccionados ({selectedProducts.length})
            </Button>
          )}
          {puedeEditar && selectedProducts.length > 0 && (
            <Button
              variant="warning"
              size="sm"
              onClick={() => setShowAumentoModal(true)}
            >
              Aumento Masivo ({selectedProducts.length})
            </Button>
          )}
        </ListHeader>

        <Form className="mb-3" onSubmit={handleSearch}>
          <Row className="g-2 align-items-center">
            <Col xs={12} md={3}>
              <Form.Control
                type="text"
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={12} md={2}>
              <Form.Select
                value={selectedMarca || ""}
                onChange={(e) =>
                  handleMarcaChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Todas las marcas</option>
                {marcas.map((marca) => (
                  <option key={marca.id} value={marca.id}>
                    {marca.nombre}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={2}>
              <Form.Select
                value={selectedCategoria || ""}
                onChange={(e) =>
                  handleCategoriaChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Todas las categorías</option>
                {categoriasData.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs={12} md={2}>
              <Form.Select
                value={selectedSubCategoria || ""}
                onChange={(e) =>
                  handleSubCategoriaChange(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                disabled={!selectedCategoria}
              >
                <option value="">Todas las subcategorías</option>
                {subcategoriasData.map((subcat) => (
                  <option key={subcat.id} value={subcat.id}>
                    {subcat.nombre}
                  </option>
                ))}
              </Form.Select>
            </Col>
            <Col xs="auto">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setDebouncedSearchTerm("");
                  setSelectedMarca(null);
                  setSelectedCategoria(null);
                  setSelectedSubCategoria(null);
                }}
              >
                Limpiar
              </Button>
            </Col>
          </Row>
        </Form>
      </div>

      <div
        style={{
          overflow: "auto",
          flex: "1 1 auto",
          border: "1px solid #dee2e6",
          borderRadius: "4px",
        }}
      >
        <Table
          striped
          bordered
          hover
          style={{ minWidth: "800px", marginBottom: 0 }}
        >
          <thead
            style={{
              position: "sticky",
              top: 0,
              backgroundColor: "#fff",
              zIndex: 1,
              boxShadow: "0 2px 2px -1px rgba(0, 0, 0, 0.1)",
            }}
            className="table-dark"
          >
            <tr>
              <th style={{ width: "50px" }}>
                <Form.Check
                  type="checkbox"
                  checked={
                    selectedProducts.length === products.length &&
                    products.length > 0
                  }
                  onChange={handleSelectAll}
                />
              </th>
              <th>#</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>Marca</th>
              <th>Categoría</th>
              <th>Subcategoría</th>
              <th>Precio</th>
              <th>Stock</th>
              {hayAcciones && <th style={{ width: "120px" }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {products.map((producto) => (
              <tr
                key={producto.id}
                className={obtenerClaseStock(producto.stock)}
              >
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedProducts.includes(producto.id)}
                    onChange={() => handleSelectProduct(producto.id)}
                  />
                </td>
                <td>{producto.id}</td>
                <td>{producto.codigo}</td>
                <td>{producto.nombre}</td>
                <td>{producto.marca_nombre}</td>
                <td>{producto.categoria_nombre}</td>
                <td>{producto.sub_categoria_nombre || "-"}</td>
                <td>
                  {producto.precio_venta
                    ? `$${producto.precio_venta.toLocaleString()}`
                    : "-"}
                </td>
                <td>{producto.stock}</td>
                {hayAcciones && (
                  <td>
                    {puedeEditar && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEditProduct(producto.id)}
                        title="Editar"
                      >
                        <PencilSquare size={16} />
                      </Button>
                    )}
                    {puedeEliminar && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDeleteProduct(producto.id)}
                        title="Eliminar"
                      >
                        <Trash size={16} />
                      </Button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </Table>
        {/* Sentinel para infinite scroll */}
        <div ref={sentinelRef} style={{ height: 1 }} />
        {isFetchingNextPage && (
          <div className="text-center py-3">
            <Spinner animation="border" size="sm" className="me-2" />
            Cargando más productos...
          </div>
        )}
      </div>

      {/* Modal de formulario */}
      <ProductoFormModal
        show={showModal}
        onHide={handleCloseModal}
        producto={editingProducto}
      />

      {/* Modal de aumento masivo */}
      <AumentoMasivoModal
        show={showAumentoModal}
        onHide={() => setShowAumentoModal(false)}
        selectedIds={selectedProducts}
        onSuccess={() => setSelectedProducts([])}
      />
    </div>
  );
};

export default ProductList;
