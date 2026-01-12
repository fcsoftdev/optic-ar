/**
 * Calculador de Balance en tiempo real para MovimientoCaja
 * Calcula: Ingreso - Egreso
 */

(function () {
  "use strict";

  function formatNumber(num) {
    const parts = num.toFixed(2).split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function calcularBalance() {
    const ingreso =
      parseFloat(document.getElementById("id_ingreso")?.value) || 0;
    const egreso = parseFloat(document.getElementById("id_egreso")?.value) || 0;

    const balance = ingreso - egreso;
    const balanceDisplay = document.getElementById("balance-display");

    if (balanceDisplay) {
      const color = balance >= 0 ? "#28a745" : "#dc3545";
      const signo = balance >= 0 ? "+" : "";
      balanceDisplay.style.color = color;
      balanceDisplay.textContent = signo + "$" + formatNumber(balance);
    }
  }

  function inicializarCalculador() {
    const campos = ["id_ingreso", "id_egreso"];
    let camposEncontrados = 0;

    campos.forEach(function (id) {
      const campo = document.getElementById(id);
      if (campo) {
        camposEncontrados++;
        campo.addEventListener("input", calcularBalance);
        campo.addEventListener("change", calcularBalance);
      }
    });

    // Solo calcular si encontramos al menos un campo
    if (camposEncontrados > 0) {
      calcularBalance();
    }
  }

  // Ejecutar cuando el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicializarCalculador);
  } else {
    inicializarCalculador();
  }
})();
