(function ($) {
  document.addEventListener("DOMContentLoaded", function () {
    const categoriaSelect = document.getElementById("id_categoria");
    const subcategoriaSelect = document.getElementById("id_sub_categoria");

    function cargarSubcategorias(categoriaId, subcategoriaSeleccionada = null) {
      if (!categoriaId) return;

      fetch(`/productos/get_subcategorias/?categoria_id=${categoriaId}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.subcategorias && Array.isArray(data.subcategorias)) {
            // Guardamos el valor actual
            const valorActual = subcategoriaSelect.value;

            // Limpiamos opciones
            subcategoriaSelect.innerHTML =
              '<option value="">---------</option>';

            data.subcategorias.forEach((subcat) => {
              const option = document.createElement("option");
              option.value = subcat.id;
              option.textContent = subcat.nombre;

              // Seleccionamos la opción correcta
              if (
                (subcategoriaSeleccionada &&
                  parseInt(subcategoriaSeleccionada) === subcat.id) ||
                (valorActual && parseInt(valorActual) === subcat.id)
              ) {
                option.selected = true;
              }

              subcategoriaSelect.appendChild(option);
            });
          }
        })
        .catch((error) => console.error("Error en fetch:", error));
    }

    if (categoriaSelect && subcategoriaSelect) {
      // Al cambiar la categoría
      categoriaSelect.addEventListener("change", function () {
        cargarSubcategorias(this.value);
      });

      // Al cargar la página: usamos data-selected o valor actual
      const categoriaInicial = categoriaSelect.value;
      const subcategoriaInicial =
        subcategoriaSelect.dataset.selected || subcategoriaSelect.value;

      if (categoriaInicial) {
        cargarSubcategorias(categoriaInicial, subcategoriaInicial);
      }
    }
  });
})(django.jQuery);
