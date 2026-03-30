/**
 * @file ProveedorComprasModal.tsx
 * @description Modal que muestra el historial de compras de un proveedor.
 */
import React, { useState } from "react";
import { Alert, Badge, Button, Modal, Spinner, Table } from "react-bootstrap";
import { CartCheck } from "react-bootstrap-icons";
import { useCompras } from "../hooks/useCompras";
import type { Proveedor } from "../services/compras.service";
import PaginationBar from "./PaginationBar";

/**
 * Props del componente ProveedorComprasModal.
 */
interface ProveedorComprasModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Proveedor cuyas compras se muestran. */
  proveedor: Proveedor | null;
}

/**
 * Formatea un número en formato monetario argentino.
 *
 * @param valor - Número o string a formatear.
 * @returns Cadena con formato ARS. Ejemplo: "12.500,00".
 */
const fmtARS = (valor: number | string): string => {
  const n = Number(valor);
  return Number.isFinite(n)
    ? n.toLocaleString("es-AR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0,00";
};

/**
 * Modal que lista el historial de compras de un proveedor.
 *
 * @remarks
 * Carga las compras filtrando por `proveedor` usando el hook `useCompras`.
 * Incluye paginación para manejar proveedores con historial extenso.
 *
 * @param props - Ver {@link ProveedorComprasModalProps}.
 */
const ProveedorComprasModal: React.FC<ProveedorComprasModalProps> = ({
  show,
  onHide,
  proveedor,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useCompras({
    proveedor: proveedor?.id,
    page: currentPage,
    page_size: 10,
  });

  const compras = data?.results ?? [];
  const totalPages = data?.count ? Math.ceil(data.count / 10) : 1;

  /**
   * Cierra el modal y resetea la paginación.
   */
  const handleClose = () => {
    setCurrentPage(1);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          <CartCheck size={20} className="me-2 text-primary" />
          Compras — <span className="text-primary">
            {proveedor?.nombre}
          </span>{" "}
          <Badge bg="secondary" pill>
            {data?.count ?? 0}
          </Badge>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ minHeight: "300px" }}>
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Cargando compras...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            Error al cargar las compras: {(error as Error).message}
          </Alert>
        ) : compras.length === 0 ? (
          <Alert variant="info">
            Este proveedor no tiene compras registradas.
          </Alert>
        ) : (
          <>
            <Table striped bordered hover responsive size="sm">
              <thead className="table-secondary">
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th className="text-center">Ítems</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {compras.map((c) => (
                  <tr key={c.id}>
                    <td className="text-muted">{c.id}</td>
                    <td className="text-nowrap">
                      {new Date(c.fecha + "T00:00:00").toLocaleDateString(
                        "es-AR",
                      )}
                    </td>
                    <td className="text-center">
                      <Badge bg="info" text="dark">
                        {c.cantidad_items}
                      </Badge>
                    </td>
                    <td className="text-end fw-semibold">${fmtARS(c.total)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>

            <PaginationBar
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              totalItems={data?.count ?? 0}
              pageItems={compras.length}
              itemLabel="compra(s)"
            />
          </>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ProveedorComprasModal;
