const POR_PAGINA = 8;
let paginaActual = 1;

document.addEventListener("DOMContentLoaded", () => {
  const tbody = document.getElementById("tbody_noticias") || document.querySelector("table tbody");

  // BORRA lo inventado SIEMPRE, aunque el fetch falle
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="3">Cargando noticias...</td></tr>`;
  }

  cargarNoticias(paginaActual);
});

// MODAL (igual que calendario)
// =======================
const modal = document.getElementById("modal_mensaje");
const modalIcono = document.getElementById("modal_icono");
const modalTitulo = document.getElementById("modal_titulo");
const modalTexto = document.getElementById("modal_texto");
const modalBtn = document.getElementById("modalBtn");
const modalBtnCancel = document.getElementById("modalBtnCancel");

let accionConfirmada = null;
let redireccion = null;

const modalDisponible =
  modal && modalIcono && modalTitulo && modalTexto && modalBtn;

function mostrarModal(tipo, mensaje, redirect = null) {
  if (!modalDisponible) {
    console.error("Modal no disponible: falta el HTML del modal en panel_premios.html");
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

if (modalDisponible) {
  modalBtn.addEventListener("click", () => {
    modal.classList.remove("mostrar");

    // Si venimos de una confirmación, ejecutamos la acción
    if (accionConfirmada) {
      const fn = accionConfirmada;
      accionConfirmada = null;
      fn();
      return;
    }

    // Si venimos de un mensaje normal con redirección
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



function cargarNoticias(pagina) {
  fetch(`../php/mostrar_noticia.php?page=${encodeURIComponent(pagina)}&per_page=${encodeURIComponent(POR_PAGINA)}`)
    .then(async (res) => {
      // Si el PHP devuelve un warning/HTML, aquí lo verás
      const text = await res.text();

      try {
        return JSON.parse(text);
      } catch (e) {
        console.error("El PHP NO está devolviendo JSON válido. Respuesta cruda:", text);
        throw new Error("Respuesta no JSON");
      }
    })
    .then((data) => {
      if (!data || data.status !== "success") {
        console.error("El PHP respondió pero con error:", data);
        pintarError("No se pudieron cargar las noticias (status != success).");
        return;
      }

      pintarTabla(data.noticias);
      pintarInfo(data.from, data.to, data.total);
      pintarBotones(data.total, data.per_page, data.page);
    })
    .catch((err) => {
      console.error("Error cargando noticias:", err);
      pintarError("Error cargando noticias. Mira la consola (F12) para ver el motivo exacto.");
    });
}

function pintarTabla(noticias) {
  const tbody = document.getElementById("tbody_noticias") || document.querySelector("table tbody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!noticias || noticias.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No hay noticias.</td></tr>`;
    return;
  }

  noticias.forEach((noticia) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(noticia.titulo)}</td>
      <td>${escapeHTML(noticia.fecha)}</td>
      <td>
        <i class="fa-solid fa-pen" data-id="${noticia.id}"></i>
        <i class="fa-solid fa-trash" data-id="${noticia.id}"></i>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function pintarError(msg) {
  const tbody = document.getElementById("tbody_noticias") || document.querySelector("table tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="3">${escapeHTML(msg)}</td></tr>`;
}

function pintarInfo(desde, hasta, total) {
  const elInfo = document.getElementById("paginacion_info");
  if (!elInfo) return;

  if (total === 0) elInfo.textContent = "Mostrando 0–0 de 0 noticias";
  else elInfo.textContent = `Mostrando ${desde}–${hasta} de ${total} noticias`;
}

function pintarBotones(total, perPage, page) {
  const cont = document.getElementById("paginacion_botones");
  if (!cont) return;

  cont.innerHTML = "";
  const totalPaginas = Math.ceil(total / perPage);

  for (let p = 1; p <= totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.textContent = String(p);
    if (p === page) btn.classList.add("active");

    btn.addEventListener("click", () => {
      paginaActual = p;
      cargarNoticias(paginaActual);
    });

    cont.appendChild(btn);
  }
}

// EDITAR/BORRAR
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("fa-pen")) {
    const id = e.target.dataset.id;
    window.location.href = `formulario_noticia.html?id=${encodeURIComponent(id)}`;
  }

  if (e.target.classList.contains("fa-trash")) {
    const id = e.target.dataset.id;
    mostrarConfirmacion("¿Seguro que quieres borrar esta noticia?", function () {
      fetch(`../php/eliminar_noticia.php?id=${encodeURIComponent(id)}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Respuesta borrar:", data);
          if (data.status === "success") {
            mostrarModal("success", data.message || "Premio eliminado correctamente");
            if (typeof onDone === "function") onDone(); // recarga lista sin reload
          } else {
            mostrarModal("error", data.message || "No se pudo eliminar el premio");
          }
        })
        .then(() => cargarNoticias(paginaActual))
        .catch((err) => {
          console.error("Error al eliminar:", err);
          mostrarModal("error", "Error al eliminar la noticia.");
        });
    })
  }
});

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
