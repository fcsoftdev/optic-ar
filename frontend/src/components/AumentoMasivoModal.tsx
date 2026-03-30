import React, { useState } from "react";
import { Alert, Button, Form, InputGroup, Modal } from "react-bootstrap";
import { useAumentoMasivo } from "../hooks/useProductos";

interface AumentoMasivoModalProps {
  show: boolean;
  onHide: () => void;
  selectedIds: number[];
  onSuccess: () => void;
}

const AumentoMasivoModal: React.FC<AumentoMasivoModalProps> = ({
  show,
  onHide,
  selectedIds,
  onSuccess,
}) => {
  const [porcentaje, setPorcentaje] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const aumentoMasivo = useAumentoMasivo();

  const handleClose = () => {
    setPorcentaje("");
    setError(null);
    onHide();
  };

  const handleGenerar = async () => {
    const valor = parseFloat(porcentaje);
    if (!valor || valor <= 0) {
      setError("Ingresá un porcentaje mayor a 0.");
      return;
    }
    if (selectedIds.length === 0) {
      setError("Seleccioná al menos un producto.");
      return;
    }
    try {
      setError(null);
      const result = await aumentoMasivo.mutateAsync({
        ids: selectedIds,
        porcentaje: valor,
      });
      onSuccess();
      handleClose();
      alert(`Aumento aplicado a ${result.actualizados} producto(s).`);
    } catch {
      setError("Error al aplicar el aumento. Intentá de nuevo.");
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Aumento Masivo de Precio</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted">
          Se aplicará el aumento al precio de costo de{" "}
          <strong>{selectedIds.length} producto(s)</strong> seleccionado(s). El
          precio de venta se recalculará automáticamente según el porcentaje de
          ganancia de cada producto.
        </p>
        <Form.Group>
          <Form.Label>Porcentaje de aumento</Form.Label>
          <InputGroup>
            <Form.Control
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Ej: 15.5"
              value={porcentaje}
              onChange={(e) => setPorcentaje(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerar()}
              autoFocus
            />
            <InputGroup.Text>%</InputGroup.Text>
          </InputGroup>
        </Form.Group>
        {error && (
          <Alert variant="danger" className="mt-3 mb-0">
            {error}
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button
          variant="warning"
          onClick={handleGenerar}
          disabled={aumentoMasivo.isPending}
        >
          {aumentoMasivo.isPending ? "Aplicando..." : "Generar Aumento"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AumentoMasivoModal;
