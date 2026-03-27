/**
 * @file PaginationBar.tsx
 * @description Componente reutilizable de paginación con leyenda de resultados.
 */
import React from "react";
import { Pagination } from "react-bootstrap";

/**
 * Props del componente PaginationBar.
 */
interface PaginationBarProps {
  /** Número de página actual (1-based). */
  currentPage: number;
  /** Total de páginas disponibles. */
  totalPages: number;
  /** Callback ejecutado al cambiar de página. */
  onPageChange: (page: number) => void;
  /** Cantidad total de ítems reportada por la API. */
  totalItems: number;
  /** Cantidad de ítems en la página actual. */
  pageItems: number;
  /** Etiqueta del tipo de ítem para la leyenda (ej: `"cliente(s)"`, `"producto(s)"`). */
  itemLabel: string;
}

/**
 * Barra de paginación reutilizable con leyenda "Mostrando X de Y".
 *
 * @remarks
 * Genera elipsis inteligentes cuando hay muchas páginas, mostrando siempre
 * la primera y la última. No renderiza nada si `totalPages <= 1`.
 *
 * @param props - Ver {@link PaginationBarProps}.
 *
 * @example
 * ```tsx
 * <PaginationBar
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 *   totalItems={data?.count ?? 0}
 *   pageItems={items.length}
 *   itemLabel="cliente(s)"
 * />
 * ```
 */
const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageItems,
  itemLabel,
}) => {
  if (totalPages <= 1) return null;

  /**
   * Genera el array de items de paginación con elipsis inteligentes.
   *
   * @returns Array de números de página intercalados con `"..."` donde corresponda.
   */
  const getPaginationItems = (): (number | string)[] => {
    const items: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) items.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) items.push(i);
        items.push("...");
        items.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        items.push(1);
        items.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) items.push(i);
      } else {
        items.push(1);
        items.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) items.push(i);
        items.push("...");
        items.push(totalPages);
      }
    }

    return items;
  };

  return (
    <div
      className="d-flex justify-content-between align-items-center mt-4 pt-3 pb-3"
      style={{ borderTop: "1px solid #dee2e6" }}
    >
      <div className="text-muted">
        Mostrando {pageItems} de {totalItems} {itemLabel}
      </div>
      <Pagination className="mb-0">
        <Pagination.First
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        />
        <Pagination.Prev
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {getPaginationItems().map((item, index) =>
          typeof item === "number" ? (
            <Pagination.Item
              key={index}
              active={item === currentPage}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Pagination.Item>
          ) : (
            <Pagination.Ellipsis key={index} disabled />
          ),
        )}
        <Pagination.Next
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    </div>
  );
};

export default PaginationBar;
