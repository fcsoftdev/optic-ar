import React, { useState } from "react";
import {
  Modal,
  Button,
  Form,
  ListGroup,
  InputGroup,
  Badge,
  Alert,
} from "react-bootstrap";
import { Pencil, Trash, Plus, Save, X } from "react-bootstrap-icons";
import type {
  Marca,
  Categoria,
  SubCategoria,
} from "../services/productos.service";

interface EntityManagerModalProps {
  show: boolean;
  onHide: () => void;
  title: string;
  entityType: "marca" | "categoria" | "subcategoria";
  items: Marca[] | Categoria[] | SubCategoria[];
  categorias?: Categoria[];
  selectedCategoria?: number;
  onCreate: (nombre: string, categoriaId?: number) => Promise<void>;
  onUpdate: (id: number, nombre: string, categoriaId?: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  isLoading?: boolean;
}

const EntityManagerModal: React.FC<EntityManagerModalProps> = ({
  show,
  onHide,
  title,
  entityType,
  items,
  categorias,
  selectedCategoria,
  onCreate,
  onUpdate,
  onDelete,
  isLoading = false,
}) => {
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategoria, setNewItemCategoria] = useState<number>(
    selectedCategoria || 0
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingCategoria, setEditingCategoria] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newItemName.trim()) return;

    if (entityType === "subcategoria" && !newItemCategoria) {
      setError("Debe seleccionar una categoría");
      return;
    }

    try {
      setError(null);
      await onCreate(newItemName, newItemCategoria || undefined);
      setNewItemName("");
      setNewItemCategoria(selectedCategoria || 0);
    } catch (err) {
      setError("Error al crear el elemento");
      console.error(err);
    }
  };

  const handleStartEdit = (item: Marca | Categoria | SubCategoria) => {
    setEditingId(item.id);
    setEditingName(item.nombre);
    if ("categoria" in item && typeof item.categoria === "number") {
      setEditingCategoria(item.categoria);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingName.trim() || editingId === null) return;

    try {
      setError(null);
      await onUpdate(editingId, editingName, editingCategoria || undefined);
      setEditingId(null);
      setEditingName("");
      setEditingCategoria(0);
    } catch (err) {
      setError("Error al actualizar el elemento");
      console.error(err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName("");
    setEditingCategoria(0);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este elemento?")) return;

    try {
      setError(null);
      await onDelete(id);
    } catch (err: any) {
      if (err.response?.status === 403 || err.response?.status === 400) {
        setError(
          "No se puede eliminar porque está siendo utilizado por productos"
        );
      } else {
        setError("Error al eliminar el elemento");
      }
      console.error(err);
    }
  };

  const getCategoriaNombre = (categoriaId: number) => {
    return categorias?.find((c) => c.id === categoriaId)?.nombre || "";
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Gestionar {title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Formulario para crear nuevo */}
        <div className="mb-4 p-3 bg-light rounded">
          <h6 className="mb-3">Agregar Nuevo</h6>
          <InputGroup className="mb-2">
            <Form.Control
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder={`Nombre ${title.toLowerCase()}`}
              onKeyPress={(e) => e.key === "Enter" && handleCreate()}
            />
            {entityType === "subcategoria" && categorias && (
              <Form.Select
                value={newItemCategoria}
                onChange={(e) => setNewItemCategoria(Number(e.target.value))}
                style={{ maxWidth: "200px" }}
              >
                <option value={0}>Seleccione categoría</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </Form.Select>
            )}
            <Button
              variant="success"
              onClick={handleCreate}
              disabled={!newItemName.trim() || isLoading}
            >
              <Plus size={18} className="me-1" />
              Agregar
            </Button>
          </InputGroup>
        </div>

        {/* Lista de items */}
        <h6 className="mb-3">
          Lista de {title} ({items.length})
        </h6>
        <ListGroup style={{ maxHeight: "400px", overflowY: "auto" }}>
          {items.length === 0 ? (
            <ListGroup.Item className="text-center text-muted">
              No hay {title.toLowerCase()} registradas
            </ListGroup.Item>
          ) : (
            items.map((item) => (
              <ListGroup.Item key={item.id}>
                {editingId === item.id ? (
                  // Modo edición
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      size="sm"
                      onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                      autoFocus
                    />
                    {entityType === "subcategoria" && categorias && (
                      <Form.Select
                        value={editingCategoria}
                        onChange={(e) =>
                          setEditingCategoria(Number(e.target.value))
                        }
                        size="sm"
                        style={{ maxWidth: "180px" }}
                      >
                        {categorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                    <Button
                      variant="success"
                      size="sm"
                      onClick={handleSaveEdit}
                      title="Guardar"
                    >
                      <Save size={16} />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleCancelEdit}
                      title="Cancelar"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ) : (
                  // Modo visualización
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{item.nombre}</strong>
                      {entityType === "subcategoria" &&
                        "categoria" in item &&
                        typeof item.categoria === "number" && (
                          <Badge bg="secondary" className="ms-2">
                            {getCategoriaNombre(item.categoria)}
                          </Badge>
                        )}
                    </div>
                    <div className="d-flex gap-1">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => handleStartEdit(item)}
                        title="Editar"
                      >
                        <Pencil size={14} />
                      </Button>
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        title="Eliminar"
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                  </div>
                )}
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EntityManagerModal;
