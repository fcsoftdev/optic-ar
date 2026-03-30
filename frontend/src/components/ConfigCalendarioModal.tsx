/**
 * @file ConfigCalendarioModal.tsx
 * @description Modal para editar la configuración del calendario de turnos.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Col,
  Form,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";
import { Controller, useForm } from "react-hook-form";
import {
  useConfigCalendario,
  useUpdateConfigCalendario,
} from "../hooks/useTurnos";
import {
  configCalendarioSchema,
  type ConfigCalendarioFormData,
} from "../schemas/turnoSchema";

/** Etiquetas de días de la semana (FullCalendar: 0=Dom...6=Sáb). */
const DIAS_SEMANA = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

/** Opciones de duración disponibles en minutos. */
const DURACIONES = [15, 20, 30, 45, 60, 90, 120];

/** Props del componente ConfigCalendarioModal. */
interface ConfigCalendarioModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback al cerrar el modal. */
  onHide: () => void;
}

/**
 * Modal para configurar los parámetros del calendario de turnos.
 *
 * @remarks
 * Permite editar horario de apertura/cierre, duración de los turnos
 * y los días laborables. Usa el endpoint `/api/configuracion-calendario/activa/`.
 *
 * @param props - Ver {@link ConfigCalendarioModalProps}.
 */
const ConfigCalendarioModal: React.FC<ConfigCalendarioModalProps> = ({
  show,
  onHide,
}) => {
  const { data: config, isLoading } = useConfigCalendario();
  const updateConfig = useUpdateConfigCalendario();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ConfigCalendarioFormData>({
    resolver: zodResolver(configCalendarioSchema),
    defaultValues: {
      hora_apertura: "09:00",
      hora_cierre: "18:00",
      duracion_turno_default: 30,
      dias_laborables: [1, 2, 3, 4, 5],
    },
  });

  /** Precarga el formulario cuando se obtiene la configuración. */
  useEffect(() => {
    if (config) {
      reset({
        hora_apertura: config.hora_apertura.slice(0, 5),
        hora_cierre: config.hora_cierre.slice(0, 5),
        duracion_turno_default: config.duracion_turno_default,
        dias_laborables: config.dias_laborables,
      });
    }
  }, [config, reset, show]);

  /**
   * Envía los cambios de configuración al backend.
   *
   * @param data - Datos validados por Zod.
   */
  const onSubmit = async (data: ConfigCalendarioFormData) => {
    setApiError(null);
    try {
      await updateConfig.mutateAsync({
        hora_apertura: `${data.hora_apertura}:00`,
        hora_cierre: `${data.hora_cierre}:00`,
        duracion_turno_default: data.duracion_turno_default,
        dias_laborables: data.dias_laborables,
      });
      onHide();
    } catch (error) {
      console.error("Error al guardar configuración:", error);
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        setApiError(
          "No tenés permisos para modificar la configuración del calendario.",
        );
      } else {
        setApiError("Error al guardar la configuración. Intente nuevamente.");
      }
    }
  };

  const diasSeleccionados = watch("dias_laborables") ?? [];

  return (
    <Modal show={show} onHide={onHide} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Configuración del Calendario</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {isLoading ? (
          <div className="d-flex justify-content-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <Form onSubmit={handleSubmit(onSubmit)} id="configCalendarioForm">
            <Row className="g-3">
              {/* Hora de apertura */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Hora de apertura <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="hora_apertura"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="time"
                        isInvalid={!!errors.hora_apertura}
                      />
                    )}
                  />
                  {errors.hora_apertura && (
                    <Form.Control.Feedback type="invalid">
                      {errors.hora_apertura.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              {/* Hora de cierre */}
              <Col md={6}>
                <Form.Group>
                  <Form.Label>
                    Hora de cierre <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="hora_cierre"
                    control={control}
                    render={({ field }) => (
                      <Form.Control
                        {...field}
                        type="time"
                        isInvalid={!!errors.hora_cierre}
                      />
                    )}
                  />
                  {errors.hora_cierre && (
                    <Form.Control.Feedback type="invalid">
                      {errors.hora_cierre.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              {/* Duración por turno */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>
                    Duración del turno (min){" "}
                    <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="duracion_turno_default"
                    control={control}
                    render={({ field }) => (
                      <Form.Select
                        {...field}
                        value={field.value}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value, 10))
                        }
                        isInvalid={!!errors.duracion_turno_default}
                      >
                        {DURACIONES.map((min) => (
                          <option key={min} value={min}>
                            {min} minutos
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  />
                  {errors.duracion_turno_default && (
                    <Form.Control.Feedback type="invalid">
                      {errors.duracion_turno_default.message}
                    </Form.Control.Feedback>
                  )}
                </Form.Group>
              </Col>

              {/* Días laborables */}
              <Col xs={12}>
                <Form.Group>
                  <Form.Label>
                    Días laborables <span className="text-danger">*</span>
                  </Form.Label>
                  <Controller
                    name="dias_laborables"
                    control={control}
                    render={({ field }) => (
                      <div className="d-flex flex-wrap gap-2 mt-1">
                        {DIAS_SEMANA.map((dia) => {
                          const seleccionado = field.value?.includes(dia.value);
                          return (
                            <Badge
                              key={dia.value}
                              role="button"
                              bg={seleccionado ? "primary" : "secondary"}
                              className="fs-6 px-3 py-2"
                              style={{ cursor: "pointer", userSelect: "none" }}
                              onClick={() => {
                                const actuales = field.value ?? [];
                                if (seleccionado) {
                                  field.onChange(
                                    actuales.filter((d) => d !== dia.value),
                                  );
                                } else {
                                  field.onChange(
                                    [...actuales, dia.value].sort(),
                                  );
                                }
                              }}
                            >
                              {dia.label}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  />
                  {errors.dias_laborables && (
                    <div className="text-danger small mt-1">
                      {errors.dias_laborables.message}
                    </div>
                  )}
                  <Form.Text className="text-muted">
                    {diasSeleccionados.length} día
                    {diasSeleccionados.length !== 1 ? "s" : ""} seleccionado
                    {diasSeleccionados.length !== 1 ? "s" : ""}
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>

            {apiError && (
              <Alert variant="danger" className="mt-3 mb-0">
                {apiError}
              </Alert>
            )}
          </Form>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          type="submit"
          form="configCalendarioForm"
          disabled={isSubmitting || updateConfig.isPending || isLoading}
        >
          {updateConfig.isPending ? (
            <>
              <Spinner size="sm" animation="border" className="me-1" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfigCalendarioModal;
