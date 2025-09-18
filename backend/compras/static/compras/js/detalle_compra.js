(function ($) {
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

  function updateTotalCompra() {
    let total = 0;
    $(
      '.dynamic-detalles_productos .field-subtotal p:not([name*="__prefix__"])'
    ).each(function () {
      total += parseFloat($(this).text().replace(",", ".")) || 0;
    });
    const $totalCompraDisplay = $(".field-total .readonly");
    if ($totalCompraDisplay.length) {
      updateElementDisplay($totalCompraDisplay, total);
    }
  }

  function calculateSubtotal($row) {
    const $productoSelect = $row.find('select[name$="-producto"]');
    const $cantidadInput = $row.find('input[name$="-cantidad"]');
    const $precioUnitarioDisplay = $row.find('input[name$="-precio_unitario"]');
    const $subtotalDisplay = $row.find(".field-subtotal p");

    let costoProductoBase = 0;

    //const selectedProductOption = $productoSelect.find("option:selected");
    const cantidad = parseFloat($cantidadInput.val()) || 0;
    const precio_unitario = parseFloat($precioUnitarioDisplay.val()) || 0;

    // SUBTOTAL
    let subtotal = precio_unitario * cantidad;
    updateElementDisplay($subtotalDisplay, subtotal);

    updateTotalCompra();
  }

  $(document).ready(function () {
    $(document).on(
      "change",
      '.dynamic-detalles_productos select[name$="-producto"]',
      function () {
        const $row = $(this).closest(".dynamic-detalles_productos");
        calculateSubtotal($row);
      }
    );

    $(document).on(
      "input",
      '.dynamic-detalles_productos input[name$="-cantidad"], .dynamic-detalles_productos input[name$="-precio_unitario"]',
      function () {
        const $currentRow = $(this).closest(".dynamic-detalles_productos");
        if ($currentRow.length) {
          calculateSubtotal($currentRow);
        }
      }
    );

    $(document).on("formset:added", function (event, $newRow) {
      // Forzar a jQuery por las dudas
      $newRow = $($newRow);
      calculateSubtotal($newRow);
    });

    $(document).on("formset:removed", function (event, $row) {
      updateTotalCompra();
    });

    $(".dynamic-detalles_productos").each(function () {
      calculateSubtotal($(this));
    });
    updateTotalCompra();
  });
})(django.jQuery);
