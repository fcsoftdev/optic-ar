/**
 * @file TurnoFormModal.tsx
 * @description Modal para crear y editar Turnos con búsqueda de clientes.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Alert, Button, Col, Form, Modal, Row, Spinner } from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import Select from "react-select";
import {
  useConfigCalendario,
  useCreateTurno,
  useDeleteTurno,
  useUpdateTurno,
} from "../hooks/useTurnos";
import { useClientes } from "../hooks/useVentas";
import { turnoSchema, type TurnoFormData } from "../schemas/turnoSchema";
import type { Turno } from "../services/turnos.service";

/** Props del componente TurnoFormModal. */
interface TurnoFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback al cerrar el modal. */
  onHide: () => void;
  /** Turno a editar. `null` o `undefined` para modo creación. */
  turno?: Turno | null;
  /** Fecha pre-cargada al crear desde un click en el calendario. */
  defaultFecha?: string;
  /** Hora pre-cargada al crear desde un click en el calendario. */
  defaultHora?: string;
}

/**
 * Modal de formulario para crear y editar Turnos.
 *
 * @remarks
 * Usa `react-hook-form` con validación Zod y `react-select` para
 * la búsqueda de clientes con autocomplete. En modo edición muestra
 * un botón para eliminar el turno.
 *
 * @param props - Ver {@link TurnoFormModalProps}.
 */
const TurnoFormModal: React.FC<TurnoFormModalProps> = ({
  show,
  onHide,
  turno,
  defaultFecha,
  defaultHora,
}) => {
  const isEditing = !!turno;
  const [searchCliente, setSearchCliente] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [selectedClienteOption, setSelectedClienteOption] = useState<{
    value: number;
    label: string;
  } | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TurnoFormData>({
    resolver: zodResolver(turnoSchema),
    defaultValues: {
      fecha: defaultFecha ?? new Date().toISOString().split("T")[0],
      hora_inicio: defaultHora ?? "09:00",
      cliente: 0,
      motivo: "",
      observaciones: "",
    },
  });

  const createTurno = useCreateTurno();
  const updateTurno = useUpdateTurno();
  const deleteTurno = useDeleteTurno();
  const { data: config } = useConfigCalendario();

  /**
   * Genera las opciones de hora de inicio disponibles según la configuración.
   * Los slots van desde hora_apertura hasta hora_cierre con pasos de duracion_turno_default.
   *
   * @returns Array de strings en formato "HH:MM".
   */
  const generarSlotsHora = (): string[] => {
    const apertura = config?.hora_apertura?.slice(0, 5) ?? "08:00";
    const cierre = config?.hora_cierre?.slice(0, 5) ?? "20:00";
    const duracion = config?.duracion_turno_default ?? 30;

    const slots: string[] = [];
    const [hA, mA] = apertura.split(":").map(Number);
    const [hC, mC] = cierre.split(":").map(Number);
    let minutos = hA * 60 + mA;
    const minutosMax = hC * 60 + mC;

    while (minutos < minutosMax) {
      const h = Math.floor(minutos / 60)
        .toString()
        .padStart(2, "0");
      const m = (minutos % 60).toString().padStart(2, "0");
      slots.push(`${h}:${m}`);
      minutos += duracion;
    }
    return slots;
  };

  const slotsHora = generarSlotsHora();

  /** Búsqueda de clientes con debounce mínimo (react-select filtra nativo). */
  const { data: clientesData, isLoading: loadingClientes } = useClientes({
    search: searchCliente || undefined,
    page_size: 50,
  });

  const opcionesClientes =
    clientesData?.results?.map((c) => ({
      value: c.id,
      label: `${c.apellido}, ${c.nombre}`,
    })) ?? [];

  useEffect(() => {
    setApiErrors([]);
    if (turno) {
      reset({
        fecha: turno.fecha,
        hora_inicio: turno.hora_inicio.slice(0, 5),
        cliente: turno.cliente,
        motivo: turno.motivo ?? "",
        observaciones: turno.observaciones ?? "",
      });
      setSelectedClienteOption({
        value: turno.cliente,
        label: turno.cliente_nombre,
      });
    } else {
      reset({
        fecha: defaultFecha ?? new Date().toISOString().split("T")[0],
        hora_inicio: defaultHora ?? "09:00",
        cliente: 0,
        motivo: "",
        observaciones: "",
      });
      setSelectedClienteOption(null);
    }
    setDeleteConfirm(false);
  }, [turno, defaultFecha, defaultHora, reset, show]);

  /**
   * Extrae mensajes de error de una respuesta DRF (400).
   *
   * @param error - Error capturado en el catch.
   * @returns Lista de mensajes legibles para el usuario.
   */
  const extraerMensajesError = (error: unknown): string[] => {
    if (!axios.isAxiosError(error))
      return ["Error inesperado. Intente nuevamente."];
    const data = error.response?.data;
    if (!data || typeof data !== "object")
      return ["Error al comunicarse con el servidor."];

    const mensajes: string[] = [];
    for (const [, valor] of Object.entries(data)) {
      const textos = Array.isArray(valor) ? valor : [String(valor)];
      for (const texto of textos) {
        mensajes.push(texto);
      }
    }
    return mensajes.length > 0
      ? mensajes
      : ["Error al guardar el turno. Verifique los datos."];
  };

  /**
   * Maneja el envío del formulario.
   *
   * @param data - Datos validados por Zod.
   */
  const onSubmit = async (data: TurnoFormData) => {
    setApiErrors([]);
    try {
      const payload = {
        ...data,
        motivo: data.motivo || null,
        observaciones: data.observaciones || null,
      };
      if (isEditing && turno) {
        await updateTurno.mutateAsync({ id: turno.id, data: payload });
      } else {
        await createTurno.mutateAsync(payload);
      }
      reset();
      onHide();
    } catch (error) {
      console.error("Error al guardar turno:", error);
      setApiErrors(extraerMensajesError(error));
    }
  };

  /** Elimina el turno tras confirmación. */
  const handleDelete = async () => {
    if (!turno) return;
    try {
      await deleteTurno.mutateAsync(turno.id);
      reset();
      onHide();
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      setDeleteConfirm(false);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setApiErrors(["No tenés permisos para eliminar turnos."]);
      } else {
        setApiErrors(["Error al eliminar el turno. Intente nuevamente."]);
      }
    }
  };

  const handleClose = () => {
    reset();
    setDeleteConfirm(false);
    setSelectedClienteOption(null);
    setApiErrors([]);
    onHide();
  };

  const isMutating =
    createTurno.isPending || updateTurno.isPending || deleteTurno.isPending;

  return (
    <Modal show={show} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>{isEditing ? "Editar Turno" : "Nuevo Turno"}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form onSubmit={handleSubmit(onSubmit)} id="turnoForm">
          <Row className="g-3">
            {/* Fecha */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Fecha <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="fecha"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      type="date"
                      isInvalid={!!errors.fecha}
                    />
                  )}
                />
                {errors.fecha && (
                  <Form.Control.Feedback type="invalid">
                    {errors.fecha.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Hora de inicio */}
            <Col md={6}>
              <Form.Group>
                <Form.Label>
                  Hora de inicio <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="hora_inicio"
                  control={control}
                  render={({ field }) => (
                    <Form.Select {...field} isInvalid={!!errors.hora_inicio}>
                      {slotsHora.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                      {/* Si la hora actual no está en los slots (turno existente), mostrarla igual */}
                      {field.value && !slotsHora.includes(field.value) && (
                        <option value={field.value}>{field.value}</option>
                      )}
                    </Form.Select>
                  )}
                />
                {errors.hora_inicio && (
                  <Form.Control.Feedback type="invalid">
                    {errors.hora_inicio.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Cliente */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label>
                  Cliente <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="cliente"
                  control={control}
                  render={({ field }) => (
                    <Select
                      inputId="select-cliente"
                      placeholder="Buscar cliente..."
                      isLoading={loadingClientes}
                      options={opcionesClientes}
                      onInputChange={(val) => setSearchCliente(val)}
                      value={selectedClienteOption}
                      onChange={(opt) => {
                        field.onChange(opt?.value ?? 0);
                        setSelectedClienteOption(opt ?? null);
                      }}
                      noOptionsMessage={() =>
                        searchCliente.length < 2
                          ? "Escribí al menos 2 letras"
                          : "Sin resultados"
                      }
                      classNames={{
                        control: () =>
                          errors.cliente ? "border border-danger rounded" : "",
                      }}
                    />
                  )}
                />
                {errors.cliente && (
                  <div className="text-danger small mt-1">
                    {errors.cliente.message}
                  </div>
                )}
              </Form.Group>
            </Col>

            {/* Motivo */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Motivo</Form.Label>
                <Controller
                  name="motivo"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      value={field.value ?? ""}
                      as="textarea"
                      rows={2}
                      placeholder="Motivo de la consulta (opcional)"
                      isInvalid={!!errors.motivo}
                    />
                  )}
                />
                {errors.motivo && (
                  <Form.Control.Feedback type="invalid">
                    {errors.motivo.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>

            {/* Observaciones */}
            <Col xs={12}>
              <Form.Group>
                <Form.Label>Observaciones</Form.Label>
                <Controller
                  name="observaciones"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      {...field}
                      value={field.value ?? ""}
                      as="textarea"
                      rows={2}
                      placeholder="Observaciones internas (opcional)"
                      isInvalid={!!errors.observaciones}
                    />
                  )}
                />
                {errors.observaciones && (
                  <Form.Control.Feedback type="invalid">
                    {errors.observaciones.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
            </Col>
          </Row>

          {apiErrors.length > 0 && (
            <Alert variant="danger" className="mt-3 mb-0">
              {apiErrors.length === 1 ? (
                apiErrors[0]
              ) : (
                <ul className="mb-0 ps-3">
                  {apiErrors.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </Alert>
          )}
        </Form>

        {/* Confirmación de eliminación inline */}
        {deleteConfirm && (
          <Alert variant="danger" className="mt-3 mb-0">
            <strong>¿Eliminar este turno?</strong> Esta acción no se puede
            deshacer.
            <div className="mt-2 d-flex gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={handleDelete}
                disabled={isMutating}
              >
                {deleteTurno.isPending ? (
                  <Spinner size="sm" animation="border" />
                ) : (
                  "Sí, eliminar"
                )}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setDeleteConfirm(false)}
              >
                Cancelar
              </Button>
            </div>
          </Alert>
        )}
      </Modal.Body>

      <Modal.Footer className="justify-content-between">
        {/* Botón eliminar (solo en edición) */}
        <div>
          {isEditing && !deleteConfirm && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setDeleteConfirm(true)}
              disabled={isMutating}
            >
              Eliminar turno
            </Button>
          )}
        </div>

        <div className="d-flex gap-2">
          <Button variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="turnoForm"
            disabled={isSubmitting || isMutating}
          >
            {isSubmitting
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear turno"}
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default TurnoFormModal;
