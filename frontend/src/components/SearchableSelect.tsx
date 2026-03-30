import React from "react";
import { InputGroup, Button } from "react-bootstrap";
import { GearFill, PlusCircle } from "react-bootstrap-icons";
import Select, { type StylesConfig } from "react-select";

interface Option {
  value: number;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  isInvalid?: boolean;
  disabled?: boolean;
  onManageClick?: () => void;
  /** Texto del botón de gestión. Si se omite, se muestra solo el ícono de engranaje. */
  manageLabel?: string;
  /** Tooltip del botón de gestión. Si se omite, se usa `manageLabel` o "Gestionar". */
  manageTitle?: string;
  /** Muestra el ícono `+` en lugar del engranaje en el botón de gestión. */
  addIcon?: boolean;
  isClearable?: boolean;
  noOptionsMessage?: string;
  /** Renderiza el menú en document.body para evitar clipping por overflow. Útil dentro de tablas o modales con scroll. */
  portalMenu?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccione...",
  isInvalid = false,
  disabled = false,
  onManageClick,
  manageLabel,
  manageTitle,
  addIcon = false,
  isClearable = false,
  noOptionsMessage = "No hay opciones",
  portalMenu = false,
}) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const customStyles: StylesConfig<Option, false> = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: "var(--bs-body-bg)",
      borderColor: isInvalid
        ? "var(--bs-danger)"
        : state.isFocused
          ? "#86b7fe"
          : "var(--bs-border-color)",
      boxShadow: state.isFocused
        ? isInvalid
          ? "0 0 0 0.25rem rgba(220, 53, 69, 0.25)"
          : "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
        : "none",
      "&:hover": {
        borderColor: isInvalid
          ? "var(--bs-danger)"
          : state.isFocused
            ? "#86b7fe"
            : "var(--bs-border-color)",
      },
      minHeight: "38px",
      borderTopRightRadius: onManageClick ? 0 : "0.375rem",
      borderBottomRightRadius: onManageClick ? 0 : "0.375rem",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "var(--bs-body-color)",
    }),
    input: (provided) => ({
      ...provided,
      color: "var(--bs-body-color)",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "var(--bs-secondary-color)",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 9999,
      backgroundColor: "var(--bs-body-bg)",
      border: "1px solid var(--bs-border-color)",
    }),
    menuPortal: (provided) => ({
      ...provided,
      zIndex: 9999,
    }),
    menuList: (provided) => ({
      ...provided,
      backgroundColor: "var(--bs-body-bg)",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#0d6efd"
        : state.isFocused
          ? "var(--bs-tertiary-bg)"
          : "var(--bs-body-bg)",
      color: state.isSelected ? "white" : "var(--bs-body-color)",
      "&:active": {
        backgroundColor: "#0d6efd",
        color: "white",
      },
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      color: "var(--bs-secondary-color)",
    }),
  };

  return (
    <InputGroup>
      <Select
        options={options}
        value={selectedOption}
        onChange={(option) => onChange(option ? option.value : null)}
        placeholder={placeholder}
        isClearable={isClearable}
        isDisabled={disabled}
        styles={customStyles}
        noOptionsMessage={() => noOptionsMessage}
        className="flex-grow-1"
        menuPortalTarget={portalMenu ? document.body : undefined}
        menuPosition={portalMenu ? "fixed" : undefined}
      />
      {onManageClick && (
        <Button
          variant="outline-primary"
          onClick={onManageClick}
          title={manageTitle ?? manageLabel ?? "Gestionar"}
          disabled={disabled}
        >
          {manageLabel ? (
            <>
              <PlusCircle size={15} className="me-1" />
              {manageLabel}
            </>
          ) : addIcon ? (
            <PlusCircle size={16} />
          ) : (
            <GearFill size={18} />
          )}
        </Button>
      )}
    </InputGroup>
  );
};

export default SearchableSelect;
