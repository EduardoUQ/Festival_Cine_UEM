// Cargar la cabecera
document.addEventListener("DOMContentLoaded", () => {
  // 1) Cargar los datos del usuario
  fetch("../php/session_info.php")
    .then((response) => response.json())
    .then((info) => {
      if (!info.logged || info.rol !== "admin") {
        window.location.href = "../html/login.html";
        return;
      }

      // Cargamos el nombre del Admin en el panel
      const elNombre = document.getElementById("nombre");
      if (elNombre) {
        elNombre.textContent = info.nombre;
      }

      // Botón para cerrar sesión
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

      // Iniciamos el panel cuando la sesión es válida
      inicializarPanelGanadores();
    })
    .catch((error) => {
      console.error("No se pudo comprobar la sesión:", error);
      window.location.href = "../html/login.html";
    });
});

// FUNCIÓN DEL MODAL
const modal = document.getElementById("modal_mensaje");
const modalIcono = document.getElementById("modal_icono");
const modalTitulo = document.getElementById("modal_titulo");
const modalTexto = document.getElementById("modal_texto");
const modalBtn = document.getElementById("modalBtn");

let redireccion = null;

function mostrarModal(tipo, mensaje, redirect = null) {
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
}

if (modalBtn) {
  modalBtn.addEventListener("click", () => {
    modal.classList.remove("mostrar");
    if (redireccion) {
      window.location.href = redireccion;
    }
  });
}

// =======================
// ELEMENTOS UI
// =======================
const selectCategoria = document.getElementById("select_categoria");
const contenedorPuestos = document.getElementById("contenedor_puestos");
const contenedorYaOtorgados = document.getElementById("contenedor_ya_otorgados");
const btnGuardarGanadores = document.getElementById("btn_guardar_ganadores");
const contenedorHonorificos = document.getElementById("contenedor_honorificos");

// Cache
let premiosCategoria = []; // [{id_premio, puesto, descripcion, dotacion}]
let nominadosCategoria = []; // [{id_candidatura, titulo, nombre_apellidos}]
let ganadoresOtorgados = []; // [{id_premio, puesto, nombre, titulo}]

// =======================
// INIT
// =======================
function inicializarPanelGanadores() {
  cargarCategoriasPremios();
  cargarHonorificos();

  if (selectCategoria) {
    selectCategoria.addEventListener("change", () => {
      const categoria = selectCategoria.value;

      // Limpieza visual
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
    btnGuardarGanadores.addEventListener("click", () => {
      guardarGanadores();
    });
  }
}

// =======================
// Helper POST (FormData)
// =======================
function postJSON(url, dataObj) {
  const formData = new FormData();
  Object.keys(dataObj).forEach((k) => formData.append(k, dataObj[k]));

  return fetch(url, { method: "POST", body: formData })
    .then((r) => {
      if (!r.ok) throw new Error("Error HTTP");
      return r.json();
    });
}

// =======================
// CATEGORÍAS (premios con puesto>0 y activos)
// =======================
function cargarCategoriasPremios() {
  if (!selectCategoria) return;

  selectCategoria.innerHTML = `<option value="">Cargando...</option>`;

  postJSON("../php/panel_ganadores.php", { funcion: "get_categorias" })
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
// Cargar puestos + nominados + ya otorgados
// =======================
function cargarDatosCategoria(categoria) {
  contenedorPuestos.innerHTML = "Cargando...";
  contenedorYaOtorgados.innerHTML = "";

  postJSON("../php/panel_ganadores.php", {
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

// =======================
// Pintar ya otorgados
// =======================
function pintarYaOtorgados() {
  if (!contenedorYaOtorgados) return;

  if (!ganadoresOtorgados.length) {
    contenedorYaOtorgados.innerHTML = `<p style="color:#aaa;">Aún no se han otorgado premios en esta categoría.</p>`;
    return;
  }

  let html = `
    <div style="border:1px solid #1f1f1f;border-radius:12px;padding:12px;background:#101010;">
      <strong style="display:block;margin-bottom:8px;color:#c9a43b;">Premios ya otorgados</strong>
  `;

  ganadoresOtorgados.forEach((g) => {
    const txt = `Puesto ${g.puesto}: ${g.titulo} — ${g.nombre}`;
    html += `<div style="margin:6px 0;color:#e5e5e5;">${escapeHtml(txt)}</div>`;
  });

  html += `</div>`;
  contenedorYaOtorgados.innerHTML = html;
}

// =======================
// Pintar selects por puesto (permitiendo desiertos)
// =======================
function pintarSelectsPorPuesto() {
  if (!contenedorPuestos) return;

  if (!premiosCategoria.length) {
    contenedorPuestos.innerHTML = `<p style="color:#aaa;margin-top:10px;">No hay premios activos con puesto > 0 para esta categoría.</p>`;
    return;
  }

  // Opciones de nominados iguales para todos los selects (como quieres)
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

  // Recogemos selecciones (permitiendo vacío)
  const payload = [];
  const usados = new Set();

  for (let i = 0; i < selects.length; i++) {
    const sel = selects[i];
    const idPremio = sel.getAttribute("data-id-premio");
    const puesto = sel.getAttribute("data-puesto");
    const idCandidatura = sel.value;

    if (!idPremio || !puesto) continue;

    // Validación cliente: no misma candidatura en dos puestos (si no está vacío)
    if (idCandidatura) {
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

  postJSON("../php/panel_ganadores.php", {
    funcion: "guardar_ganadores",
    categoria: categoria,
    datos: JSON.stringify(payload)
  })
    .then((data) => {
      if (data.status === "success") {
        // Recargar página al aceptar
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
// HONORÍFICOS: un formulario por cada premio puesto=0 activo
// =======================
function cargarHonorificos() {
  if (!contenedorHonorificos) return;

  contenedorHonorificos.innerHTML = "Cargando...";

  postJSON("../php/panel_ganadores.php", { funcion: "get_honorificos" })
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
        html += `
          <div style="border:1px solid #1f1f1f;border-radius:12px;padding:14px;margin-top:14px;">
            <h4 style="margin-bottom:10px;">${escapeHtml(h.descripcion || ("Premio Honorífico " + h.id_premio))}</h4>

            <form class="form-honorifico" data-id-premio="${h.id_premio}">
              <div class="form-group">
                <label>Nombre completo</label>
                <input type="text" name="nombre" placeholder="Nombre del profesional">
              </div>

              <div class="form-group">
                <label>Correo electrónico</label>
                <input type="text" name="correo" placeholder="ganador@gmail.com">
              </div>

              <div class="form-group">
                <label>Teléfono de contacto</label>
                <input type="text" name="numero" placeholder="987654321">
              </div>

              <div class="form-group">
                <label>Video de recorrido profesional</label>
                <input type="file" name="video" accept="video/mp4,video/quicktime">
              </div>

              <button type="submit" class="btn-primary">Guardar ganador</button>
            </form>
          </div>
        `;
      });

      contenedorHonorificos.innerHTML = html;

      // Bind submit por cada formulario
      const forms = document.querySelectorAll(".form-honorifico");
      for (let i = 0; i < forms.length; i++) {
        forms[i].addEventListener("submit", function (e) {
          e.preventDefault();
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

  // Validación mínima de video (tipo/tamaño)
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

// Utils
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
