// =======================
// SESIÓN + INIT
// =======================
document.addEventListener("DOMContentLoaded", () => {
  fetch("../php/session_info.php")
    .then((response) => response.json())
    .then((info) => {
      if (!info.logged || info.rol !== "admin") {
        window.location.href = "../html/login.html";
        return;
      }

      const elNombre = document.getElementById("nombre");
      if (elNombre) elNombre.textContent = info.nombre;

      const btnLogout = document.getElementById("btn_logout");
      if (btnLogout) {
        btnLogout.addEventListener("click", () => {
          fetch("../php/logout.php", { method: "POST" })
            .then((r) => r.json())
            .then((resp) => {
              if (resp.status === "success") {
                window.location.href = "../html/login.html";
              } else {
                alert("No se pudo cerrar sesión");
              }
            })
            .catch((err) => {
              console.error("Error al cerrar sesión", err);
              alert("Error al cerrar sesión. Observa la consola.");
            });
        });
      }

      inicializarPanelGanadores();
    })
    .catch((error) => {
      console.error("No se pudo comprobar la sesión:", error);
      window.location.href = "../html/login.html";
    });
});

// =======================
// MODAL
// =======================
const modal = document.getElementById("modal_mensaje");
const modalIcono = document.getElementById("modal_icono");
const modalTitulo = document.getElementById("modal_titulo");
const modalTexto = document.getElementById("modal_texto");
const modalBtn = document.getElementById("modalBtn");
const modalBtnCancel = document.getElementById("modalBtnCancel");

let redireccion = null;
let onConfirm = null;

function mostrarModal(tipo, mensaje, redirect = null) {
  modal.className = "modal mostrar";
  modalIcono.className = "fa-solid";
  modal.classList.remove("modal_exito", "modal_error");

  if (modalBtnCancel) modalBtnCancel.style.display = "none";
  onConfirm = null;

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
}

function mostrarModalConfirmacion(mensaje, callbackConfirm) {
  modal.className = "modal mostrar";
  modalIcono.className = "fa-solid";
  modal.classList.remove("modal_exito", "modal_error");
  modal.classList.add("modal_error");

  modalIcono.classList.add("fa-triangle-exclamation");
  modalTitulo.textContent = "Confirmación";
  modalTexto.textContent = mensaje;

  redireccion = null;
  onConfirm = callbackConfirm;

  if (modalBtnCancel) modalBtnCancel.style.display = "inline-block";
}

if (modalBtn) {
  modalBtn.addEventListener("click", () => {
    modal.classList.remove("mostrar");

    if (onConfirm) {
      const fn = onConfirm;
      onConfirm = null;
      fn();
      return;
    }

    if (redireccion) window.location.href = redireccion;
  });
}

if (modalBtnCancel) {
  modalBtnCancel.addEventListener("click", () => {
    modal.classList.remove("mostrar");
    onConfirm = null;
    redireccion = null;
  });
}

// =======================
// UI
// =======================
const selectCategoria = document.getElementById("select_categoria");
const contenedorPuestos = document.getElementById("contenedor_puestos");
const contenedorYaOtorgados = document.getElementById("contenedor_ya_otorgados");
const btnGuardarGanadores = document.getElementById("btn_guardar_ganadores");
const contenedorHonorificos = document.getElementById("contenedor_honorificos");

// Cache
let premiosCategoria = [];
let nominadosCategoria = [];
let ganadoresOtorgados = [];

// =======================
// INIT
// =======================
function inicializarPanelGanadores() {
  cargarCategoriasPremios();
  cargarHonorificos();

  // Borrar ganador corto desde “ya otorgados”
  if (contenedorYaOtorgados) {
    contenedorYaOtorgados.addEventListener("click", (e) => {
      const icon = e.target.closest(".js-borrar");
      if (!icon) return;

      const idPremio = icon.getAttribute("data-id-premio");
      const categoria = selectCategoria ? selectCategoria.value : "";
      if (!idPremio || !categoria) return;

      mostrarModalConfirmacion(
        "¿Seguro que quieres borrar este ganador? Se eliminará el registro y la candidatura volverá a NOMINADA.",
        () => borrarGanador(idPremio, categoria)
      );
    });
  }

  // Borrar honorífico (delegación)
  if (contenedorHonorificos) {
    contenedorHonorificos.addEventListener("click", (e) => {
      const icon = e.target.closest(".js-borrar-honorifico");
      if (!icon) return;

      const idPremio = icon.getAttribute("data-id-premio");
      if (!idPremio) return;

      mostrarModalConfirmacion(
        "¿Seguro que quieres borrar el ganador honorífico de la gala activa? Se eliminará el registro y el vídeo.",
        () => borrarHonorifico(idPremio)
      );
    });
  }

  if (selectCategoria) {
    selectCategoria.addEventListener("change", () => {
      const categoria = selectCategoria.value;

      contenedorPuestos.innerHTML = "";
      contenedorYaOtorgados.innerHTML = "";
      premiosCategoria = [];
      nominadosCategoria = [];
      ganadoresOtorgados = [];

      if (!categoria) return;
      cargarDatosCategoria(categoria);
    });
  }

  if (btnGuardarGanadores) {
    btnGuardarGanadores.addEventListener("click", () => guardarGanadores());
  }
}

// =======================
// FETCH NORMAL (FormData) 
// =======================
function postFormData(url, dataObj) {
  const fd = new FormData();
  Object.keys(dataObj).forEach((k) => fd.append(k, dataObj[k]));

  return fetch(url, {
    method: "POST",
    body: fd
  }).then((r) => {
    if (!r.ok) throw new Error("Error HTTP");
    return r.json();
  });
}

// =======================
// CATEGORÍAS
// =======================
function cargarCategoriasPremios() {
  if (!selectCategoria) return;

  selectCategoria.innerHTML = `<option value="">Cargando...</option>`;

  postFormData("../php/panel_ganadores.php", { funcion: "get_categorias" })
    .then((data) => {
      if (data.status !== "success") {
        selectCategoria.innerHTML = `<option value="">(Error al cargar)</option>`;
        mostrarModal("error", data.message || "No se pudieron cargar categorías");
        return;
      }

      const cats = data.categorias || [];
      if (!cats.length) {
        selectCategoria.innerHTML = `<option value="">No hay categorías disponibles</option>`;
        return;
      }

      let html = `<option value="">Selecciona una categoría</option>`;
      cats.forEach((c) => {
        html += `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
      });

      selectCategoria.innerHTML = html;
    })
    .catch((err) => {
      console.error(err);
      selectCategoria.innerHTML = `<option value="">(Error de conexión)</option>`;
      mostrarModal("error", "Error de conexión con el servidor");
    });
}

// =======================
// Datos categoría
// =======================
function cargarDatosCategoria(categoria) {
  contenedorPuestos.innerHTML = "Cargando...";
  contenedorYaOtorgados.innerHTML = "";

  postFormData("../php/panel_ganadores.php", {
    funcion: "get_datos_categoria",
    categoria: categoria
  })
    .then((data) => {
      if (data.status !== "success") {
        contenedorPuestos.innerHTML = "";
        mostrarModal("error", data.message || "No se pudieron cargar los datos de la categoría");
        return;
      }

      premiosCategoria = data.premios || [];
      nominadosCategoria = data.nominados || [];
      ganadoresOtorgados = data.ganadores || [];

      pintarYaOtorgados();
      pintarSelectsPorPuesto();
    })
    .catch((err) => {
      console.error(err);
      contenedorPuestos.innerHTML = "";
      mostrarModal("error", "Error de conexión con el servidor");
    });
}

function pintarYaOtorgados() {
  if (!contenedorYaOtorgados) return;

  if (!ganadoresOtorgados.length) {
    contenedorYaOtorgados.innerHTML = `<p style="color:#aaa;">Aún no se han otorgado premios en esta categoría.</p>`;
    return;
  }

  let html = `
    <div style="border:1px solid #1f1f1f;padding:12px;background:#101010;">
      <strong style="display:block;margin-bottom:8px;color:#c9a43b;">Premios ya otorgados</strong>
  `;

  ganadoresOtorgados.forEach((g) => {
    const txt = `Puesto ${g.puesto}: ${g.titulo} — ${g.nombre}`;
    html += `
      <div style="margin:6px 0;color:#e5e5e5;display:flex;justify-content:space-between;gap:12px;align-items:center;">
        <span>${escapeHtml(txt)}</span>
        <i class="fa-solid fa-trash js-borrar" data-id-premio="${g.id_premio}" style="cursor:pointer;"></i>
      </div>
    `;
  });

  html += `</div>`;
  contenedorYaOtorgados.innerHTML = html;
}

function pintarSelectsPorPuesto() {
  if (!contenedorPuestos) return;

  if (!premiosCategoria.length) {
    contenedorPuestos.innerHTML = `<p style="color:#aaa;margin-top:10px;">No hay premios activos con puesto > 0 para esta categoría.</p>`;
    return;
  }

  let options = `<option value="">(Dejar desierto)</option>`;
  if (!nominadosCategoria.length) {
    options += `<option value="" disabled>No hay nominados en esta categoría</option>`;
  } else {
    nominadosCategoria.forEach((n) => {
      const label = `${n.titulo} — ${n.nombre_apellidos}`;
      options += `<option value="${n.id_candidatura}">${escapeHtml(label)}</option>`;
    });
  }

  let html = "";
  premiosCategoria.forEach((p) => {
    const dot = p.dotacion ? ` (${p.dotacion} €)` : "";
    html += `
      <div class="form-group">
        <label>Puesto ${p.puesto}${escapeHtml(dot)}</label>
        <select class="select-ganador" data-id-premio="${p.id_premio}" data-puesto="${p.puesto}">
          ${options}
        </select>
      </div>
    `;
  });

  contenedorPuestos.innerHTML = html;
}

// =======================
// Guardar ganadores
// =======================
function guardarGanadores() {
  const categoria = selectCategoria ? selectCategoria.value : "";
  if (!categoria) {
    mostrarModal("error", "Selecciona una categoría primero");
    return;
  }

  const selects = document.querySelectorAll(".select-ganador");
  if (!selects.length) {
    mostrarModal("error", "No hay puestos cargados para guardar");
    return;
  }

  const payload = [];
  const usados = new Set();
  let algunoSeleccionado = false;

  for (let i = 0; i < selects.length; i++) {
    const sel = selects[i];
    const idPremio = sel.getAttribute("data-id-premio");
    const puesto = sel.getAttribute("data-puesto");
    const idCandidatura = sel.value;

    if (!idPremio || !puesto) continue;

    if (idCandidatura) {
      algunoSeleccionado = true;

      if (usados.has(idCandidatura)) {
        mostrarModal("error", "No puedes premiar la misma candidatura en dos puestos distintos.");
        return;
      }
      usados.add(idCandidatura);
    }

    payload.push({
      id_premio: idPremio,
      puesto: puesto,
      id_candidatura: idCandidatura || ""
    });
  }

  // VALIDACIÓN NUEVA: no permitir guardar si no hay ningún corto seleccionado
  if (!algunoSeleccionado) {
    mostrarModal("error", "No has seleccionado ningún corto nominado.");
    return;
  }

  postFormData("../php/panel_ganadores.php", {
    funcion: "guardar_ganadores",
    categoria: categoria,
    datos: JSON.stringify(payload)
  })
    .then((data) => {
      if (data.status === "success") {
        mostrarModal("success", data.message || "Ganadores guardados correctamente", "../html/panel_ganadores.html");
      } else {
        mostrarModal("error", data.message || "No se pudieron guardar los ganadores");
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarModal("error", "Error de conexión con el servidor");
    });
}

// =======================
// Borrar ganador corto
// =======================
function borrarGanador(idPremio, categoria) {
  postFormData("../php/panel_ganadores.php", {
    funcion: "borrar_ganador",
    id_premio: idPremio,
    categoria: categoria
  })
    .then((data) => {
      if (data.status === "success") {
        mostrarModal("success", data.message || "Ganador borrado correctamente", "../html/panel_ganadores.html");
      } else {
        mostrarModal("error", data.message || "No se pudo borrar el ganador");
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarModal("error", "Error de conexión con el servidor");
    });
}

// =======================
// HONORÍFICOS (validación blur + submit)
// =======================
const EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const TIPOS_VIDEO_PERMITIDOS = ["video/mp4", "video/quicktime"];

function setFieldError(inputEl, msg) {
  if (!inputEl) return;

  inputEl.classList.add("input-error");

  // Creamos un <small> de error justo debajo del input si no existe
  const parent = inputEl.closest(".form-group") || inputEl.parentElement;
  if (!parent) return;

  let small = parent.querySelector(".error-msg");
  if (!small) {
    small = document.createElement("small");
    small.className = "error-msg";
    parent.appendChild(small);
  }
  small.textContent = msg || "Campo inválido";
}

function clearFieldError(inputEl) {
  if (!inputEl) return;

  inputEl.classList.remove("input-error");

  const parent = inputEl.closest(".form-group") || inputEl.parentElement;
  if (!parent) return;

  const small = parent.querySelector(".error-msg");
  if (small) small.textContent = "";
}

function validarCampoHonorifico(inputEl) {
  if (!inputEl) return true;

  const name = inputEl.getAttribute("name") || "";
  const type = (inputEl.getAttribute("type") || "").toLowerCase();

  // Video
  if (type === "file" && name === "video") {
    const file = inputEl.files && inputEl.files[0] ? inputEl.files[0] : null;

    if (!file) {
      setFieldError(inputEl, "Selecciona un vídeo (MP4 o MOV).");
      return false;
    }

    // Validación por MIME (cliente). Ojo: el server vuelve a validar.
    if (!TIPOS_VIDEO_PERMITIDOS.includes(file.type)) {
      setFieldError(inputEl, "Formato de vídeo no válido (solo MP4 o MOV).");
      return false;
    }

    clearFieldError(inputEl);
    return true;
  }

  const value = (inputEl.value || "").trim();

  // Vacíos
  if (name === "nombre") {
    if (!value) {
      setFieldError(inputEl, "El nombre no puede estar vacío.");
      return false;
    }
    clearFieldError(inputEl);
    return true;
  }

  if (name === "correo") {
    if (!value) {
      setFieldError(inputEl, "El correo no puede estar vacío.");
      return false;
    }
    if (!EMAIL_REGEX.test(value)) {
      setFieldError(inputEl, "El correo no tiene un formato válido.");
      return false;
    }
    clearFieldError(inputEl);
    return true;
  }

  if (name === "numero") {
    if (!value) {
      setFieldError(inputEl, "El teléfono no puede estar vacío.");
      return false;
    }
    clearFieldError(inputEl);
    return true;
  }

  return true;
}

function engancharValidacionBlurHonorifico(formEl) {
  if (!formEl) return;

  const inputs = formEl.querySelectorAll('input[name="nombre"], input[name="correo"], input[name="numero"]');
  inputs.forEach((inp) => {
    inp.addEventListener("blur", () => validarCampoHonorifico(inp));
    inp.addEventListener("input", () => clearFieldError(inp));
  });

  const videoInput = formEl.querySelector('input[name="video"]');
  if (videoInput) {
    videoInput.addEventListener("blur", () => validarCampoHonorifico(videoInput));
    videoInput.addEventListener("change", () => validarCampoHonorifico(videoInput));
  }
}

function validarFormularioHonorifico(formEl) {
  const nombreInput = formEl.querySelector('input[name="nombre"]');
  const correoInput = formEl.querySelector('input[name="correo"]');
  const numeroInput = formEl.querySelector('input[name="numero"]');
  const videoInput = formEl.querySelector('input[name="video"]');

  const okNombre = validarCampoHonorifico(nombreInput);
  const okCorreo = validarCampoHonorifico(correoInput);
  const okNumero = validarCampoHonorifico(numeroInput);
  const okVideo = validarCampoHonorifico(videoInput);

  return okNombre && okCorreo && okNumero && okVideo;
}

function cargarHonorificos() {
  if (!contenedorHonorificos) return;

  contenedorHonorificos.innerHTML = "Cargando...";

  postFormData("../php/panel_ganadores.php", { funcion: "get_honorificos" })
    .then((data) => {
      if (data.status !== "success") {
        contenedorHonorificos.innerHTML = "";
        mostrarModal("error", data.message || "No se pudieron cargar honoríficos");
        return;
      }

      const honorificos = data.honorificos || [];
      if (!honorificos.length) {
        contenedorHonorificos.innerHTML = `<p style="color:#aaa;margin-top:10px;">No hay premios honoríficos activos (puesto 0).</p>`;
        return;
      }

      let html = "";

      honorificos.forEach((h) => {
        if (h.asignado) {
          const g = h.ganador || {};
          html += `
                  <div class="honorifico-card">
                  <div class="honorifico-header">
                    <h4>${escapeHtml(h.descripcion || ("Premio Honorífico " + h.id_premio))}</h4>
                    <i class="fa-solid fa-trash js-borrar-honorifico" data-id-premio="${h.id_premio}"></i>
                  </div>

                  <p class="honorifico-warning"><strong>Ya hay un ganador asignado para la gala activa.</strong></p>
                  <p class="honorifico-nombre">${escapeHtml(g.nombre_apellidos || "-")}</p>
                  <p class="honorifico-contacto">
                    ${escapeHtml(g.email || "")}${g.telefono ? " · " + escapeHtml(g.telefono) : ""}
                  </p>

                  ${g.video_url ? `
                    <p class="honorifico-video">
                      <a href="../${escapeHtml(g.video_url)}" class="lb-video">Ver vídeo</a>
                    </p>`
              : ""}
                </div>
              `;
          // Lightbox para videos de honoríficos
          document.addEventListener("click", e => {
            if (e.target.classList.contains("lb-video")) {
              e.preventDefault();

              const url = e.target.getAttribute("href");
              abrirVideoHonorifico(url);
            }
          });
          return;

        }

        html += `
          <div style="border:1px solid #1f1f1f;border-radius:12px;padding:14px;margin-top:14px;">
            <h4 style="margin-bottom:10px;">${escapeHtml(h.descripcion || ("Premio Honorífico " + h.id_premio))}</h4>

            <form class="form-honorifico" data-id-premio="${h.id_premio}">
              <div class="form-group">
                <label>Nombre completo</label>
                <input type="text" name="nombre" placeholder="Nombre del profesional">
                <small class="error-msg"></small>
              </div>

              <div class="form-group">
                <label>Correo electrónico</label>
                <input type="text" name="correo" placeholder="ganador@gmail.com">
                <small class="error-msg"></small>
              </div>

              <div class="form-group">
                <label>Teléfono de contacto</label>
                <input type="text" name="numero" placeholder="987654321">
                <small class="error-msg"></small>
              </div>

              <div class="form-group">
                <label>Video de recorrido profesional</label>
                <input type="file" name="video" accept="video/mp4,video/quicktime">
                <small class="error-msg"></small>
              </div>

              <button type="submit" class="btn-primary">Guardar ganador</button>
            </form>
          </div>
        `;
      });

      contenedorHonorificos.innerHTML = html;

      const forms = document.querySelectorAll(".form-honorifico");
      for (let i = 0; i < forms.length; i++) {
        // NUEVO: blur validation
        engancharValidacionBlurHonorifico(forms[i]);

        forms[i].addEventListener("submit", function (e) {
          e.preventDefault();

          // NUEVO: validación completa antes de enviar
          if (!validarFormularioHonorifico(this)) {
            mostrarModal("error", "Revisa los campos del honorífico: hay datos vacíos o el email/vídeo no es válido.");
            return;
          }

          enviarHonorifico(this);
        });
      }
    })
    .catch((err) => {
      console.error(err);
      contenedorHonorificos.innerHTML = "";
      mostrarModal("error", "Error de conexión con el servidor");
    });
}

function abrirVideoHonorifico(url) {
  const content = document.getElementById("lightbox-content");

  content.innerHTML = `
        <video controls autoplay>
            <source src="${url}">
        </video>
    `;

  // Ocultar flechas porque no es parte del carrusel
  document.getElementById("lb-prev").style.display = "none";
  document.getElementById("lb-next").style.display = "none";

  document.getElementById("lightbox").style.display = "flex";
  // Cerrar solo si se hace click fuera de la imagen y de las flechas
  document.getElementById("lightbox").addEventListener("click", e => {
    if (e.target.id === "lightbox") {
      document.getElementById("lightbox").style.display = "none";
    }
  });
}


function enviarHonorifico(formEl) {
  const idPremio = formEl.getAttribute("data-id-premio");
  const nombre = (formEl.querySelector('input[name="nombre"]') || {}).value || "";
  const correo = (formEl.querySelector('input[name="correo"]') || {}).value || "";
  const numero = (formEl.querySelector('input[name="numero"]') || {}).value || "";
  const videoInput = formEl.querySelector('input[name="video"]');
  const video = videoInput && videoInput.files ? videoInput.files[0] : null;

  if (!idPremio || !nombre.trim() || !correo.trim() || !numero.trim() || !video) {
    mostrarModal("error", "Completa todos los campos del honorífico y selecciona un vídeo.");
    return;
  }

  //  NUEVO: validar email por regex también aquí (por seguridad)
  if (!EMAIL_REGEX.test(correo.trim())) {
    mostrarModal("error", "El correo no tiene un formato válido.");
    return;
  }

  const tiposPermitidos = ["video/mp4", "video/quicktime"];
  if (!tiposPermitidos.includes(video.type)) {
    mostrarModal("error", "Formato de vídeo no válido (solo MP4 o MOV).");
    return;
  }

  const maxSize = 50 * 1024 * 1024;
  if (video.size > maxSize) {
    mostrarModal("error", "El vídeo no puede superar los 50 MB.");
    return;
  }

  const fd = new FormData();
  fd.append("id_premio", idPremio);
  fd.append("nombre", nombre);
  fd.append("correo", correo);
  fd.append("numero", numero);
  fd.append("video", video);


  fetch("../php/formulario_ganador_honorifico.php", {
    method: "POST",
    body: fd
  })
    .then((r) => {
      if (!r.ok) throw new Error("Error HTTP");
      return r.json();
    })
    .then((data) => {
      if (data.status === "success") {
        mostrarModal("success", data.message || "Honorífico guardado correctamente", "../html/panel_ganadores.html");
      } else {
        mostrarModal("error", data.message || "No se pudo guardar el honorífico");
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarModal("error", "Error de conexión con el servidor");
    });
}

function borrarHonorifico(idPremio) {
  postFormData("../php/panel_ganadores.php", {
    funcion: "borrar_honorifico",
    id_premio: idPremio
  })
    .then((data) => {
      if (data.status === "success") {
        mostrarModal("success", data.message || "Honorífico borrado correctamente", "../html/panel_ganadores.html");
      } else {
        mostrarModal("error", data.message || "No se pudo borrar el honorífico");
      }
    })
    .catch((err) => {
      console.error(err);
      mostrarModal("error", "Error de conexión con el servidor");
    });
}

// Utils
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
