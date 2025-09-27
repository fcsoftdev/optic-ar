// Script para formatear automáticamente los campos de graduación
document.addEventListener("DOMContentLoaded", function () {
  // Formatear campos decimales al perder el foco
  const decimalFields = document.querySelectorAll(".decimal-field");

  decimalFields.forEach((field) => {
    // Formatear al perder el foco
    field.addEventListener("blur", function () {
      let value = this.value.trim();
      if (
        value &&
        value !== "0" &&
        !value.startsWith("+") &&
        !value.startsWith("-")
      ) {
        // Si es un número positivo sin signo, agregar +
        if (!isNaN(parseFloat(value)) && isFinite(value)) {
          this.value = "+" + value;
        }
      }
    });

    // Validar mientras escribe
    field.addEventListener("input", function () {
      let value = this.value;
      let cleanValue = value.replace(/[^0-9+\-\.]/g, "");
      if (value !== cleanValue) {
        this.value = cleanValue;
      }
    });
  });
});
