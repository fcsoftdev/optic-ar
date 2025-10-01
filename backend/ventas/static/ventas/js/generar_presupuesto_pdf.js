// Script para agregar el botón y enviar los datos del formulario por AJAX
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    // Solo en el change_form de ventas
    if (window.location.pathname.includes("/admin/ventas/venta/")) {
      var form = document.querySelector("form");
      if (form) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.innerText = "Generar PDF (Presupuesto)";
        btn.className = "btn btn-info";
        btn.style.marginLeft = "10px";
        btn.onclick = function () {
          // Captura los datos del formulario y construye el array de productos
          var productos = [];
          var total = 0;
          // Busca los inlines de productos (ajusta el selector si usas otro tipo de inline)
          document
            .querySelectorAll("tr.dynamic-detalles_ventas")
            .forEach(function (row) {
              // Ignorar los eliminados
              var deleteInput = row.querySelector(
                'input[type="checkbox"][name$="-DELETE"]'
              );
              if (deleteInput && deleteInput.checked) return;

              var nombre =
                row
                  .querySelector('select[name$="-producto"] option:checked')
                  ?.textContent.trim() || "";
              var cantidad = parseFloat(
                row.querySelector('input[name$="-cantidad"]')?.value || 0
              );
              var precio_venta = parseFloat(
                row
                  .querySelector('input[name$="-precio_venta"]')
                  ?.value?.replace(",", ".") || 0
              );
              var subtotal = parseFloat(
                row
                  .querySelector(".field-subtotal_item p")
                  ?.textContent.replace(",", ".") || 0
              );

              // Si precio_venta es 0 pero tenemos subtotal y cantidad, calcularlo
              if (precio_venta === 0 && subtotal > 0 && cantidad > 0) {
                precio_venta = subtotal / cantidad;
              }

              // Si aún no tenemos subtotal, calcularlo
              if (subtotal === 0 && precio_venta > 0 && cantidad > 0) {
                subtotal = cantidad * precio_venta;
              }
              if (nombre && cantidad > 0) {
                productos.push({
                  nombre: nombre,
                  cantidad: cantidad,
                  precio_venta: precio_venta,
                  subtotal: subtotal,
                });
                total += subtotal;
              }
            });
          var data = {
            productos: productos,
            total: total,
            fecha: new Date().toLocaleDateString(),
          };
          // Enviar por AJAX
          fetch("/ventas/generar-presupuesto-pdf/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify(data),
          })
            .then((response) => response.blob())
            .then((blob) => {
              var url = window.URL.createObjectURL(blob);
              var a = document.createElement("a");
              a.href = url;
              a.download = "presupuesto.pdf";
              document.body.appendChild(a);
              a.click();
              a.remove();
            });
        };
        // Agregar el botón al formulario
        var actions = document.querySelector(".submit-row");
        if (actions) {
          actions.appendChild(btn);
        }
      }
    }
  });
  // Función para obtener el CSRF token
  function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === name + "=") {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
})();
