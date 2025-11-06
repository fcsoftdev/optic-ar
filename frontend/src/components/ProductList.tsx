/**
 * @file ProductList.tsx
 * @description Componente que muestra un listado de productos mock en una tabla usando React-Bootstrap.
 */

import React, { useState, type JSX } from "react";
import { Button, Col, Dropdown, Form, Row, Table } from "react-bootstrap";
import { PencilSquare, Trash } from "react-bootstrap-icons";

/**
 * @interface Product
 * @description Define la estructura del objeto producto.
 */
interface Product {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  subCategoria: string;
  precio: number;
  stock: number;
}

/**
 * @constant mockProducts
 * @description Lista de productos mock para pruebas visuales.
 */
const mockProducts: Product[] = [
  {
    id: 1,
    codigo: "RB001",
    nombre: "Armazón Ray-Ban",
    categoria: "Armazones",
    subCategoria: "Armazones de plástico",
    precio: 45000,
    stock: 1,
  },
  {
    id: 2,
    codigo: "AC002",
    nombre: "Lentes de Contacto Acuvue",
    categoria: "Lentes",
    subCategoria: "Lentes desechables",
    precio: 18000,
    stock: 30,
  },
  {
    id: 3,
    codigo: "VG003",
    nombre: "Gafas de Sol Vogue",
    categoria: "Gafas de Sol",
    subCategoria: "Gafas de sol polarizadas",
    precio: 52000,
    stock: 8,
  },
  {
    id: 4,
    codigo: "OK004",
    nombre: "Armazón Oakley",
    categoria: "Armazones",
    subCategoria: "Armazones de metal",
    precio: 48000,
    stock: 5,
  },
];

/**
 * Determina la clase CSS de Bootstrap según el nivel de stock
 *
 * @param stock - Cantidad actual en inventario
 * @returns Clase CSS de Bootstrap o cadena vacía
 */
const obtenerClaseStock = (stock: number): string => {
  if (stock <= 1) {
    return "table-danger";
  } else if (stock >= 2 && stock <= 10) {
    return "table-warning";
  }
  return "";
};

/**
 * @component ProductList
 * @description Renderiza una tabla con productos mockeados.
 * @returns {JSX.Element} Tabla con información de productos.
 */
const ProductList: React.FC = (): JSX.Element => {
  const [selectedFilter, setSelectedFilter] = useState("Todas las categorías");
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);

  /**
   * Maneja la selección/deselección de todos los productos
   */
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedProducts(products.map((p) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  /**
   * Maneja la selección/deselección de un producto individual
   */
  const handleSelectProduct = (productId: number) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  /**
   * Elimina un producto individual
   */
  const handleDeleteProduct = (productId: number) => {
    setProducts(products.filter((p) => p.id !== productId));
    setSelectedProducts(selectedProducts.filter((id) => id !== productId));
  };

  /**
   * Elimina los productos seleccionados
   */
  const handleDeleteSelected = () => {
    setProducts(products.filter((p) => !selectedProducts.includes(p.id)));
    setSelectedProducts([]);
  };

  /**
   * Abre el modal de edición (placeholder)
   */
  const handleEditProduct = (productId: number) => {
    console.log("Editar producto:", productId);
    // TODO: Abrir modal de edición
  };

  /**
   * Abre el modal de agregar producto (placeholder)
   */
  const handleAddProduct = () => {
    console.log("Agregar nuevo producto");
    // TODO: Abrir modal de agregar producto
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Listado de Productos</h5>
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
          <Button variant="success" size="sm" onClick={handleAddProduct}>
            + Agregar Producto
          </Button>
        </div>
      </div>

      <Form className="mb-3">
        <Row className="g-2 align-items-center">
          <Col xs={12} md={4}>
            <Form.Control type="text" placeholder="Buscar producto..." />
          </Col>
          <Col xs={12} md={4}>
            <Dropdown>
              <Dropdown.Toggle variant="outline-secondary" className="w-100">
                {selectedFilter}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Todas las categorías")}
                >
                  Todas las categorías
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Armazones")}
                  className="fw-bold"
                >
                  Armazones
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Armazones de plástico")}
                  className="ps-4"
                >
                  Armazones de plástico
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Armazones de metal")}
                  className="ps-4"
                >
                  Armazones de metal
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Lentes")}
                  className="fw-bold"
                >
                  Lentes
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Lentes desechables")}
                  className="ps-4"
                >
                  Lentes desechables
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Gafas de Sol")}
                  className="fw-bold"
                >
                  Gafas de Sol
                </Dropdown.Item>
                <Dropdown.Item
                  onClick={() => setSelectedFilter("Gafas de sol polarizadas")}
                  className="ps-4"
                >
                  Gafas de sol polarizadas
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
          <Col xs="auto">
            <Button variant="primary" type="submit">
              Buscar
            </Button>
          </Col>
        </Row>
      </Form>

      <div style={{ overflowX: "auto", width: "100%" }}>
        <Table striped bordered hover style={{ minWidth: "800px" }}>
          <thead>
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
                <td>{producto.categoria}</td>
                <td>{producto.subCategoria}</td>
                <td>${producto.precio.toLocaleString()}</td>
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
    </>
  );
};

export default ProductList;
