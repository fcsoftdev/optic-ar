import React from "react";
import { InputGroup, Button } from "react-bootstrap";
import { GearFill } from "react-bootstrap-icons";
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
  isClearable?: boolean;
  noOptionsMessage?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = "Seleccione...",
  isInvalid = false,
  disabled = false,
  onManageClick,
  isClearable = false,
  noOptionsMessage = "No hay opciones",
}) => {
  const selectedOption = options.find((opt) => opt.value === value) || null;

  const customStyles: StylesConfig<Option, false> = {
    control: (provided, state) => ({
      ...provided,
      borderColor: isInvalid
        ? "#dc3545"
        : state.isFocused
        ? "#86b7fe"
        : "#dee2e6",
      boxShadow: state.isFocused
        ? isInvalid
          ? "0 0 0 0.25rem rgba(220, 53, 69, 0.25)"
          : "0 0 0 0.25rem rgba(13, 110, 253, 0.25)"
        : "none",
      "&:hover": {
        borderColor: isInvalid
          ? "#dc3545"
          : state.isFocused
          ? "#86b7fe"
          : "#dee2e6",
      },
      minHeight: "38px",
      borderTopRightRadius: onManageClick ? 0 : "0.375rem",
      borderBottomRightRadius: onManageClick ? 0 : "0.375rem",
    }),
    menu: (provided) => ({
      ...provided,
      zIndex: 1050,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#0d6efd"
        : state.isFocused
        ? "#e7f1ff"
        : "white",
      color: state.isSelected ? "white" : "#212529",
      "&:active": {
        backgroundColor: "#0d6efd",
        color: "white",
      },
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
      />
      {onManageClick && (
        <Button
          variant="outline-primary"
          onClick={onManageClick}
          title="Gestionar"
          disabled={disabled}
        >
          <GearFill size={18} />
        </Button>
      )}
    </InputGroup>
  );
};

export default SearchableSelect;
