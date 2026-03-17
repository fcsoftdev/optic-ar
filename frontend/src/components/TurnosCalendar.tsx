/**
 * @file TurnosCalendar.tsx
 * @description Calendario de Turnos con FullCalendar — ABM completo con drag & drop.
 */
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import type {
  DatesSetArg,
  EventClickArg,
  EventDropArg,
} from "@fullcalendar/core";
import esLocale from "@fullcalendar/core/locales/es";
import { useState } from "react";
import { Alert, Button, Spinner } from "react-bootstrap";
import { GearFill } from "react-bootstrap-icons";
import {
  useConfigCalendario,
  useTurnos,
  useUpdateTurno,
} from "../hooks/useTurnos";
import type { Turno } from "../services/turnos.service";
import ConfigCalendarioModal from "./ConfigCalendarioModal";
import TurnoFormModal from "./TurnoFormModal";

/** Convierte fecha y hora string a ISO datetime para FullCalendar. */
const toISO = (fecha: string, hora: string): string => `${fecha}T${hora}`;

/**
 * Convierte minutos a formato de duración esperado por FullCalendar.
 *
 * @param minutos - Duración en minutos.
 * @returns String con formato "HH:MM:SS".
 */
const toSlotDuration = (minutos: number): string => {
  const h = Math.floor(minutos / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutos % 60).toString().padStart(2, "0");
  return `${h}:${m}:00`;
};

/**
 * Componente principal del calendario de Turnos.
 *
 * @remarks
 * - Vista por defecto: `timeGridWeek` (semana con franjas horarias).
 * - Drag & drop habilitado: `eventDrop` y `eventResize` llaman al PATCH de la API.
 * - `dateClick` abre el modal de creación con fecha/hora pre-cargada.
 * - `eventClick` abre el modal de edición.
 * - El rango de fechas visible se actualiza dinámicamente vía `datesSet`.
 */
function TurnosCalendar() {
  const [rangoFechas, setRangoFechas] = useState<{
    start: string;
    end: string;
  } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingTurno, setEditingTurno] = useState<Turno | null>(null);
  const [defaultFecha, setDefaultFecha] = useState<string | undefined>();
  const [defaultHora, setDefaultHora] = useState<string | undefined>();
  const [dragError, setDragError] = useState<string | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const { data: config } = useConfigCalendario();

  /** Valores dinámicos del calendario derivados de la configuración activa. */
  const slotMin = config?.hora_apertura ?? "08:00:00";
  const slotMax = config?.hora_cierre ?? "20:00:00";
  const slotDuration = config
    ? toSlotDuration(config.duracion_turno_default)
    : "00:30:00";
  const businessHours = config
    ? {
        daysOfWeek: config.dias_laborables,
        startTime: config.hora_apertura.slice(0, 5),
        endTime: config.hora_cierre.slice(0, 5),
      }
    : undefined;

  /**
   * Verifica si una fecha es un día laborable según la configuración activa.
   * Usa mediodía local para evitar desfases de zona horaria.
   *
   * @param fechaStr - Fecha en formato YYYY-MM-DD.
   * @returns `true` si el día está en la lista de días laborables.
   */
  const esDiaLaborable = (fechaStr: string): boolean => {
    if (!config?.dias_laborables?.length) return true;
    // getDay() devuelve 0=Dom...6=Sáb, igual que la convención de FullCalendar
    const diaSemana = new Date(`${fechaStr}T12:00:00`).getDay();
    return config.dias_laborables.includes(diaSemana);
  };

  const {
    data: turnos = [],
    isLoading,
    error,
  } = useTurnos(
    rangoFechas
      ? { start: rangoFechas.start, end: rangoFechas.end }
      : undefined,
  );
  const updateTurno = useUpdateTurno();

  /**
   * Se dispara cuando FullCalendar cambia el rango visible.
   * Actualiza los parámetros de la query para cargar los turnos del rango.
   *
   * @param arg - Datos del rango visible actual.
   */
  const handleDatesSet = (arg: DatesSetArg) => {
    setRangoFechas({
      start: arg.startStr.slice(0, 10),
      end: arg.endStr.slice(0, 10),
    });
  };

  /**
   * Click en una celda vacía del calendario: abre modal de creación
   * con fecha y hora pre-cargadas.
   *
   * @param arg - Datos del slot clickeado.
   */
  const handleDateClick = (arg: DateClickArg) => {
    const fecha = arg.dateStr.slice(0, 10);
    if (!esDiaLaborable(fecha)) {
      setDragError("Este día no es laborable. Seleccione un día hábil.");
      return;
    }
    const hora = arg.dateStr.length > 10 ? arg.dateStr.slice(11, 16) : "09:00";
    setDragError(null);
    setEditingTurno(null);
    setDefaultFecha(fecha);
    setDefaultHora(hora);
    setShowModal(true);
  };

  /**
   * Click en un evento existente: abre modal de edición.
   *
   * @param arg - Datos del evento clickeado.
   */
  const handleEventClick = (arg: EventClickArg) => {
    const turnoId = parseInt(arg.event.id, 10);
    const turno = turnos.find((t) => t.id === turnoId);
    if (turno) {
      setEditingTurno(turno);
      setDefaultFecha(undefined);
      setDefaultHora(undefined);
      setShowModal(true);
    }
  };

  /**
   * Drag & drop de un evento: actualiza fecha y hora del turno vía PATCH.
   *
   * @param arg - Datos del evento desplazado.
   */
  const handleEventDrop = async (arg: EventDropArg) => {
    const turnoId = parseInt(arg.event.id, 10);
    const start = arg.event.start;
    if (!start) return;
    const fecha = start.toISOString().slice(0, 10);
    const hoy = new Date().toISOString().slice(0, 10);
    if (fecha < hoy) {
      arg.revert();
      setDragError("No se puede mover un turno a una fecha pasada.");
      return;
    }
    if (!esDiaLaborable(fecha)) {
      arg.revert();
      setDragError("No se puede mover un turno a un día no laborable.");
      return;
    }
    const hora_inicio = start.toTimeString().slice(0, 5);
    setDragError(null);
    try {
      await updateTurno.mutateAsync({
        id: turnoId,
        data: { fecha, hora_inicio },
      });
    } catch {
      arg.revert();
    }
  };

  /**
   * Resize de un evento: actualiza hora_fin del turno vía PATCH.
   *
   * @param arg - Datos del evento redimensionado.
   */
  const handleEventResize = async (arg: EventResizeDoneArg) => {
    const turnoId = parseInt(arg.event.id, 10);
    const end = arg.event.end;
    if (!end) return;
    const hora_fin = end.toTimeString().slice(0, 5);
    try {
      await updateTurno.mutateAsync({ id: turnoId, data: { hora_fin } });
    } catch {
      arg.revert();
    }
  };

  /** Convierte los turnos de la API al formato de eventos de FullCalendar. */
  const eventos = turnos.map((t) => ({
    id: String(t.id),
    title: t.cliente_nombre + (t.motivo ? ` — ${t.motivo}` : ""),
    start: toISO(t.fecha, t.hora_inicio),
    end: t.hora_fin ? toISO(t.fecha, t.hora_fin) : undefined,
    color: "#417690",
  }));

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Turnos</h4>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setShowConfigModal(true)}
          title="Configurar calendario"
        >
          <GearFill className="me-1" />
          Configurar
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          Error al cargar los turnos.
        </Alert>
      )}

      {dragError && (
        <Alert
          variant="warning"
          className="mb-3"
          dismissible
          onClose={() => setDragError(null)}
        >
          {dragError}
        </Alert>
      )}

      {isLoading && (
        <div className="d-flex align-items-center gap-2 mb-2 text-muted small">
          <Spinner size="sm" animation="border" />
          Cargando turnos...
        </div>
      )}

      <FullCalendar
        key={`${slotMin}-${slotMax}-${slotDuration}`}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        locale={esLocale}
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay",
        }}
        buttonText={{
          today: "Hoy",
          month: "Mes",
          week: "Semana",
          day: "Día",
        }}
        slotMinTime={slotMin}
        slotMaxTime={slotMax}
        allDaySlot={false}
        slotDuration={slotDuration}
        height="auto"
        events={eventos}
        editable={true}
        selectable={true}
        businessHours={businessHours}
        eventAllow={(dropInfo) => {
          const fecha = dropInfo.start.toISOString().slice(0, 10);
          const hoy = new Date().toISOString().slice(0, 10);
          if (fecha < hoy) return false;
          return esDiaLaborable(fecha);
        }}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        datesSet={handleDatesSet}
        eventTimeFormat={{
          hour: "2-digit",
          minute: "2-digit",
          meridiem: false,
          hour12: false,
        }}
      />

      <TurnoFormModal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingTurno(null);
        }}
        turno={editingTurno}
        defaultFecha={defaultFecha}
        defaultHora={defaultHora}
      />

      <ConfigCalendarioModal
        show={showConfigModal}
        onHide={() => setShowConfigModal(false)}
      />
    </div>
  );
}

export default TurnosCalendar;
