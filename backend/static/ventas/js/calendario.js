/**
 * Sistema de Calendario Interactivo para Gestión de Turnos
 *
 * Proporciona funcionalidad completa para un calendario similar a Google Calendar
 * con capacidades de crear, editar, eliminar y navegar turnos.
 */

class CalendarioTurnos {
  constructor() {
    this.config = window.CALENDARIO_CONFIG || {};
    this.turnoActual = null;
    this.fechaSeleccionada = null;
    this.clientesCache = new Map();

    this.initEventListeners();
    this.initModales();
    this.configurarBusquedaClientes();
  }

  /**
   * Inicializa todos los event listeners del calendario.
   */
  initEventListeners() {
    // Navegación de meses
    document.getElementById("mes-anterior")?.addEventListener("click", (e) => {
      this.cambiarMes(e.target.dataset.year, e.target.dataset.month);
    });

    document.getElementById("mes-siguiente")?.addEventListener("click", (e) => {
      this.cambiarMes(e.target.dataset.year, e.target.dataset.month);
    });

    // Botón "Hoy"
    document.getElementById("btn-hoy")?.addEventListener("click", () => {
      this.irAHoy();
    });

    // Nuevo turno desde header
    const btnNuevoTurno = document.getElementById("btn-nuevo-turno");
    if (btnNuevoTurno) {
      btnNuevoTurno.addEventListener("click", (e) => {
        console.log("Click en botón nuevo turno");
        e.preventDefault();
        this.abrirModalTurno();
      });
      console.log("Event listener agregado a btn-nuevo-turno");
    } else {
      console.error("No se encontró el botón btn-nuevo-turno");
    }

    // Clicks en días del calendario
    document.querySelectorAll(".dia-calendario").forEach((dia) => {
      dia.addEventListener("click", (e) => {
        console.log(
          "Click en día calendario:",
          e.target.classList,
          dia.dataset.fecha
        );
        if (
          e.target.classList.contains("plus-icon") ||
          e.target.classList.contains("agregar-turno")
        ) {
          console.log("Click en agregar turno para fecha:", dia.dataset.fecha);
          e.stopPropagation();
          this.abrirModalTurno(dia.dataset.fecha);
        } else if (
          e.target.classList.contains("turno-item") ||
          e.target.closest(".turno-item")
        ) {
          e.stopPropagation();
          const turnoElement = e.target.classList.contains("turno-item")
            ? e.target
            : e.target.closest(".turno-item");
          this.editarTurno(turnoElement.dataset.turnoId);
        } else {
          this.verDetallesDia(dia.dataset.fecha);
        }
      });
    });

    // Cambio de servicio - calcular duración
    document
      .getElementById("servicio-turno")
      ?.addEventListener("change", () => {
        this.calcularHoraFin();
      });

    // Cambio de hora inicio - recalcular fin
    document.getElementById("hora-inicio")?.addEventListener("change", () => {
      this.calcularHoraFin();
    });

    // Formulario de turno
    document.getElementById("form-turno")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.guardarTurno();
    });

    // Eliminar turno
    document.getElementById("btn-eliminar")?.addEventListener("click", () => {
      this.eliminarTurno();
    });
  }

  /**
   * Configura los modales y sus controles.
   */
  initModales() {
    // Cerrar modales
    document.querySelectorAll(".modal-close").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.cerrarModales();
      });
    });

    document
      .querySelectorAll("#btn-cancelar, #btn-cerrar-dia")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          this.cerrarModales();
        });
      });

    // Cerrar modal al hacer click fuera
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.cerrarModales();
        }
      });
    });

    // Nuevo turno desde modal de día
    document
      .getElementById("btn-nuevo-turno-dia")
      ?.addEventListener("click", () => {
        this.cerrarModales();
        this.abrirModalTurno(this.fechaSeleccionada);
      });
  }

  /**
   * Configura la funcionalidad de búsqueda de clientes.
   */
  configurarBusquedaClientes() {
    const searchInput = document.getElementById("cliente-search");
    const resultsContainer = document.getElementById("cliente-resultados");
    let searchTimeout;

    if (!searchInput || !resultsContainer) return;

    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();

      if (query.length < 2) {
        resultsContainer.innerHTML = "";
        resultsContainer.style.display = "none";
        return;
      }

      searchTimeout = setTimeout(() => {
        this.buscarClientes(query);
      }, 300);
    });

    // Ocultar resultados cuando se pierde el foco
    searchInput.addEventListener("blur", () => {
      setTimeout(() => {
        resultsContainer.style.display = "none";
      }, 200);
    });

    searchInput.addEventListener("focus", () => {
      if (resultsContainer.children.length > 0) {
        resultsContainer.style.display = "block";
      }
    });
  }

  /**
   * Cambia el mes del calendario.
   */
  async cambiarMes(year, month) {
    this.mostrarLoading(true);

    try {
      const url = this.config.urls.calendarioMes
        .replace("{year}", year)
        .replace("{month}", month);

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        this.actualizarCalendario(data);
        // Actualizar URL sin recargar página
        const newUrl = `${window.location.pathname}?year=${year}&month=${month}`;
        window.history.pushState({ year, month }, "", newUrl);
      } else {
        this.mostrarError("Error al cargar el calendario");
      }
    } catch (error) {
      console.error("Error cambiando mes:", error);
      this.mostrarError("Error de conexión");
    } finally {
      this.mostrarLoading(false);
    }
  }

  /**
   * Navega al día de hoy.
   */
  irAHoy() {
    const hoy = new Date();
    this.cambiarMes(hoy.getFullYear(), hoy.getMonth() + 1);
  }

  /**
   * Actualiza el calendario con nuevos datos.
   */
  actualizarCalendario(data) {
    // Actualizar título del mes
    document.querySelector(
      ".mes-actual"
    ).textContent = `${data.mes_nombre} ${data.year}`;

    // Actualizar botones de navegación
    const mesAnterior = new Date(data.year, data.month - 2, 1);
    const mesSiguiente = new Date(data.year, data.month, 1);

    const btnAnterior = document.getElementById("mes-anterior");
    if (btnAnterior) {
      btnAnterior.dataset.year = mesAnterior.getFullYear();
      btnAnterior.dataset.month = mesAnterior.getMonth() + 1;
      btnAnterior.textContent = `← ${mesAnterior.toLocaleDateString("es-ES", {
        month: "long",
      })}`;
    }

    const btnSiguiente = document.getElementById("mes-siguiente");
    if (btnSiguiente) {
      btnSiguiente.dataset.year = mesSiguiente.getFullYear();
      btnSiguiente.dataset.month = mesSiguiente.getMonth() + 1;
      btnSiguiente.textContent = `${mesSiguiente.toLocaleDateString("es-ES", {
        month: "long",
      })} →`;
    }

    // Reconstruir el grid del calendario
    this.reconstruirGridCalendario(data);
  }

  /**
   * Reconstruye el grid del calendario con nuevos datos.
   */
  reconstruirGridCalendario(data) {
    const calendarioGrid = document.querySelector(".calendario-grid");
    if (!calendarioGrid) return;

    // Limpiar el grid manteniendo los headers
    const headers = calendarioGrid.querySelectorAll(".dia-semana");
    calendarioGrid.innerHTML = "";

    // Restaurar headers
    headers.forEach((header) => calendarioGrid.appendChild(header));

    // Agregar días del calendario
    data.calendario.forEach((semana) => {
      semana.forEach((dia) => {
        const diaElement = this.crearElementoDia(dia, data);
        calendarioGrid.appendChild(diaElement);
      });
    });

    // Reinstalar event listeners
    this.reinstalarEventListeners();
  }

  /**
   * Crea un elemento de día del calendario.
   */
  crearElementoDia(dia, data) {
    if (dia === 0) {
      const diaVacio = document.createElement("div");
      diaVacio.className = "dia-vacio";
      return diaVacio;
    }

    const fecha = `${data.year}-${String(data.month).padStart(2, "0")}-${String(
      dia
    ).padStart(2, "0")}`;
    const esHoy = fecha === this.config.fechaHoy;

    const diaElement = document.createElement("div");
    diaElement.className = `dia-calendario ${esHoy ? "hoy" : ""}`;
    diaElement.dataset.fecha = fecha;
    diaElement.dataset.dia = dia;

    const numeroDia = document.createElement("div");
    numeroDia.className = "numero-dia";
    numeroDia.textContent = dia;

    const turnosDia = document.createElement("div");
    turnosDia.className = "turnos-dia";
    turnosDia.id = `turnos-${fecha}`;

    // Agregar turnos si existen
    const turnosFecha = data.turnos_por_fecha[fecha] || [];
    turnosFecha.forEach((turno) => {
      const turnoElement = this.crearElementoTurno(turno);
      turnosDia.appendChild(turnoElement);
    });

    const agregarTurno = document.createElement("div");
    agregarTurno.className = "agregar-turno";
    agregarTurno.dataset.fecha = fecha;

    const plusIcon = document.createElement("span");
    plusIcon.className = "plus-icon";
    plusIcon.textContent = "+";
    agregarTurno.appendChild(plusIcon);

    diaElement.appendChild(numeroDia);
    diaElement.appendChild(turnosDia);
    diaElement.appendChild(agregarTurno);

    return diaElement;
  }

  /**
   * Crea un elemento de turno.
   */
  crearElementoTurno(turno) {
    const turnoElement = document.createElement("div");
    turnoElement.className = `turno-item estado-${turno.estado}`;
    turnoElement.dataset.turnoId = turno.id;

    turnoElement.innerHTML = `
            <div class="turno-hora">${turno.hora_inicio}</div>
            <div class="turno-cliente">${turno.cliente}</div>
            <div class="turno-servicio">${turno.servicio}</div>
        `;

    return turnoElement;
  }

  /**
   * Reinstala los event listeners después de actualizar el DOM.
   */
  reinstalarEventListeners() {
    document.querySelectorAll(".dia-calendario").forEach((dia) => {
      dia.addEventListener("click", (e) => {
        if (
          e.target.classList.contains("plus-icon") ||
          e.target.classList.contains("agregar-turno")
        ) {
          e.stopPropagation();
          this.abrirModalTurno(dia.dataset.fecha);
        } else if (
          e.target.classList.contains("turno-item") ||
          e.target.closest(".turno-item")
        ) {
          e.stopPropagation();
          const turnoElement = e.target.classList.contains("turno-item")
            ? e.target
            : e.target.closest(".turno-item");
          this.editarTurno(turnoElement.dataset.turnoId);
        } else {
          this.verDetallesDia(dia.dataset.fecha);
        }
      });
    });
  }

  /**
   * Abre el modal para crear/editar turno.
   */
  abrirModalTurno(fecha = null, turnoData = null) {
    console.log("abrirModalTurno llamado con:", fecha, turnoData);
    const modal = document.getElementById("modal-turno");
    const form = document.getElementById("form-turno");

    if (!modal) {
      console.error("No se encontró el modal modal-turno");
      return;
    }
    if (!form) {
      console.error("No se encontró el formulario form-turno");
      return;
    }

    // Resetear formulario
    form.reset();
    document.getElementById("cliente-id").value = "";
    document.getElementById("cliente-resultados").innerHTML = "";
    document.getElementById("btn-eliminar").style.display = "none";

    if (turnoData) {
      // Modo edición
      document.getElementById("modal-titulo").textContent = "Editar Turno";
      this.cargarDatosTurno(turnoData);
      document.getElementById("btn-eliminar").style.display = "inline-block";
      this.turnoActual = turnoData;
    } else {
      // Modo creación
      document.getElementById("modal-titulo").textContent = "Nuevo Turno";
      this.turnoActual = null;

      // Pre-llenar fecha si se proporciona
      if (fecha) {
        document.getElementById("fecha-turno").value = fecha;
      } else {
        document.getElementById("fecha-turno").value = this.config.fechaHoy;
      }

      // Pre-llenar hora según configuración
      const ahora = new Date();
      const horaActual = `${String(ahora.getHours()).padStart(2, "0")}:${String(
        Math.ceil(ahora.getMinutes() / 15) * 15
      )
        .toString()
        .padStart(2, "0")}`;
      document.getElementById("hora-inicio").value = horaActual;
    }

    modal.style.display = "block";
  }

  /**
   * Carga los datos de un turno en el formulario para edición.
   */
  cargarDatosTurno(turno) {
    document.getElementById("fecha-turno").value = turno.fecha;
    document.getElementById("hora-inicio").value = turno.hora_inicio;
    document.getElementById("hora-fin").value = turno.hora_fin;
    document.getElementById("servicio-turno").value = turno.servicio.id;
    document.getElementById("estado-turno").value = turno.estado;
    document.getElementById("motivo-turno").value = turno.motivo;

    // Cargar cliente
    document.getElementById("cliente-search").value =
      turno.cliente.nombre_apellido;
    document.getElementById("cliente-id").value = turno.cliente.id;
  }

  /**
   * Edita un turno existente.
   */
  async editarTurno(turnoId) {
    this.mostrarLoading(true);

    try {
      // En una implementación real, harías una llamada API para obtener los detalles
      // Por ahora, vamos a usar los datos que ya tenemos
      const turnoElement = document.querySelector(
        `[data-turno-id="${turnoId}"]`
      );
      if (!turnoElement) return;

      // Obtener datos completos del turno
      const fecha = turnoElement.closest(".dia-calendario").dataset.fecha;
      const response = await fetch(
        `${this.config.urls.turnosFecha}?fecha=${fecha}`
      );
      const data = await response.json();

      const turno = data.turnos.find((t) => t.id == turnoId);
      if (turno) {
        this.abrirModalTurno(null, turno);
      }
    } catch (error) {
      console.error("Error cargando turno:", error);
      this.mostrarError("Error al cargar los datos del turno");
    } finally {
      this.mostrarLoading(false);
    }
  }

  /**
   * Ve los detalles completos de un día.
   */
  async verDetallesDia(fecha) {
    this.fechaSeleccionada = fecha;
    this.mostrarLoading(true);

    try {
      const response = await fetch(
        `${this.config.urls.turnosFecha}?fecha=${fecha}`
      );
      const data = await response.json();

      if (response.ok) {
        this.mostrarModalDia(fecha, data.turnos);
      } else {
        this.mostrarError("Error al cargar los turnos del día");
      }
    } catch (error) {
      console.error("Error cargando día:", error);
      this.mostrarError("Error de conexión");
    } finally {
      this.mostrarLoading(false);
    }
  }

  /**
   * Muestra el modal con los detalles del día.
   */
  mostrarModalDia(fecha, turnos) {
    const modal = document.getElementById("modal-dia");
    const titulo = document.getElementById("modal-dia-titulo");
    const contenido = document.getElementById("turnos-del-dia");

    if (!modal || !titulo || !contenido) return;

    // Formatear fecha para mostrar
    const fechaObj = new Date(fecha + "T00:00:00");
    const fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    titulo.textContent = `Turnos - ${fechaFormateada}`;

    // Generar contenido
    if (turnos.length === 0) {
      contenido.innerHTML = `
                <div class="text-center" style="padding: 40px;">
                    <h3>No hay turnos programados</h3>
                    <p>Este día no tiene turnos asignados.</p>
                </div>
            `;
    } else {
      let html = '<div class="turnos-lista">';

      turnos.forEach((turno) => {
        html += `
                    <div class="turno-detalle estado-${
                      turno.estado
                    }" data-turno-id="${turno.id}">
                        <div class="turno-header">
                            <span class="turno-time">${turno.hora_inicio} - ${
          turno.hora_fin
        }</span>
                            <span class="turno-estado estado-${
                              turno.estado
                            }">${this.getEstadoLabel(turno.estado)}</span>
                        </div>
                        <div class="turno-info">
                            <strong>${turno.cliente.nombre_apellido}</strong>
                            <span class="turno-servicio-info">${
                              turno.servicio.nombre
                            }</span>
                            ${
                              turno.motivo
                                ? `<div class="turno-motivo">${turno.motivo}</div>`
                                : ""
                            }
                        </div>
                        <div class="turno-acciones">
                            <button class="btn-accion editar" onclick="calendario.editarTurno(${
                              turno.id
                            })">✏️</button>
                            <button class="btn-accion eliminar" onclick="calendario.confirmarEliminar(${
                              turno.id
                            })">🗑️</button>
                        </div>
                    </div>
                `;
      });

      html += "</div>";
      contenido.innerHTML = html;
    }

    modal.style.display = "block";
  }

  /**
   * Busca clientes y muestra resultados.
   */
  async buscarClientes(query) {
    try {
      const response = await fetch(
        `${this.config.urls.buscarClientes}?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      if (response.ok) {
        this.mostrarResultadosClientes(data.clientes);
      }
    } catch (error) {
      console.error("Error buscando clientes:", error);
    }
  }

  /**
   * Muestra los resultados de búsqueda de clientes.
   */
  mostrarResultadosClientes(clientes) {
    const container = document.getElementById("cliente-resultados");
    if (!container) return;

    if (clientes.length === 0) {
      container.innerHTML =
        '<div class="cliente-resultado">No se encontraron clientes</div>';
    } else {
      container.innerHTML = clientes
        .map(
          (cliente) => `
                <div class="cliente-resultado" onclick="calendario.seleccionarCliente(${cliente.id}, '${cliente.nombre_apellido}')">
                    <div class="cliente-nombre">${cliente.nombre_apellido}</div>
                    <div class="cliente-info">DNI: ${cliente.dni} | ${cliente.telefono}</div>
                </div>
            `
        )
        .join("");
    }

    container.style.display = "block";
  }

  /**
   * Selecciona un cliente de los resultados de búsqueda.
   */
  seleccionarCliente(clienteId, nombre) {
    document.getElementById("cliente-search").value = nombre;
    document.getElementById("cliente-id").value = clienteId;
    document.getElementById("cliente-resultados").style.display = "none";
  }

  /**
   * Calcula automáticamente la hora de fin basada en el servicio seleccionado.
   */
  calcularHoraFin() {
    const servicioSelect = document.getElementById("servicio-turno");
    const horaInicio = document.getElementById("hora-inicio").value;
    const horaFinInput = document.getElementById("hora-fin");

    if (!servicioSelect.value || !horaInicio) return;

    const servicioOption = servicioSelect.options[servicioSelect.selectedIndex];
    const duracion = servicioOption.dataset.duracion;

    if (duracion) {
      const [horas, minutos] = duracion.split(":").map(Number);
      const inicio = new Date(`2000-01-01T${horaInicio}:00`);
      const fin = new Date(
        inicio.getTime() + (horas * 3600 + minutos * 60) * 1000
      );

      horaFinInput.value = fin.toTimeString().slice(0, 5);
    }
  }

  /**
   * Guarda un turno (crear o actualizar).
   */
  async guardarTurno() {
    const formData = this.recopilarDatosFormulario();

    if (!this.validarFormulario(formData)) return;

    this.mostrarLoading(true);

    try {
      const url = this.turnoActual
        ? this.config.urls.actualizarTurno
        : this.config.urls.crearTurno;

      if (this.turnoActual) {
        formData.turno_id = this.turnoActual.id;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": this.config.csrfToken,
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        this.mostrarExito(
          this.turnoActual
            ? "Turno actualizado correctamente"
            : "Turno creado correctamente"
        );
        this.cerrarModales();
        this.actualizarTurnoEnCalendario(result.turno);
      } else {
        this.mostrarError(result.error || "Error al guardar el turno");
      }
    } catch (error) {
      console.error("Error guardando turno:", error);
      this.mostrarError("Error de conexión");
    } finally {
      this.mostrarLoading(false);
    }
  }

  /**
   * Recopila los datos del formulario.
   */
  recopilarDatosFormulario() {
    return {
      cliente_id: document.getElementById("cliente-id").value,
      servicio_id: document.getElementById("servicio-turno").value,
      fecha: document.getElementById("fecha-turno").value,
      hora_inicio: document.getElementById("hora-inicio").value,
      estado: document.getElementById("estado-turno").value,
      motivo: document.getElementById("motivo-turno").value,
    };
  }

  /**
   * Valida el formulario antes de enviar.
   */
  validarFormulario(data) {
    if (!data.cliente_id) {
      this.mostrarError("Debe seleccionar un cliente");
      return false;
    }

    if (!data.servicio_id) {
      this.mostrarError("Debe seleccionar un servicio");
      return false;
    }

    if (!data.fecha) {
      this.mostrarError("Debe especificar una fecha");
      return false;
    }

    if (!data.hora_inicio) {
      this.mostrarError("Debe especificar una hora de inicio");
      return false;
    }

    return true;
  }

  /**
   * Actualiza un turno en el calendario después de guardarlo.
   */
  actualizarTurnoEnCalendario(turno) {
    const turnosContainer = document.getElementById(`turnos-${turno.fecha}`);
    if (!turnosContainer) return;

    if (this.turnoActual) {
      // Actualizar turno existente
      const turnoElement = document.querySelector(
        `[data-turno-id="${turno.id}"]`
      );
      if (turnoElement) {
        turnoElement.outerHTML = this.crearElementoTurno(turno).outerHTML;
      }
    } else {
      // Agregar nuevo turno
      const turnoElement = this.crearElementoTurno(turno);
      turnoElement.classList.add("nuevo");
      turnosContainer.appendChild(turnoElement);
    }

    // Reinstalar event listeners
    this.reinstalarEventListeners();
  }

  /**
   * Elimina un turno.
   */
  async eliminarTurno() {
    if (!this.turnoActual) return;

    if (!confirm("¿Está seguro de que desea cancelar este turno?")) return;

    this.mostrarLoading(true);

    try {
      const url = this.config.urls.eliminarTurno.replace(
        "{turno_id}",
        this.turnoActual.id
      );

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": this.config.csrfToken,
        },
      });

      const result = await response.json();

      if (response.ok) {
        this.mostrarExito("Turno cancelado correctamente");
        this.cerrarModales();

        // Remover del calendario
        const turnoElement = document.querySelector(
          `[data-turno-id="${this.turnoActual.id}"]`
        );
        if (turnoElement) {
          turnoElement.remove();
        }
      } else {
        this.mostrarError(result.error || "Error al cancelar el turno");
      }
    } catch (error) {
      console.error("Error eliminando turno:", error);
      this.mostrarError("Error de conexión");
    } finally {
      this.mostrarLoading(false);
    }
  }

  /**
   * Confirma la eliminación de un turno desde la vista del día.
   */
  async confirmarEliminar(turnoId) {
    if (!confirm("¿Está seguro de que desea cancelar este turno?")) return;

    this.mostrarLoading(true);

    try {
      const url = this.config.urls.eliminarTurno.replace("{turno_id}", turnoId);

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": this.config.csrfToken,
        },
      });

      const result = await response.json();

      if (response.ok) {
        this.mostrarExito("Turno cancelado correctamente");

        // Actualizar vista del día
        if (this.fechaSeleccionada) {
          this.verDetallesDia(this.fechaSeleccionada);
        }

        // Remover del calendario
        const turnoElement = document.querySelector(
          `[data-turno-id="${turnoId}"]`
        );
        if (turnoElement) {
          turnoElement.remove();
        }
      } else {
        this.mostrarError(result.error || "Error al cancelar el turno");
      }
    } catch (error) {
      console.error("Error eliminando turno:", error);
      this.mostrarError("Error de conexión");
    } finally {
      this.mostrarLoading(false);
    }
  }

  /**
   * Cierra todos los modales abiertos.
   */
  cerrarModales() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.style.display = "none";
    });
    this.turnoActual = null;
    this.fechaSeleccionada = null;
  }

  /**
   * Muestra/oculta el overlay de carga.
   */
  mostrarLoading(mostrar) {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.style.display = mostrar ? "flex" : "none";
    }
  }

  /**
   * Muestra un mensaje de éxito.
   */
  mostrarExito(mensaje) {
    // Implementar sistema de notificaciones
    alert(`✅ ${mensaje}`);
  }

  /**
   * Muestra un mensaje de error.
   */
  mostrarError(mensaje) {
    // Implementar sistema de notificaciones
    alert(`❌ ${mensaje}`);
  }

  /**
   * Obtiene la etiqueta legible para un estado de turno.
   */
  getEstadoLabel(estado) {
    const estados = {
      programado: "Programado",
      confirmado: "Confirmado",
      en_curso: "En Curso",
      completado: "Completado",
      cancelado: "Cancelado",
      no_asistio: "No Asistió",
      reprogramado: "Reprogramado",
    };
    return estados[estado] || estado;
  }
}

// Inicializar el calendario cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando calendario...");
  console.log("Configuración:", window.CALENDARIO_CONFIG);

  try {
    window.calendario = new CalendarioTurnos();
    console.log("Calendario inicializado correctamente");
  } catch (error) {
    console.error("Error al inicializar calendario:", error);
  }
});

// Agregar filtro personalizado para templates
if (typeof django !== "undefined" && django.jQuery) {
  django.jQuery.extend(django.jQuery.expr[":"], {
    lookup: function (element, index, match) {
      return element.getAttribute("data-" + match[3]) !== null;
    },
  });
}
