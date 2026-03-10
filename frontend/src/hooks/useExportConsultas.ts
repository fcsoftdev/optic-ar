/**
 * @file useExportConsultas.ts
 * @description Hook para exportar el historial de consultas de un paciente a PDF, Excel o CSV.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ventasService from "../services/ventas.service";
import type { ClienteList, Graduacion } from "../services/ventas.service";

/**
 * Obtiene todas las consultas de un cliente sin paginar (para exportación).
 *
 * @param clienteId - ID del cliente.
 * @returns Array completo de consultas del cliente.
 */
const fetchTodasLasConsultas = async (clienteId: number) => {
  const response = await ventasService.getConsultas({
    cliente: clienteId,
    page_size: 9999,
  });
  return response.results;
};

/**
 * Formatea una fecha ISO a formato legible en español.
 *
 * @param fecha - Fecha en formato ISO (YYYY-MM-DD).
 * @returns Fecha formateada como DD/MM/YYYY.
 */
const formatearFecha = (fecha: string): string =>
  new Date(fecha).toLocaleDateString("es-AR");

/**
 * Formatea un valor de graduación con signo.
 *
 * @param val - Valor numérico o nulo.
 * @returns Cadena con signo (ej: "+1.50", "-0.75") o "-" si es nulo.
 */
const fmtVal = (val?: number | string | null): string => {
  if (val == null || val === "") return "-";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2);
};

/**
 * Formatea los datos de un ojo (esférico / cilíndrico / eje) en una sola celda.
 * Ejemplo: "+1.50 / -0.75 / 90°"
 *
 * @param esf - Esférico.
 * @param cil - Cilíndrico.
 * @param eje - Eje en grados.
 * @returns Cadena de texto con los tres valores o "-" si no hay datos.
 */
const fmtOjo = (
  esf?: number | null,
  cil?: number | null,
  eje?: number | null,
): string => {
  if (esf == null && cil == null && eje == null) return "-";
  return `${fmtVal(esf)} / ${fmtVal(cil)} / ${eje != null ? `${eje}°` : "-"}`;
};

/**
 * Devuelve las cuatro filas de graduación de una consulta formateadas.
 * [OD Lejos, OI Lejos, OD Cerca, OI Cerca]
 */
const gradCeldas = (g?: Graduacion | null): string[] => {
  if (!g) return ["-", "-", "-", "-"];
  return [
    fmtOjo(g.od_lejos_esferico, g.od_lejos_cilindrico, g.od_lejos_eje),
    fmtOjo(g.oi_lejos_esferico, g.oi_lejos_cilindrico, g.oi_lejos_eje),
    fmtOjo(g.od_cerca_esferico, g.od_cerca_cilindrico, g.od_cerca_eje),
    fmtOjo(g.oi_cerca_esferico, g.oi_cerca_cilindrico, g.oi_cerca_eje),
  ];
};

/**
 * Hook con funciones para exportar el historial de consultas de un paciente.
 *
 * @remarks
 * Descarga todos los registros (no solo la página visible) antes de exportar.
 * Soporta tres formatos: PDF (A4 landscape), Excel (.xlsx) y CSV.
 *
 * @returns Objeto con los métodos `exportarPDF`, `exportarExcel` y `exportarCSV`.
 *
 * @example
 * ```tsx
 * const { exportarPDF, exportarExcel, exportarCSV } = useExportConsultas();
 * await exportarPDF(cliente);
 * ```
 */
const useExportConsultas = () => {
  /**
   * Exporta el historial de consultas a un archivo PDF (A4 landscape).
   * Incluye columnas de graduación (OD/OI × Lejos/Cerca) con Esf/Cil/Eje.
   *
   * @param cliente - Cliente/paciente cuyas consultas se exportan.
   */
  const exportarPDF = async (cliente: ClienteList): Promise<void> => {
    const consultas = await fetchTodasLasConsultas(cliente.id);

    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(14);
    doc.text(
      `Historial de Consultas - ${cliente.apellido}, ${cliente.nombre}`,
      14,
      16,
    );
    doc.setFontSize(10);
    doc.text(`DNI: ${cliente.dni}`, 14, 23);
    doc.text(`Generado: ${new Date().toLocaleDateString("es-AR")}`, 14, 29);
    doc.setFontSize(8);
    doc.text(
      "Graduación: Esférico / Cilíndrico / Eje  —  OD = Ojo Derecho  |  OI = Ojo Izquierdo",
      14,
      35,
    );

    autoTable(doc, {
      startY: 40,
      head: [
        [
          "Fecha",
          "Motivo",
          "Diagnóstico",
          "OD Lejos\n(Esf / Cil / Eje)",
          "OI Lejos\n(Esf / Cil / Eje)",
          "OD Cerca\n(Esf / Cil / Eje)",
          "OI Cerca\n(Esf / Cil / Eje)",
        ],
      ],
      body: consultas.map((c) => {
        const [odL, oiL, odC, oiC] = gradCeldas(c.graduacion);
        return [
          formatearFecha(c.fecha),
          c.motivo,
          c.diagnostico || "-",
          odL,
          oiL,
          odC,
          oiC,
        ];
      }),
      styles: { fontSize: 8, cellPadding: 2.5 },
      headStyles: { fillColor: [52, 100, 180], fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 245, 255] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 50 },
        2: { cellWidth: 50 },
        3: { cellWidth: 38 },
        4: { cellWidth: 38 },
        5: { cellWidth: 38 },
        6: { cellWidth: 38 },
      },
    });

    doc.save(`consultas_${cliente.apellido}_${cliente.nombre}.pdf`);
  };

  /**
   * Exporta el historial de consultas a un archivo Excel (.xlsx).
   * Incluye columnas individuales para cada campo de graduación.
   *
   * @param cliente - Cliente/paciente cuyas consultas se exportan.
   */
  const exportarExcel = async (cliente: ClienteList): Promise<void> => {
    const consultas = await fetchTodasLasConsultas(cliente.id);

    const filas = consultas.map((c) => {
      const g = c.graduacion;
      return {
        Fecha: formatearFecha(c.fecha),
        Motivo: c.motivo,
        Diagnóstico: c.diagnostico || "",
        // OD Lejos
        "OD L. Esf.": g?.od_lejos_esferico ?? "",
        "OD L. Cil.": g?.od_lejos_cilindrico ?? "",
        "OD L. Eje": g?.od_lejos_eje ?? "",
        // OI Lejos
        "OI L. Esf.": g?.oi_lejos_esferico ?? "",
        "OI L. Cil.": g?.oi_lejos_cilindrico ?? "",
        "OI L. Eje": g?.oi_lejos_eje ?? "",
        // OD Cerca
        "OD C. Esf.": g?.od_cerca_esferico ?? "",
        "OD C. Cil.": g?.od_cerca_cilindrico ?? "",
        "OD C. Eje": g?.od_cerca_eje ?? "",
        // OI Cerca
        "OI C. Esf.": g?.oi_cerca_esferico ?? "",
        "OI C. Cil.": g?.oi_cerca_cilindrico ?? "",
        "OI C. Eje": g?.oi_cerca_eje ?? "",
      };
    });

    const hoja = XLSX.utils.json_to_sheet(filas);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Consultas");

    // Ancho de columnas: fecha, motivo, diagnóstico + 12 col. graduación
    hoja["!cols"] = [
      { wch: 12 },
      { wch: 45 },
      { wch: 45 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
      { wch: 10 },
      { wch: 10 },
      { wch: 8 },
    ];

    XLSX.writeFile(
      libro,
      `consultas_${cliente.apellido}_${cliente.nombre}.xlsx`,
    );
  };

  /**
   * Exporta el historial de consultas a un archivo CSV.
   * Incluye columnas individuales para cada campo de graduación.
   *
   * @param cliente - Cliente/paciente cuyas consultas se exportan.
   */
  const exportarCSV = async (cliente: ClienteList): Promise<void> => {
    const consultas = await fetchTodasLasConsultas(cliente.id);

    const filas = consultas.map((c) => {
      const g = c.graduacion;
      return {
        Fecha: formatearFecha(c.fecha),
        Motivo: c.motivo,
        Diagnóstico: c.diagnostico || "",
        "OD L. Esf.": g?.od_lejos_esferico ?? "",
        "OD L. Cil.": g?.od_lejos_cilindrico ?? "",
        "OD L. Eje": g?.od_lejos_eje ?? "",
        "OI L. Esf.": g?.oi_lejos_esferico ?? "",
        "OI L. Cil.": g?.oi_lejos_cilindrico ?? "",
        "OI L. Eje": g?.oi_lejos_eje ?? "",
        "OD C. Esf.": g?.od_cerca_esferico ?? "",
        "OD C. Cil.": g?.od_cerca_cilindrico ?? "",
        "OD C. Eje": g?.od_cerca_eje ?? "",
        "OI C. Esf.": g?.oi_cerca_esferico ?? "",
        "OI C. Cil.": g?.oi_cerca_cilindrico ?? "",
        "OI C. Eje": g?.oi_cerca_eje ?? "",
      };
    });

    const hoja = XLSX.utils.json_to_sheet(filas);
    const csv = XLSX.utils.sheet_to_csv(hoja);

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `consultas_${cliente.apellido}_${cliente.nombre}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return { exportarPDF, exportarExcel, exportarCSV };
};

export default useExportConsultas;
