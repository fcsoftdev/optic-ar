/**
 * Componente ABM de Grupos del sistema.
 *
 * Permite crear, editar y eliminar grupos, y asignar permisos de Django
 * sobre los modelos del dominio (productos, ventas, compras, etc.).
 */

import React, { useState, useMemo } from "react";
import {
  Alert,
  Badge,
  Button,
  Collapse,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  ShieldLockFill,
  PencilSquare,
  Trash,
  PlusLg,
  ChevronDown,
  ChevronRight,
} from "react-bootstrap-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ListHeader from "./ListHeader";
import {
  useGrupos,
  useCreateGrupo,
  useUpdateGrupo,
  useDeleteGrupo,
  usePermisos,
} from "../hooks/useUsers";
import { grupoSchema, type GrupoFormData } from "../schemas/users.schema";
import type { Grupo, Permiso } from "../services/users.service";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Traduce codenames de permisos a etiquetas legibles. */
const ACCION_LABELS: Record<string, string> = {
  add: "Crear",
  change: "Editar",
  delete: "Eliminar",
  view: "Ver",
};

/** Etiquetas de app_label en español. */
const APP_LABELS: Record<string, string> = {
  productos: "Productos",
  ventas: "Ventas",
  compras: "Compras",
  contabilidad: "Contabilidad",
  turnos: "Turnos",
  auth: "Usuarios y Grupos",
};

function accionLabel(codename: string): string {
  const accion = codename.split("_")[0];
  return ACCION_LABELS[accion] ?? accion;
}

/** Agrupa permisos por app_label → model. */
function agruparPermisos(permisos: Permiso[]) {
  return permisos.reduce<Record<string, Record<string, Permiso[]>>>(
    (acc, p) => {
      const app = p.app_label;
      const model = p.model;
      if (!acc[app]) acc[app] = {};
      if (!acc[app][model]) acc[app][model] = [];
      acc[app][model].push(p);
      return acc;
    },
    {},
  );
}

// ── Selector de Permisos ──────────────────────────────────────────────────────

interface PermisosSelectProps {
  permisos: Permiso[];
  value: number[];
  onChange: (ids: number[]) => void;
}

function PermisosSelect({ permisos, value, onChange }: PermisosSelectProps) {
  const [expandidos, setExpandidos] = useState<string[]>([]);
  const agrupados = useMemo(() => agruparPermisos(permisos), [permisos]);

  const toggle = (key: string) =>
    setExpandidos((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );

  const isChecked = (id: number) => value.includes(id);

  const togglePermiso = (id: number) => {
    if (isChecked(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const toggleModelo = (modelPermisos: Permiso[]) => {
    const ids = modelPermisos.map((p) => p.id);
    const todosChecked = ids.every((id) => value.includes(id));
    if (todosChecked) {
      onChange(value.filter((v) => !ids.includes(v)));
    } else {
      onChange([...new Set([...value, ...ids])]);
    }
  };

  return (
    <div
      className="border rounded p-2"
      style={{ maxHeight: 320, overflowY: "auto" }}
    >
      {Object.entries(agrupados).map(([app, modelos]) => (
        <div key={app} className="mb-2">
          {/* Cabecera de app */}
          <div
            className="d-flex align-items-center gap-1 fw-bold text-primary small py-1 px-2 bg-body-secondary rounded cursor-pointer user-select-none"
            onClick={() => toggle(app)}
            style={{ cursor: "pointer" }}
          >
            {expandidos.includes(app) ? (
              <ChevronDown size={12} />
            ) : (
              <ChevronRight size={12} />
            )}
            {APP_LABELS[app] ?? app}
          </div>

          <Collapse in={expandidos.includes(app)}>
            <div className="ms-3 mt-1">
              {Object.entries(modelos).map(([model, modelPermisos]) => {
                const ids = modelPermisos.map((p) => p.id);
                const todosChecked = ids.every((id) => value.includes(id));
                const algunoChecked = ids.some((id) => value.includes(id));

                return (
                  <div key={model} className="mb-2">
                    {/* Cabecera de modelo */}
                    <Form.Check
                      type="checkbox"
                      id={`model-${app}-${model}`}
                      label={
                        <span className="fw-semibold text-capitalize small">
                          {model}
                        </span>
                      }
                      checked={todosChecked}
                      ref={(el: HTMLInputElement | null) => {
                        if (el)
                          el.indeterminate = algunoChecked && !todosChecked;
                      }}
                      onChange={() => toggleModelo(modelPermisos)}
                      className="mb-1"
                    />
                    {/* Permisos individuales */}
                    <div className="ms-3 d-flex flex-wrap gap-2">
                      {modelPermisos.map((p) => (
                        <Form.Check
                          key={p.id}
                          type="checkbox"
                          id={`perm-${p.id}`}
                          label={
                            <span className="small">
                              {accionLabel(p.codename)}
                            </span>
                          }
                          checked={isChecked(p.id)}
                          onChange={() => togglePermiso(p.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Collapse>
        </div>
      ))}
    </div>
  );
}

// ── Modal de Formulario ───────────────────────────────────────────────────────

interface ModalProps {
  show: boolean;
  onHide: () => void;
  grupoEditar?: Grupo | null;
}

function GrupoModal({ show, onHide, grupoEditar }: ModalProps) {
  const esEdicion = !!grupoEditar;
  const { mutateAsync: crear, isPending: creando } = useCreateGrupo();
  const { mutateAsync: actualizar, isPending: actualizando } = useUpdateGrupo();
  const { data: permisosData } = usePermisos();
  const permisos = permisosData?.results ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<GrupoFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(grupoSchema) as any,
    defaultValues: {
      name: grupoEditar?.name ?? "",
      permission_ids: grupoEditar?.permissions.map((p) => p.id) ?? [],
    },
  });

  React.useEffect(() => {
    if (show) {
      reset({
        name: grupoEditar?.name ?? "",
        permission_ids: grupoEditar?.permissions.map((p) => p.id) ?? [],
      });
    }
  }, [show, grupoEditar, reset]);

  const isPending = creando || actualizando;

  const onSubmit = async (data: GrupoFormData) => {
    if (esEdicion && grupoEditar) {
      await actualizar({ id: grupoEditar.id, payload: data });
    } else {
      await crear(data);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{esEdicion ? "Editar Grupo" : "Nuevo Grupo"}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          {/* Nombre del grupo */}
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">
              Nombre del grupo <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              {...register("name")}
              isInvalid={!!errors.name}
              placeholder="Ej: Vendedores, Administrativos…"
            />
            <Form.Control.Feedback type="invalid">
              {errors.name?.message}
            </Form.Control.Feedback>
          </Form.Group>

          {/* Permisos */}
          <Form.Label className="fw-semibold">Permisos</Form.Label>
          <p className="text-muted small mb-2">
            Expandí cada sección para ver los modelos y seleccionar los
            permisos.
          </p>
          {permisos.length === 0 ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <Controller
              name="permission_ids"
              control={control}
              render={({ field }) => (
                <PermisosSelect
                  permisos={permisos}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Guardando…
              </>
            ) : (
              "Guardar"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

// ── Modal de Confirmación de Eliminación ──────────────────────────────────────

interface DeleteModalProps {
  show: boolean;
  grupo: Grupo | null;
  onConfirm: () => void;
  onHide: () => void;
  isPending: boolean;
}

function DeleteModal({
  show,
  grupo,
  onConfirm,
  onHide,
  isPending,
}: DeleteModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>Eliminar grupo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        ¿Eliminar el grupo <strong>{grupo?.name}</strong>? Los usuarios del
        grupo perderán los permisos asociados.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isPending}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? <Spinner animation="border" size="sm" /> : "Eliminar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

// ── Componente Principal ──────────────────────────────────────────────────────
type SortDir = "asc" | "desc";

const sortIcon = (key: string, sortKey: string, sortDir: SortDir) =>
  sortKey !== key ? " ⇅" : sortDir === "asc" ? " ↑" : " ↓";
export default function GroupList() {
  const [showModal, setShowModal] = useState(false);
  const [grupoEditar, setGrupoEditar] = useState<Grupo | null>(null);
  const [grupoEliminar, setGrupoEliminar] = useState<Grupo | null>(null);

  const { data, isLoading, error } = useGrupos();
  const { mutate: eliminar, isPending: eliminando } = useDeleteGrupo();

  const grupos = data?.results ?? [];

  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedGrupos = [...grupos].sort((a, b) => {
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), "es", { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleNuevo = () => {
    setGrupoEditar(null);
    setShowModal(true);
  };

  const handleEditar = (g: Grupo) => {
    setGrupoEditar(g);
    setShowModal(true);
  };

  const handleConfirmarDelete = () => {
    if (grupoEliminar) {
      eliminar(grupoEliminar.id, {
        onSuccess: () => setGrupoEliminar(null),
      });
    }
  };

  return (
    <div
      className="d-flex flex-column"
      style={{ height: "calc(100vh - 80px)" }}
    >
      {/* ── Encabezado ───────────────────────────────────────────────── */}
      <div className="mb-3">
        <ListHeader
          title="Grupos / Roles"
          count={data?.count ?? 0}
          icon={<ShieldLockFill size={28} viewBox="0 1 16 16" />}
        >
          <Button variant="primary" size="sm" onClick={handleNuevo}>
            <PlusLg className="me-1" />
            Nuevo Grupo
          </Button>
        </ListHeader>
      </div>

      {/* ── Contenido scrollable ─────────────────────────────────────── */}
      <div className="flex-grow-1 overflow-auto">
        {/* Estados */}
        {isLoading && (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
          </div>
        )}
        {error && (
          <Alert variant="danger">
            Error al cargar grupos. Solo los administradores pueden acceder a
            esta sección.
          </Alert>
        )}

        {/* Tabla */}
        {!isLoading && !error && (
          <Table hover responsive bordered size="sm">
            <thead
              className="table-dark"
              style={{ position: "sticky", top: 0, zIndex: 1 }}
            >
              <tr>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("name")}
                >
                  Nombre del grupo{sortIcon("name", sortKey, sortDir)}
                </th>
                <th
                  style={{ cursor: "pointer", userSelect: "none" }}
                  onClick={() => handleSort("user_count")}
                >
                  Usuarios{sortIcon("user_count", sortKey, sortDir)}
                </th>
                <th>Permisos asignados</th>
                <th className="text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {grupos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center text-muted py-4">
                    No hay grupos creados.
                  </td>
                </tr>
              ) : (
                sortedGrupos.map((g) => (
                  <React.Fragment key={g.id}>
                    <tr>
                      <td className="fw-semibold">{g.name}</td>
                      <td>
                        <Badge bg="secondary" pill>
                          {g.user_count}
                        </Badge>
                      </td>
                      <td>
                        {g.permissions.length === 0 ? (
                          <span className="text-muted small">Sin permisos</span>
                        ) : (
                          <span className="text-muted small">
                            {g.permissions.length} permiso
                            {g.permissions.length !== 1 ? "s" : ""}
                            {" · "}
                            {[
                              ...new Set(
                                g.permissions.map(
                                  (p) => APP_LABELS[p.app_label] ?? p.app_label,
                                ),
                              ),
                            ].join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-1"
                          onClick={() => handleEditar(g)}
                          title="Editar"
                        >
                          <PencilSquare />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => setGrupoEliminar(g)}
                          title="Eliminar"
                        >
                          <Trash />
                        </Button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>

      {/* Modales */}
      <GrupoModal
        show={showModal}
        onHide={() => setShowModal(false)}
        grupoEditar={grupoEditar}
      />
      <DeleteModal
        show={!!grupoEliminar}
        grupo={grupoEliminar}
        onConfirm={handleConfirmarDelete}
        onHide={() => setGrupoEliminar(null)}
        isPending={eliminando}
      />
    </div>
  );
}
