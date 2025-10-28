import type { ReactNode } from "react";
import { Card } from "react-bootstrap";

interface InfoCardProps {
  icon: ReactNode;
  title: string;
  description: string;
}

/**
 * Componente InfoCard - Tarjeta de información reutilizable.
 *
 * Muestra una tarjeta con un icono y descripción.
 *
 * @param icon - Icono React (componente o emoji) a mostrar en la tarjeta
 * @param title - Título de la tarjeta
 * @param description - Texto descriptivo de la tarjeta
 */
function InfoCard({ icon, title, description }: InfoCardProps) {
  return (
    <Card className="h-100">
      <Card.Body className="text-center">
        <div className="mb-3 text-primary" style={{ fontSize: "3rem" }}>
          {icon}
        </div>
        <Card.Title className="mb-2">{title}</Card.Title>
        <Card.Text className="text-muted">{description}</Card.Text>
      </Card.Body>
    </Card>
  );
}

export default InfoCard;
