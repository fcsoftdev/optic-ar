/**
 * @file ConsultationFormModal.tsx
 * @description Modal de formulario para crear y editar Consultas médicas con Graduación.
 */
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Col,
  Collapse,
  Form,
  Modal,
  Row,
  Table,
} from "react-bootstrap";
import { ChevronDown, ChevronUp } from "react-bootstrap-icons";
import { Controller, useForm } from "react-hook-form";
import {
  useConsulta,
  useCreateConsulta,
  useUpdateConsulta,
} from "../hooks/useVentas";
import {
  consultaSchema,
  type ConsultaFormData,
} from "../schemas/consultaSchema";
import type { ConsultaList } from "../services/ventas.service";
import SearchableSelect from "./SearchableSelect";

/**
 * Props del componente ConsultationFormModal.
 */
interface ConsultationFormModalProps {
  /** Controla la visibilidad del modal. */
  show: boolean;
  /** Callback ejecutado al cerrar el modal. */
  onHide: () => void;
  /** Opciones del selector de clientes. */
  clienteOptions: { value: number; label: string }[];
  /** Consulta a editar. Si es `null` o `undefined`, opera en modo creación. */
  consulta?: ConsultaList | null;
}

/**
 * Modal de formulario para crear y editar Consultas médicas.
 *
 * @remarks
 * En modo edición realiza un fetch completo de la consulta por ID para obtener
 * la graduación anidada. La sección de graduación es colapsable; se abre
 * automáticamente si la consulta ya tiene graduación registrada.
 *
 * @param props - Ver {@link ConsultationFormModalProps}.
 */
const ConsultationFormModal: React.FC<ConsultationFormModalProps> = ({
  show,
  onHide,
  clienteOptions,
  consulta,
}) => {
  const isEditing = !!consulta;
  const [showGraduacion, setShowGraduacion] = useState(false);

  const { data: consultaCompleta } = useConsulta(consulta?.id ?? 0);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema) as any,
    defaultValues: {
      cliente: undefined,
      fecha: new Date().toISOString().split("T")[0],
      motivo: "",
      diagnostico: "",
      tratamiento: "",
      graduacion: null,
    },
  });

  const createConsulta = useCreateConsulta();
  const updateConsulta = useUpdateConsulta();

  // Precarga los datos en modo edición
  useEffect(() => {
    if (consulta && consultaCompleta) {
      const grad = consultaCompleta.graduacion;
      if (grad) setShowGraduacion(true);
      reset({
        cliente: consultaCompleta.cliente,
        fecha: consultaCompleta.fecha,
        motivo: consultaCompleta.motivo,
        diagnostico: consultaCompleta.diagnostico || "",
        tratamiento: consultaCompleta.tratamiento || "",
        graduacion: grad
          ? {
              od_lejos_esferico: grad.od_lejos_esferico ?? null,
              od_lejos_cilindrico: grad.od_lejos_cilindrico ?? null,
              od_lejos_eje: grad.od_lejos_eje ?? null,
              oi_lejos_esferico: grad.oi_lejos_esferico ?? null,
              oi_lejos_cilindrico: grad.oi_lejos_cilindrico ?? null,
              oi_lejos_eje: grad.oi_lejos_eje ?? null,
              od_cerca_esferico: grad.od_cerca_esferico ?? null,
              od_cerca_cilindrico: grad.od_cerca_cilindrico ?? null,
              od_cerca_eje: grad.od_cerca_eje ?? null,
              oi_cerca_esferico: grad.oi_cerca_esferico ?? null,
              oi_cerca_cilindrico: grad.oi_cerca_cilindrico ?? null,
              oi_cerca_eje: grad.oi_cerca_eje ?? null,
            }
          : null,
      });
    } else if (!consulta) {
      setShowGraduacion(false);
      reset({
        cliente: undefined,
        fecha: new Date().toISOString().split("T")[0],
        motivo: "",
        diagnostico: "",
        tratamiento: "",
        graduacion: null,
      });
    }
  }, [consulta, consultaCompleta, reset]);

  /**
   * Maneja el envío del formulario: crea o actualiza la consulta.
   *
   * @param data - Datos validados por Zod del formulario.
   */
  const onSubmit = async (data: ConsultaFormData) => {
    try {
      const submitData = {
        ...data,
        diagnostico: data.diagnostico || undefined,
        tratamiento: data.tratamiento || undefined,
        graduacion: showGraduacion ? data.graduacion : null,
      };

      if (isEditing) {
        await updateConsulta.mutateAsync({ id: consulta.id, data: submitData });
      } else {
        await createConsulta.mutateAsync(submitData);
      }

      handleClose();
    } catch (error) {
      console.error("Error al guardar consulta:", error);
    }
  };

  /**
   * Cierra el modal y resetea el formulario.
   */
  const handleClose = () => {
    reset();
    setShowGraduacion(false);
    onHide();
  };

  /**
   * Renderiza una fila de la tabla de graduación con tres campos.
   *
   * @param label - Etiqueta de la fila (ej: "OD Lejos").
   * @param esfField - Nombre del campo esférico en el form.
   * @param cilField - Nombre del campo cilíndrico en el form.
   * @param ejeField - Nombre del campo eje en el form.
   */
  const GraduacionRow = ({
    label,
    esfField,
    cilField,
    ejeField,
  }: {
    label: string;
    esfField: string;
    cilField: string;
    ejeField: string;
  }) => (
    <tr>
      <td className="fw-semibold align-middle text-nowrap">{label}</td>
      <td>
        <Controller
          name={`graduacion.${esfField}` as any}
          control={control}
          render={({ field }) => (
            <Form.Control
              type="number"
              step="0.25"
              size="sm"
              placeholder="0.00"
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? null : parseFloat(e.target.value),
                )
              }
            />
          )}
        />
      </td>
      <td>
        <Controller
          name={`graduacion.${cilField}` as any}
          control={control}
          render={({ field }) => (
            <Form.Control
              type="number"
              step="0.25"
              size="sm"
              placeholder="0.00"
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? null : parseFloat(e.target.value),
                )
              }
            />
          )}
        />
      </td>
      <td>
        <Controller
          name={`graduacion.${ejeField}` as any}
          control={control}
          render={({ field }) => (
            <Form.Control
              type="number"
              step="1"
              min="0"
              max="180"
              size="sm"
              placeholder="0"
              value={field.value ?? ""}
              onChange={(e) =>
                field.onChange(
                  e.target.value === "" ? null : parseInt(e.target.value, 10),
                )
              }
            />
          )}
        />
      </td>
    </tr>
  );

  return (
    <Modal show={show} onHide={handleClose} size="lg" backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? "Editar Consulta" : "Nueva Consulta"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit(onSubmit)}>
          {/* Datos generales */}
          <Row className="mb-3">
            <Col md={8}>
              <Form.Group>
                <Form.Label>
                  Paciente <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="cliente"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      options={clienteOptions}
                      value={field.value}
                      onChange={(val) => field.onChange(val)}
                      placeholder="Buscar paciente..."
                      noOptionsMessage="No se encontraron pacientes"
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
            <Col md={4}>
              <Form.Group>
                <Form.Label>
                  Fecha <span className="text-danger">*</span>
                </Form.Label>
                <Controller
                  name="fecha"
                  control={control}
                  render={({ field }) => (
                    <Form.Control
                      type="date"
                      isInvalid={!!errors.fecha}
                      {...field}
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
          </Row>

          {/* Motivo */}
          <Form.Group className="mb-3">
            <Form.Label>
              Motivo <span className="text-danger">*</span>
            </Form.Label>
            <Controller
              name="motivo"
              control={control}
              render={({ field }) => (
                <Form.Control
                  as="textarea"
                  rows={2}
                  isInvalid={!!errors.motivo}
                  placeholder="Motivo de la consulta"
                  {...field}
                />
              )}
            />
            {errors.motivo && (
              <Form.Control.Feedback type="invalid">
                {errors.motivo.message}
              </Form.Control.Feedback>
            )}
          </Form.Group>

          {/* Diagnóstico */}
          <Form.Group className="mb-3">
            <Form.Label>Diagnóstico</Form.Label>
            <Controller
              name="diagnostico"
              control={control}
              render={({ field }) => (
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Diagnóstico (opcional)"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
          </Form.Group>

          {/* Tratamiento */}
          <Form.Group className="mb-3">
            <Form.Label>Tratamiento</Form.Label>
            <Controller
              name="tratamiento"
              control={control}
              render={({ field }) => (
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Tratamiento indicado (opcional)"
                  value={field.value || ""}
                  onChange={field.onChange}
                />
              )}
            />
          </Form.Group>

          {/* Sección Graduación */}
          <div className="border rounded p-2 mb-2">
            <Button
              variant="link"
              className="p-0 text-decoration-none d-flex align-items-center gap-1 fw-semibold"
              onClick={() => setShowGraduacion((v) => !v)}
            >
              {showGraduacion ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              👁️ Graduación
            </Button>

            <Collapse in={showGraduacion}>
              <div className="mt-3">
                <Table bordered size="sm" className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "90px" }}></th>
                      <th>Esférico</th>
                      <th>Cilíndrico</th>
                      <th>Eje (0-180°)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <GraduacionRow
                      label="OD Lejos"
                      esfField="od_lejos_esferico"
                      cilField="od_lejos_cilindrico"
                      ejeField="od_lejos_eje"
                    />
                    <GraduacionRow
                      label="OI Lejos"
                      esfField="oi_lejos_esferico"
                      cilField="oi_lejos_cilindrico"
                      ejeField="oi_lejos_eje"
                    />
                    <GraduacionRow
                      label="OD Cerca"
                      esfField="od_cerca_esferico"
                      cilField="od_cerca_cilindrico"
                      ejeField="od_cerca_eje"
                    />
                    <GraduacionRow
                      label="OI Cerca"
                      esfField="oi_cerca_esferico"
                      cilField="oi_cerca_cilindrico"
                      ejeField="oi_cerca_eje"
                    />
                  </tbody>
                </Table>
              </div>
            </Collapse>
          </div>

          {(createConsulta.isError || updateConsulta.isError) && (
            <Alert variant="danger" className="mt-3">
              Error al guardar la consulta. Verifique los datos e intente
              nuevamente.
            </Alert>
          )}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConsultationFormModal;
