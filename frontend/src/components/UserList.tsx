/**
 * Componente ABM de Usuarios del sistema.
 *
 * Permite crear, editar y eliminar usuarios, asignar grupos y permisos individuales.
 * Solo visible para usuarios con is_staff=True.
 */

import React, { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Form,
  Modal,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  PeopleFill,
  PencilSquare,
  Trash,
  PersonPlusFill,
} from "react-bootstrap-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Select from "react-select";
import ListHeader from "./ListHeader";
import {
  useUsuarios,
  useCreateUsuario,
  useUpdateUsuario,
  useDeleteUsuario,
  useGrupos,
} from "../hooks/useUsers";
import { usuarioSchema, type UsuarioFormData } from "../schemas/users.schema";
import type { Usuario } from "../services/users.service";

// ── Helpers ──────────────────────────────────────────────────────────────────

function nombreCompleto(u: Usuario): string {
  const nombre = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return nombre || u.username;
}

// ── Modal de Formulario ───────────────────────────────────────────────────────

interface ModalProps {
  show: boolean;
  onHide: () => void;
  usuarioEditar?: Usuario | null;
}

function UsuarioModal({ show, onHide, usuarioEditar }: ModalProps) {
  const esEdicion = !!usuarioEditar;
  const { mutateAsync: crear, isPending: creando } = useCreateUsuario();
  const { mutateAsync: actualizar, isPending: actualizando } =
    useUpdateUsuario();
  const { data: gruposData } = useGrupos();

  const grupoOptions =
    gruposData?.results.map((g) => ({ value: g.id, label: g.name })) ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UsuarioFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(usuarioSchema) as any,
    defaultValues: {
      username: usuarioEditar?.username ?? "",
      email: usuarioEditar?.email ?? "",
      first_name: usuarioEditar?.first_name ?? "",
      last_name: usuarioEditar?.last_name ?? "",
      password: "",
      is_active: usuarioEditar?.is_active ?? true,
      is_staff: usuarioEditar?.is_staff ?? false,
      group_ids: [],
      permission_ids: [],
    },
  });

  React.useEffect(() => {
    if (show) {
      reset({
        username: usuarioEditar?.username ?? "",
        email: usuarioEditar?.email ?? "",
        first_name: usuarioEditar?.first_name ?? "",
        last_name: usuarioEditar?.last_name ?? "",
        password: "",
        is_active: usuarioEditar?.is_active ?? true,
        is_staff: usuarioEditar?.is_staff ?? false,
        group_ids: [],
        permission_ids: [],
      });
    }
  }, [show, usuarioEditar, reset]);

  const isPending = creando || actualizando;

  const onSubmit = async (data: UsuarioFormData) => {
    const payload = {
      ...data,
      password: data.password || undefined,
      email: data.email || undefined,
    };
    if (esEdicion && usuarioEditar) {
      await actualizar({ id: usuarioEditar.id, payload });
    } else {
      await crear(payload);
    }
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {esEdicion ? "Editar Usuario" : "Nuevo Usuario"}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          <div className="row g-3">
            {/* Username */}
            <Form.Group className="col-md-6">
              <Form.Label className="fw-semibold">
                Usuario <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                {...register("username")}
                isInvalid={!!errors.username}
                placeholder="nombre.usuario"
              />
              <Form.Control.Feedback type="invalid">
                {errors.username?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Email */}
            <Form.Group className="col-md-6">
              <Form.Label className="fw-semibold">Email</Form.Label>
              <Form.Control
                type="email"
                {...register("email")}
                isInvalid={!!errors.email}
                placeholder="usuario@opticar.com"
              />
              <Form.Control.Feedback type="invalid">
                {errors.email?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Nombre */}
            <Form.Group className="col-md-6">
              <Form.Label className="fw-semibold">Nombre</Form.Label>
              <Form.Control {...register("first_name")} placeholder="Nombre" />
            </Form.Group>

            {/* Apellido */}
            <Form.Group className="col-md-6">
              <Form.Label className="fw-semibold">Apellido</Form.Label>
              <Form.Control {...register("last_name")} placeholder="Apellido" />
            </Form.Group>

            {/* Contraseña */}
            <Form.Group className="col-md-6">
              <Form.Label className="fw-semibold">
                Contraseña{" "}
                {!esEdicion && <span className="text-danger">*</span>}
              </Form.Label>
              <Form.Control
                type="password"
                {...register("password")}
                isInvalid={!!errors.password}
                placeholder={
                  esEdicion
                    ? "Dejar vacío para no cambiar"
                    : "Mínimo 8 caracteres"
                }
                autoComplete="new-password"
              />
              <Form.Control.Feedback type="invalid">
                {errors.password?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {/* Grupos */}
            <Form.Group className="col-md-6">
              <Form.Label className="fw-semibold">Grupos / Roles</Form.Label>
              <Controller
                name="group_ids"
                control={control}
                render={({ field }) => (
                  <Select
                    isMulti
                    options={grupoOptions}
                    value={grupoOptions.filter((o) =>
                      field.value?.includes(o.value),
                    )}
                    onChange={(selected) =>
                      field.onChange(selected.map((s) => s.value))
                    }
                    placeholder="Seleccionar grupos…"
                    noOptionsMessage={() => "No hay grupos"}
                  />
                )}
              />
            </Form.Group>

            {/* Flags */}
            <div className="col-12 d-flex gap-4">
              <Form.Check
                type="switch"
                id="is_active"
                label="Usuario activo"
                {...register("is_active")}
              />
              <Form.Check
                type="switch"
                id="is_staff"
                label="Administrador (staff)"
                {...register("is_staff")}
              />
            </div>
          </div>
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

// ── Modal de Confirmación de Eliminación ─────────────────────────────────────

interface DeleteModalProps {
  show: boolean;
  usuario: Usuario | null;
  onConfirm: () => void;
  onHide: () => void;
  isPending: boolean;
}

function DeleteModal({
  show,
  usuario,
  onConfirm,
  onHide,
  isPending,
}: DeleteModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered size="sm">
      <Modal.Header closeButton>
        <Modal.Title>Eliminar usuario</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        ¿Eliminar al usuario <strong>{usuario?.username}</strong>? Esta acción
        no se puede deshacer.
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

export default function UserList() {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [usuarioEliminar, setUsuarioEliminar] = useState<Usuario | null>(null);

  const { data, isLoading, error } = useUsuarios(search);
  const { mutate: eliminar, isPending: eliminando } = useDeleteUsuario();

  const usuarios = data?.results ?? [];

  const handleNuevo = () => {
    setUsuarioEditar(null);
    setShowModal(true);
  };

  const handleEditar = (u: Usuario) => {
    setUsuarioEditar(u);
    setShowModal(true);
  };

  const handleConfirmarDelete = () => {
    if (usuarioEliminar) {
      eliminar(usuarioEliminar.id, {
        onSuccess: () => setUsuarioEliminar(null),
      });
    }
  };

  return (
    <div
      style={{
        height: "calc(100vh - 100px)",
        overflowY: "auto",
        paddingRight: "1rem",
      }}
    >
      <ListHeader
        title="Usuarios"
        count={data?.count ?? 0}
        icon={<PeopleFill size={28} viewBox="0 1 16 16" />}
      >
        <Button variant="primary" size="sm" onClick={handleNuevo}>
          <PersonPlusFill className="me-1" />
          Nuevo Usuario
        </Button>
      </ListHeader>

      {/* Buscador */}
      <Form.Control
        type="search"
        placeholder="Buscar por usuario, email o nombre…"
        className="mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Estados */}
      {isLoading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}
      {error && (
        <Alert variant="danger">
          Error al cargar usuarios. Solo los administradores pueden acceder a
          esta sección.
        </Alert>
      )}

      {/* Tabla */}
      {!isLoading && !error && (
        <Table hover responsive bordered size="sm">
          <thead className="table-dark">
            <tr>
              <th>Usuario</th>
              <th>Nombre completo</th>
              <th>Email</th>
              <th>Grupos</th>
              <th>Estado</th>
              <th>Rol</th>
              <th className="text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-muted py-4">
                  No se encontraron usuarios.
                </td>
              </tr>
            ) : (
              usuarios.map((u) => (
                <React.Fragment key={u.id}>
                  <tr>
                    <td className="fw-semibold">{u.username}</td>
                    <td>{nombreCompleto(u)}</td>
                    <td>{u.email || <span className="text-muted">—</span>}</td>
                    <td>
                      {u.groups.length > 0 ? (
                        u.groups.map((g) => (
                          <Badge bg="info" className="me-1 text-dark" key={g}>
                            {g}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted small">Sin grupos</span>
                      )}
                    </td>
                    <td>
                      {u.is_active ? (
                        <Badge bg="success">Activo</Badge>
                      ) : (
                        <Badge bg="secondary">Inactivo</Badge>
                      )}
                    </td>
                    <td>
                      {u.is_superuser ? (
                        <Badge bg="danger">Superusuario</Badge>
                      ) : u.is_staff ? (
                        <Badge bg="warning" text="dark">
                          Admin
                        </Badge>
                      ) : (
                        <Badge bg="light" text="dark">
                          Estándar
                        </Badge>
                      )}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="me-1"
                        onClick={() => handleEditar(u)}
                        title="Editar"
                      >
                        <PencilSquare />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => setUsuarioEliminar(u)}
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

      {/* Modales */}
      <UsuarioModal
        show={showModal}
        onHide={() => setShowModal(false)}
        usuarioEditar={usuarioEditar}
      />
      <DeleteModal
        show={!!usuarioEliminar}
        usuario={usuarioEliminar}
        onConfirm={handleConfirmarDelete}
        onHide={() => setUsuarioEliminar(null)}
        isPending={eliminando}
      />
    </div>
  );
}
