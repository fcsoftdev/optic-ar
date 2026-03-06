import React, { useState, useEffect, type JSX } from "react";
import {
  Button,
  Col,
  Form,
  Row,
  Table,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import { PencilSquare, Trash } from "react-bootstrap-icons";
import AddButton from "./AddButton";
import PaginationBar from "./PaginationBar";
import {
  useProductos,
  useDeleteProducto,
  useMarcas,
  useCategorias,
  useSubCategorias,
} from "../hooks/useProductos";
import ProductoFormModal from "./ProductoFormModal";
import type { Producto } from "../services/productos.service";

const obtenerClaseStock = (stock: number): string => {
  if (stock <= 1) {
    return "table-danger";
  } else if (stock >= 2 && stock <= 10) {
    return "table-warning";
  }
  return "";
};

const ProductList: React.FC = (): JSX.Element => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedMarca, setSelectedMarca] = useState<number | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(
    null,
  );
  const [selectedSubCategoria, setSelectedSubCategoria] = useState<
    number | null
  >(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);

  // Debounce para el término de búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setCurrentPage(1); // Reset a la primera página al buscar
    }, 500); // Espera 500ms después de que el usuario deje de escribir

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading, error } = useProductos({
    search: debouncedSearchTerm,
    page: currentPage,
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

  const products = data?.results || [];
  const totalPages = data?.count ? Math.ceil(data.count / 10) : 0;
  const marcas = Array.isArray(marcasData)
    ? marcasData
    : marcasData?.results || [];
  const categoriasData = categorias || [];
  const subcategoriasData = subcategorias || [];

  const handleMarcaChange = (marcaId: number | null) => {
    setSelectedMarca(marcaId);
    setCurrentPage(1);
  };

  const handleCategoriaChange = (categoriaId: number | null) => {
    setSelectedCategoria(categoriaId);
    setSelectedSubCategoria(null); // Reset subcategoría al cambiar categoría
    setCurrentPage(1);
  };

  const handleSubCategoriaChange = (subCategoriaId: number | null) => {
    setSelectedSubCategoria(subCategoriaId);
    setCurrentPage(1);
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
    const producto = products.find((p) => p.id === productId);
    if (producto) {
      // Necesitamos obtener el producto completo desde la API
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"
          }/api/productos/${productId}/`,
        );
        const fullProducto = await response.json();
        setEditingProducto(fullProducto);
        setShowModal(true);
      } catch (error) {
        console.error("Error al cargar producto:", error);
      }
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
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
        height: "calc(100vh - 100px)",
      }}
    >
      <div style={{ flex: "0 0 auto" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">
            Productos {""}
            <Badge bg="secondary" pill>
              {data?.count || 0}
            </Badge>
          </h4>
          <div>
            {selectedProducts.length > 0 && (
              <Button
                variant="danger"
                size="sm"
                className="me-2"
                onClick={handleDeleteSelected}
              >
                <Trash size={16} className="me-1" />
                Eliminar seleccionados ({selectedProducts.length})
              </Button>
            )}
            <AddButton label="Producto" onClick={handleAddProduct} />
          </div>
        </div>

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
                  setCurrentPage(1);
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
              <th style={{ width: "120px" }}>Acciones</th>
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
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-1"
                    onClick={() => handleEditProduct(producto.id)}
                    title="Editar"
                  >
                    <PencilSquare size={16} />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteProduct(producto.id)}
                    title="Eliminar"
                  >
                    <Trash size={16} />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Paginación */}
      <div style={{ flex: "0 0 auto", marginTop: "auto" }}>
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={data?.count ?? 0}
          pageItems={products.length}
          itemLabel="producto(s)"
        />
      </div>

      {/* Modal de formulario */}
      <ProductoFormModal
        show={showModal}
        onHide={handleCloseModal}
        producto={editingProducto}
      />
    </div>
  );
};

export default ProductList;
