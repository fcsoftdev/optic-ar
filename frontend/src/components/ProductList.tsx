/**
 * @file ProductList.tsx
 * @description Componente que muestra un listado de productos mock en una tabla usando React-Bootstrap.
 */

import React, { type JSX } from "react";
import { Table, Card } from "react-bootstrap";

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
  return (
    <>
      <h5 className="mb-3">Listado de Productos</h5>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            <th>#</th>
            <th>Código</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Subcategoría</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {mockProducts.map((producto) => (
            <tr key={producto.id} className={obtenerClaseStock(producto.stock)}>
              <td>{producto.id}</td>
              <td>{producto.codigo}</td>
              <td>{producto.nombre}</td>
              <td>{producto.categoria}</td>
              <td>{producto.subCategoria}</td>
              <td>${producto.precio.toLocaleString()}</td>
              <td>{producto.stock}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </>
  );
};

export default ProductList;
