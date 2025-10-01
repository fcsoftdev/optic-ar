(function ($) {
  let entregoEdited = false;

  /**
   * Helper para actualizar el valor/texto de un elemento, ya sea un input o un elemento de texto (div/p/span).
   * @param {jQuery} $element - El objeto jQuery del elemento a actualizar.
   * @param {number} value - El valor numérico a establecer.
   */
  function updateElementDisplay($el, value) {
    const displayValue = value.toFixed(2).replace(".", ",");
    if ($el.is('input[type="number"]')) $el.val(value.toFixed(2));
    else if ($el.is("input, select, textarea")) $el.val(displayValue);
    else $el.html(displayValue);
  }

  function updateTotalVenta() {
    let total = 0;
    $(
      '.dynamic-detalles_ventas .field-subtotal_item p:not([name*="__prefix__"])'
    ).each(function () {
      total += parseFloat($(this).text().replace(",", ".")) || 0;
    });
    const $totalVentaDisplay = $(".field-total_venta .readonly");
    if ($totalVentaDisplay.length) {
      updateElementDisplay($totalVentaDisplay, total);
    }

    const $entregoInput = $("#id_entrego");
    if ($entregoInput.length && !entregoEdited) {
      // 🔹 Solo lo actualiza si el usuario no lo modificó manualmente
      $entregoInput.val(total.toFixed(2));
    }

    const entrego = parseFloat($entregoInput.val().replace(",", ".")) || 0;
    const saldo = total - entrego;
    const $saldoDisplay = $(".field-saldo .readonly");
    if ($saldoDisplay.length) updateElementDisplay($saldoDisplay, saldo);
  }

  function calculateSubtotal($row) {
    const $productoSelect = $row.find('select[name$="-producto"]');
    const $cantidadInput = $row.find('input[name$="-cantidad"]');
    const $precioCosto = $row.find(".field-precio_costo p");

    // 🔍 Intentar múltiples selectores para precio_venta
    let $precioVentaInput = $row.find('input[name$="-precio_venta"]');
    if (!$precioVentaInput.length) {
      $precioVentaInput = $row.find(".field-precio_venta input");
    }
    if (!$precioVentaInput.length) {
      $precioVentaInput = $row.find('input[id*="precio_venta"]');
    }

    console.log("🔍 Buscando campo precio_venta:");
    console.log(
      "- Selector 1 (input[name$='-precio_venta']):",
      $row.find('input[name$="-precio_venta"]').length
    );
    console.log(
      "- Selector 2 (.field-precio_venta input):",
      $row.find(".field-precio_venta input").length
    );
    console.log(
      "- Selector 3 (input[id*='precio_venta']):",
      $row.find('input[id*="precio_venta"]').length
    );
    console.log("- Campo final encontrado:", $precioVentaInput.length);

    const $subtotalItemDisplay = $row.find(".field-subtotal_item p");
    const $stockMessage = $row.find(".stock-message");

    let costoProductoBase = 0;
    let precioVentaProducto = 0;
    let stockActualProducto = 0;

    const selectedProductOption = $productoSelect.find("option:selected");

    if (selectedProductOption.length && selectedProductOption.val()) {
      costoProductoBase =
        parseFloat(selectedProductOption.data("precio-costo")) || 0;
      precioVentaProducto =
        parseFloat(selectedProductOption.data("precio-venta")) || 0;
      stockActualProducto =
        parseFloat(selectedProductOption.data("stock-actual")) || 0;

      // AUTO-LLENAR precio_venta SOLO si está vacío (para permitir edición manual)
      if ($precioVentaInput.length && precioVentaProducto > 0) {
        const currentValue = $precioVentaInput.val();

        // Solo llenar si está vacío o es "0.00"
        if (
          !currentValue ||
          currentValue === "" ||
          currentValue === "0.00" ||
          currentValue === "0"
        ) {
          $precioVentaInput.val(precioVentaProducto.toFixed(2));
        }
      }
    }

    const cantidad = parseFloat($cantidadInput.val()) || 0;
    const precioVenta =
      parseFloat($precioVentaInput.val()) || precioVentaProducto || 0;

    // --- CALCULO 1: COSTO TOTAL ITEM ---
    const costoTotalItem = costoProductoBase;
    if ($precioCosto.length) {
      updateElementDisplay($precioCosto, costoTotalItem);
    }

    // SUBTOTAL (precio_venta × cantidad)
    let subtotal = precioVenta * cantidad;
    updateElementDisplay($subtotalItemDisplay, subtotal);

    // VALIDACION STOCK
    if ($stockMessage.length) {
      if (cantidad > stockActualProducto) {
        $stockMessage
          .text(`Stock insuficiente. Disponible: ${stockActualProducto}`)
          .addClass("error");
        $cantidadInput.addClass("error");
      } else {
        $stockMessage.text("").removeClass("error");
        $cantidadInput.removeClass("error");
      }
    }

    updateTotalVenta();
  }

  $(document).ready(function () {
    $(document).on(
      "change",
      '.dynamic-detalles_ventas select[name$="-producto"]',
      function () {
        const $row = $(this).closest(".dynamic-detalles_ventas");
        calculateSubtotal($row);
      }
    );

    $(document).on(
      "input",
      '.dynamic-detalles_ventas input[name$="-cantidad"], .dynamic-detalles_ventas input[name$="-precio_venta"]',
      function () {
        const $row = $(this).closest(".dynamic-detalles_ventas");
        calculateSubtotal($row);
      }
    );

    $(document).on("input", "#id_entrego", function () {
      entregoEdited = true; // 🔹 a partir de ahora no lo volvemos a pisar
      updateTotalVenta();
    });

    $(document).on("formset:added", function (event, $newRow) {
      // Forzar a jQuery por las dudas
      $newRow = $($newRow);
      const $precioVentaInput = $newRow.find('input[name$="-precio_venta"]');
      if ($precioVentaInput.length && $precioVentaInput.val() === "")
        $precioVentaInput.val("0.00");
      calculateSubtotal($newRow);
    });

    $(document).on("formset:removed", function (event, $row) {
      updateTotalVenta();
    });

    $(".dynamic-detalles_ventas").each(function () {
      calculateSubtotal($(this));
    });
    updateTotalVenta();
  });
})(django.jQuery);
