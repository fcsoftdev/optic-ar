/**
 * @file AsyncSearchableSelect.tsx
 * @description Selector con búsqueda asíncrona y debounce basado en AsyncSelect de react-select.
 * Soluciona el problema de rendimiento de cargar todos los registros en memoria cuando
 * hay grandes volúmenes de datos, disparando queries al backend solo al escribir.
 */
import React, { useRef, useCallback, useState } from "react";
import AsyncSelect from "react-select/async";
import type { StylesConfig } from "react-select";

/** Opción estándar para los selectores. */
interface Option {
  value: number;
  label: string;
}

/**
 * Props del componente AsyncSearchableSelect.
 */
interface AsyncSearchableSelectProps {
  /** Función asíncrona que recibe el texto de búsqueda y retorna las opciones. */
  loadOptions: (inputValue: string) => Promise<Option[]>;
  /** Valor actualmente seleccionado (ID numérico). */
  value: number | null | undefined;
  /** Callback ejecutado al cambiar la selección (pasa solo el value numérico). */
  onChange: (value: number | null) => void;
  /** Callback opcional que recibe la opción completa {value, label} al seleccionar. */
  onSelectOption?: (option: Option | null) => void;
  /**
   * Función para cargar TODOS los registros al abrir el dropdown por primera vez.
   * Si no se provee, usa `loadOptions("")` como fallback.
   * Permite mostrar la lista completa al desplegar sin afectar la búsqueda con debounce.
   */
  loadAllOptions?: () => Promise<Option[]>;
  /** Placeholder del input. */
  placeholder?: string;
  /** Si es true, aplica el estilo de error de Bootstrap. */
  isInvalid?: boolean;
  /** Deshabilita el selector. */
  disabled?: boolean;
  /** Milisegundos de espera antes de disparar la búsqueda. Por defecto: 350ms. */
  debounceMs?: number;
  /** Opción actualmente seleccionada como objeto {value, label} para mostrar la etiqueta correcta. */
  selectedOption?: Option | null;
}

const AsyncSearchableSelect: React.FC<AsyncSearchableSelectProps> = ({
  loadOptions,
  loadAllOptions,
  value,
  onChange,
  onSelectOption,
  placeholder = "Escribí para buscar...",
  isInvalid = false,
  disabled = false,
  debounceMs = 350,
  selectedOption = null,
}) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Opciones por defecto cargadas la primera vez que se abre el dropdown. */
  const [defaultOpts, setDefaultOpts] = useState<Option[] | false>(false);
  const defaultLoadedRef = useRef(false);

  /**
   * Versión debounced de loadOptions: espera `debounceMs` ms tras el último
   * caracter ingresado antes de disparar la query al backend.
   *
   * @param inputValue - Texto ingresado por el usuario.
   * @returns Promesa que resuelve con las opciones filtradas.
   */
  const debouncedLoad = useCallback(
    (inputValue: string): Promise<Option[]> => {
      return new Promise((resolve) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
          const options = await loadOptions(inputValue);
          resolve(options);
        }, debounceMs);
      });
    },
    [loadOptions, debounceMs],
  );

  /**
   * Carga las opciones iniciales la primera vez que el usuario abre el desplegable.
   * Las aperturas siguientes reutilizan el resultado cacheado sin re-fetch.
   */
  const handleMenuOpen = useCallback(async () => {
    if (defaultLoadedRef.current) return;
    defaultLoadedRef.current = true;
    const opts = await (loadAllOptions ? loadAllOptions() : loadOptions(""));
    setDefaultOpts(opts);
  }, [loadOptions, loadAllOptions]);

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
    }),
    menu: (provided) => ({ ...provided, zIndex: 9999 }),
    menuPortal: (provided) => ({ ...provided, zIndex: 9999 }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#0d6efd"
        : state.isFocused
          ? "#e7f1ff"
          : "white",
      color: state.isSelected ? "white" : "#212529",
      "&:active": { backgroundColor: "#0d6efd", color: "white" },
    }),
  };

  // Construye el objeto Option actual para mostrarlo aunque no haya búsqueda activa
  const currentValue = value
    ? selectedOption?.value === value
      ? selectedOption
      : { value, label: `#${value}` }
    : null;

  return (
    <AsyncSelect
      loadOptions={debouncedLoad}
      value={currentValue}
      onChange={(option) => {
        onChange(option ? option.value : null);
        onSelectOption?.(option ?? null);
      }}
      placeholder={placeholder}
      isClearable
      isDisabled={disabled}
      styles={customStyles}
      menuPortalTarget={document.body}
      menuPosition="fixed"
      loadingMessage={() => "Buscando..."}
      noOptionsMessage={() => "Sin resultados"}
      defaultOptions={defaultOpts}
      onMenuOpen={handleMenuOpen}
    />
  );
};

export default AsyncSearchableSelect;
