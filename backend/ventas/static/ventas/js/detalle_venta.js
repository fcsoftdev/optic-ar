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
    const $porcentajeGananciaInput = $row.find(
      'input[name$="-porcentaje_ganancia"]'
    );

    const $precioUnitarioDisplay = $row.find(".field-precio_unitario p");
    const $subtotalItemDisplay = $row.find(".field-subtotal_item p");
    const $stockMessage = $row.find(".stock-message");

    let costoProductoBase = 0;
    let stockActualProducto = 0;

    const selectedProductOption = $productoSelect.find("option:selected");

    if (selectedProductOption.length && selectedProductOption.val()) {
      costoProductoBase =
        parseFloat(selectedProductOption.data("precio-costo")) || 0;
      stockActualProducto =
        parseFloat(selectedProductOption.data("stock-actual")) || 0;
    }

    const cantidad = parseFloat($cantidadInput.val()) || 0;
    const porcentajeGanancia = parseFloat($porcentajeGananciaInput.val()) || 0;

    // --- CALCULO 1: COSTO TOTAL ITEM ---
    const costoTotalItem = costoProductoBase;
    if ($precioCosto.length) {
      updateElementDisplay($precioCosto, costoTotalItem);
    }

    // PRECIO UNITARIO
    let precioUnitario = costoProductoBase * (1 + porcentajeGanancia / 100);
    if (porcentajeGanancia > 0) precioUnitario = precioUnitario;

    updateElementDisplay($precioUnitarioDisplay, precioUnitario);

    // SUBTOTAL
    let subtotal = precioUnitario * cantidad;
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
      '.dynamic-detalles_ventas input[name$="-cantidad"], .dynamic-detalles_ventas input[name$="-porcentaje_ganancia"]',
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
      const $porcentajeInput = $newRow.find(
        'input[name$="-porcentaje_ganancia"]'
      );
      if ($porcentajeInput.length && $porcentajeInput.val() === "")
        $porcentajeInput.val("0");
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
