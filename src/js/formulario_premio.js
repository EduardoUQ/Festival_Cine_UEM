// =======================
// MODAL (igual que calendario) - versión robusta
// =======================
let accionConfirmada = null;
let redireccion = null;

function getModalEls() {
  const modal = document.getElementById("modal_mensaje");
  const modalIcono = document.getElementById("modal_icono");
  const modalTitulo = document.getElementById("modal_titulo");
  const modalTexto = document.getElementById("modal_texto");
  const modalBtn = document.getElementById("modalBtn");
  const modalBtnCancel = document.getElementById("modalBtnCancel");

  const modalDisponible =
    modal && modalIcono && modalTitulo && modalTexto && modalBtn;

  return {
    modal,
    modalIcono,
    modalTitulo,
    modalTexto,
    modalBtn,
    modalBtnCancel,
    modalDisponible,
  };
}

function mostrarModal(tipo, mensaje, redirect = null) {
  const {
    modal,
    modalIcono,
    modalTitulo,
    modalTexto,
    modalBtnCancel,
    modalDisponible,
  } = getModalEls();

  if (!modalDisponible) {
    console.error(
      "Modal no disponible: revisa que exista el HTML del modal y que los IDs coincidan."
    );
    // Fallback: al menos redirigir si hay redirect
    if (redirect) window.location.href = redirect;
    return;
  }

  modal.className = "modal mostrar";

  modalIcono.className = "fa-solid";
  modal.classList.remove("modal_exito", "modal_error");

  if (tipo === "success") {
    modal.classList.add("modal_exito");
    modalIcono.classList.add("fa-circle-check");
    modalTitulo.textContent = "Operación correcta";
  } else {
    modal.classList.add("modal_error");
    modalIcono.classList.add("fa-circle-xmark");
    modalTitulo.textContent = "Error";
  }

  modalTexto.textContent = mensaje;
  redireccion = redirect;
  accionConfirmada = null;

  if (modalBtnCancel) modalBtnCancel.style.display = "none";
}

function mostrarConfirmacion(mensajeConfirmacion, onConfirm) {
  const {
    modal,
    modalIcono,
    modalTitulo,
    modalTexto,
    modalBtnCancel,
    modalDisponible,
  } = getModalEls();

  if (!modalDisponible) {
    console.error("Modal no disponible para confirmación.");
    return;
  }

  modal.className = "modal mostrar";
  modalIcono.className = "fa-solid";
  modal.classList.remove("modal_exito", "modal_error");

  modal.classList.add("modal_error");
  modalIcono.classList.add("fa-triangle-exclamation");
  modalTitulo.textContent = "Confirmación";
  modalTexto.textContent = mensajeConfirmacion;

  redireccion = null;
  accionConfirmada = onConfirm;

  if (modalBtnCancel) modalBtnCancel.style.display = "inline-block";
}

function iniciarListenersModal() {
  const { modal, modalBtn, modalBtnCancel, modalDisponible } = getModalEls();
  if (!modalDisponible) return;

  // Evita duplicar listeners (si se llama más de una vez)
  if (modalBtn.dataset.listener === "1") return;
  modalBtn.dataset.listener = "1";

  modalBtn.addEventListener("click", () => {
    modal.classList.remove("mostrar");

    //Si venimos de una confirmación, ejecutamos la acción
    if (accionConfirmada) {
      const fn = accionConfirmada;
      accionConfirmada = null;
      fn();
      return;
    }

    //Si venimos de un mensaje normal con redirección
    if (redireccion) {
      window.location.href = redireccion;
    }
  });

  if (modalBtnCancel) {
    modalBtnCancel.addEventListener("click", () => {
      modal.classList.remove("mostrar");
      modalBtnCancel.style.display = "none";
      accionConfirmada = null;
      redireccion = null;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Iniciar listeners del modal cuando el DOM ya existe
  iniciarListenersModal();

  fetch("../php/session_info.php")
    .then((response) => response.json())
    .then((info) => {
      if (!info.logged || info.rol !== "admin") {
        window.location.href = "../html/login.html";
        return;
      }

      // Para poner el nombre
      const elNombre = document.getElementById("user_nombre");
      if (elNombre) elNombre.textContent = info.nombre;

      // Logout
      const btnLogout = document.getElementById("btn_logout");
      if (btnLogout) {
        btnLogout.addEventListener("click", () => {
          fetch("../php/logout.php", { method: "POST" })
            .then((r) => r.json())
            .then((resp) => {
              if (resp.status === "success") {
                window.location.href = "../html/login.html";
              } else {
                mostrarModal("error", "No se pudo cerrar sesión");
              }
            })
            .catch((err) => {
              console.error("Error al cerrar sesión", err);
              mostrarModal("error", "Error al cerrar sesión. Observa la consola.");
            });
        });
      }

      iniciarFormularioPremio();
    })
    .catch((error) => {
      console.error("No se pudo comprobar la sesión:", error);
      window.location.href = "../html/login.html";
    });
});

function getPremioIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  return id ? id : null;
}

function iniciarFormularioPremio() {
  const form = document.getElementById("formulario-premio");
  if (!form) return;

  // Inputs
  // OJO: ahora la categoría es select + input oculto para "nueva"
  const campoCategoriaSelect = document.getElementById("categoria_select");
  const campoCategoriaNueva = document.getElementById("categoria_nueva");

  const campoPuesto = document.getElementById("puesto");
  const campoDescripcion = document.getElementById("descripcion");
  const campoDotacion = document.getElementById("dotacion");
  const campoActiva = document.getElementById("activa");

  // Mensajes validaciones
  const msgCategoria = document.getElementById("mensaje_categoria");
  const msgPuesto = document.getElementById("mensaje_puesto");
  const msgDescripcion = document.getElementById("mensaje_descripcion");
  const msgDotacion = document.getElementById("mensaje_dotacion");
  const msgActiva = document.getElementById("mensaje_activa");
  const msgFormulario = document.getElementById("mensaje_formulario");

  const premioId = getPremioIdFromUrl();

  // Cancelar: volver al panel (crear y editar)
  const btnCancelar = document.getElementById("btn_cancelar");
  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      window.location.href = "panel_premios.html";
    });
  }

  // ---- CATEGORÍAS: cargar existentes + gestionar "nueva" ----

  function actualizarUICategoria() {
    if (!campoCategoriaSelect || !campoCategoriaNueva) return;

    const esNueva = campoCategoriaSelect.value === "nueva"; // tu value
    campoCategoriaNueva.style.display = esNueva ? "block" : "none";

    if (!esNueva) {
      campoCategoriaNueva.value = "";
      campoCategoriaNueva.classList.remove("error");
      campoCategoriaNueva.setCustomValidity("");
    }
  }

  function cargarCategorias() {
    if (!campoCategoriaSelect) return Promise.resolve();

    return fetch("../php/listar_categorias_premios.php")
      .then((r) => r.json())
      .then((data) => {
        if (!data || data.status !== "success") return;

        const optNueva = campoCategoriaSelect.querySelector(
          'option[value="nueva"]'
        );

        (data.categorias || []).forEach((cat) => {
          if (!cat) return;

          const yaExiste = [...campoCategoriaSelect.options].some(
            (o) => o.value === cat
          );
          if (yaExiste) return;

          const opt = document.createElement("option");
          opt.value = cat;
          opt.textContent = cat;

          if (optNueva) {
            campoCategoriaSelect.insertBefore(opt, optNueva);
          } else {
            campoCategoriaSelect.appendChild(opt);
          }
        });
      })
      .catch((err) => console.error("Error cargando categorías:", err));
  }

  // Limpiar mensajes
  function limpiarMensajes() {
    if (msgCategoria) msgCategoria.textContent = "";
    if (msgPuesto) msgPuesto.textContent = "";
    if (msgDescripcion) msgDescripcion.textContent = "";
    if (msgDotacion) msgDotacion.textContent = "";
    if (msgActiva) msgActiva.textContent = "";
    if (msgFormulario) msgFormulario.textContent = "";
  }

  // Validación vacío
  function validarCampoVacio(campo, mensaje, elMsg) {
    if (!campo) return true;

    if (campo.value.trim() === "") {
      campo.classList.add("error");
      campo.setCustomValidity(mensaje);
      if (elMsg) elMsg.textContent = mensaje;
      return false;
    } else {
      campo.classList.remove("error");
      campo.setCustomValidity("");
      if (elMsg) elMsg.textContent = "";
      return true;
    }
  }

  function validarCategoria() {
    if (!campoCategoriaSelect) return true;

    if (campoCategoriaSelect.value && campoCategoriaSelect.value !== "nueva") {
      campoCategoriaSelect.classList.remove("error");
      campoCategoriaSelect.setCustomValidity("");
      if (msgCategoria) msgCategoria.textContent = "";
      return true;
    }

    if (campoCategoriaSelect.value === "nueva") {
      if (!campoCategoriaNueva) return false;

      const v = campoCategoriaNueva.value.trim();
      if (v === "") {
        const m = "*Debes escribir la nueva categoría";
        campoCategoriaNueva.classList.add("error");
        campoCategoriaNueva.setCustomValidity(m);
        if (msgCategoria) msgCategoria.textContent = m;
        return false;
      }
      if (v.length > 30) {
        const m = "La categoría no puede superar 30 caracteres";
        campoCategoriaNueva.classList.add("error");
        campoCategoriaNueva.setCustomValidity(m);
        if (msgCategoria) msgCategoria.textContent = m;
        return false;
      }

      campoCategoriaNueva.classList.remove("error");
      campoCategoriaNueva.setCustomValidity("");
      if (msgCategoria) msgCategoria.textContent = "";
      return true;
    }

    const m = "*Debes seleccionar una categoría";
    campoCategoriaSelect.classList.add("error");
    campoCategoriaSelect.setCustomValidity(m);
    if (msgCategoria) msgCategoria.textContent = m;
    return false;
  }

  function validarPuesto() {
    if (!campoPuesto) return true;

    if (!validarCampoVacio(campoPuesto, "*Debes indicar un puesto", msgPuesto)) {
      return false;
    }

    const valor = parseInt(campoPuesto.value, 10);
    if (Number.isNaN(valor) || valor < 0) {
      const m = "El puesto debe ser un número 0 o mayor";
      campoPuesto.classList.add("error");
      campoPuesto.setCustomValidity(m);
      if (msgPuesto) msgPuesto.textContent = m;
      return false;
    }

    campoPuesto.classList.remove("error");
    campoPuesto.setCustomValidity("");
    if (msgPuesto) msgPuesto.textContent = "";
    return true;
  }

  function validarDescripcion() {
    return validarCampoVacio(
      campoDescripcion,
      "*Debes indicar una descripción",
      msgDescripcion
    );
  }

  function validarDotacion() {
    if (!campoDotacion) return true;

    const v = campoDotacion.value.trim();
    if (v === "") {
      campoDotacion.classList.remove("error");
      campoDotacion.setCustomValidity("");
      if (msgDotacion) msgDotacion.textContent = "";
      return true;
    }

    const valor = Number(v);
    if (Number.isNaN(valor) || valor < 0) {
      const m = "La dotación debe ser un número igual o mayor que 0";
      campoDotacion.classList.add("error");
      campoDotacion.setCustomValidity(m);
      if (msgDotacion) msgDotacion.textContent = m;
      return false;
    }

    campoDotacion.classList.remove("error");
    campoDotacion.setCustomValidity("");
    if (msgDotacion) msgDotacion.textContent = "";
    return true;
  }

  function validarActiva() {
    if (!campoActiva) return true;

    const v = campoActiva.value;
    if (v !== "0" && v !== "1") {
      const m = "Debes seleccionar un estado válido";
      campoActiva.classList.add("error");
      campoActiva.setCustomValidity(m);
      if (msgActiva) msgActiva.textContent = m;
      return false;
    }

    campoActiva.classList.remove("error");
    campoActiva.setCustomValidity("");
    if (msgActiva) msgActiva.textContent = "";
    return true;
  }

  // Listeners blur / change
  if (campoCategoriaSelect) {
    campoCategoriaSelect.addEventListener("change", () => {
      actualizarUICategoria();
      validarCategoria();
    });
    campoCategoriaSelect.addEventListener("blur", validarCategoria);
  }
  if (campoCategoriaNueva) {
    campoCategoriaNueva.addEventListener("blur", validarCategoria);
  }

  if (campoPuesto) campoPuesto.addEventListener("blur", validarPuesto);
  if (campoDescripcion) campoDescripcion.addEventListener("blur", validarDescripcion);
  if (campoDotacion) campoDotacion.addEventListener("blur", validarDotacion);
  if (campoActiva) campoActiva.addEventListener("blur", validarActiva);

  // ---- INICIO REAL: primero categorías, luego (si edición) cargar premio ----
  cargarCategorias().then(() => {
    actualizarUICategoria();

    if (premioId) {
      const h1 = document.querySelector(".card h1");
      if (h1) h1.textContent = "EDITAR PREMIO";

      const btnSubmit = form.querySelector('button[type="submit"]');
      if (btnSubmit) btnSubmit.textContent = "Guardar cambios";

      fetch(`../php/editar_premio.php?id=${encodeURIComponent(premioId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.status !== "success") {
            if (msgFormulario)
              msgFormulario.textContent =
                data.message || "No se pudo cargar el premio";
            return;
          }

          const p = data.premio;

          if (campoCategoriaSelect) {
            const cat = p.categoria ?? "";
            const existe = [...campoCategoriaSelect.options].some(
              (o) => o.value === cat
            );

            if (existe) {
              campoCategoriaSelect.value = cat;
              actualizarUICategoria();
            } else {
              campoCategoriaSelect.value = "nueva";
              actualizarUICategoria();
              if (campoCategoriaNueva) campoCategoriaNueva.value = cat;
            }
          }

          campoPuesto.value = p.puesto ?? "";
          campoDescripcion.value = p.descripcion ?? "";
          campoDotacion.value = p.dotacion === null ? "" : p.dotacion;
          campoActiva.value = String(p.activa ?? "1");
        })
        .catch((err) => {
          console.error("Error cargando premio:", err);
          if (msgFormulario)
            msgFormulario.textContent =
              "Error cargando el premio. Observa la consola.";
        });
    }
  });

  // Submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    limpiarMensajes();

    const ok =
      validarCategoria() &
      validarPuesto() &
      validarDescripcion() &
      validarDotacion() &
      validarActiva();

    if (!ok) {
      if (msgFormulario) msgFormulario.textContent = "Revisa los campos marcados.";
      return;
    }

    // Datos
    let categoria = "";
    if (campoCategoriaSelect && campoCategoriaSelect.value === "nueva") {
      categoria = (campoCategoriaNueva?.value ?? "").trim();
    } else {
      categoria = (campoCategoriaSelect?.value ?? "").trim();
    }

    const puesto = parseInt(campoPuesto.value, 10);
    const descripcion = campoDescripcion.value.trim();
    const dotacion = campoDotacion.value.trim();
    const activa = campoActiva.value;

    const formData = new FormData();

    // Crear vs editar
    const idActual = getPremioIdFromUrl();
    formData.append("funcion", idActual ? "editarPremio" : "crearPremio");
    if (idActual) formData.append("id", idActual);

    formData.append("categoria", categoria);
    formData.append("puesto", String(puesto));
    formData.append("descripcion", descripcion);
    formData.append("dotacion", dotacion);
    formData.append("activa", activa);

    // Fetch
    fetch("../php/formulario_premio.php", {
      method: "POST",
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          mostrarModal(
            "success",
            idActual ? "Premio actualizado con éxito" : "Premio creado con éxito",
            "panel_premios.html"
          );
        } else {
          const m = data.message || "Error al guardar el premio";
          if (msgFormulario) msgFormulario.textContent = m;
          mostrarModal("error", m);
          console.error("Respuesta servidor:", data);
        }
      })
      .catch((error) => {
        console.error("Error en el fetch de formulario_premio.php", error);
        const m = "Error de comunicación con el servidor. Observa la consola.";
        if (msgFormulario) msgFormulario.textContent = m;
        mostrarModal("error", m);
      });
  });
}
