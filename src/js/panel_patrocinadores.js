document.addEventListener("DOMContentLoaded", () => {
  // 1) Cargar sesión
  fetch("../php/session_info.php")
    .then((r) => r.json())
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

      // 2) Cargar patrocinadores al entrar
      cargarPatrocinadores();
    })
    .catch((err) => {
      console.error("No se pudo comprobar la sesión:", err);
      window.location.href = "../html/login.html";
    });
});

function cargarPatrocinadores() {
  fetch("../php/mostrar_patrocinadores.php")
    .then((res) => res.json())
    .then((patrocinadores) => {
      const tbody = document.querySelector("table tbody");
      tbody.innerHTML = "";

      patrocinadores.forEach((p) => {
        const color = p.color_hex ? p.color_hex : "—";
        const web = p.web_url ? p.web_url : "";

        const webHtml = web
          ? `<a href="${escapeHtml(web)}" target="_blank" rel="noopener noreferrer">Abrir</a>`
          : "—";

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><img src="../${p.logo_url}" style="max-height:60px;"></td>
          <td>${escapeHtml(p.nombre)}</td>
          <td>${color}</td>
          <td>${webHtml}</td>
          <td>
            <i class="fa-solid fa-pen" data-id="${p.id}"></i>
            <i class="fa-solid fa-trash" data-id="${p.id}"></i>
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch((err) => console.error("Error cargando patrocinadores:", err));
}

// Clicks editar/borrar
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("fa-pen")) {
    const id = e.target.dataset.id;
    window.location.href = `formulario_patrocinador.html?id=${encodeURIComponent(id)}`;
    return;
  }

  if (e.target.classList.contains("fa-trash")) {
    const id = e.target.dataset.id;
    mostrarConfirmacion("¿Seguro que quieres borrar este patrocinador?", function () {
      confirmarBorrado(id);
    });
    return;
  }
});

// ----------------- MODAL (tu código tal cual, solo sin cambios raros)
const modal = document.getElementById("modal_mensaje");
const modalIcono = document.getElementById("modal_icono");
const modalTitulo = document.getElementById("modal_titulo");
const modalTexto = document.getElementById("modal_texto");
const modalBtn = document.getElementById("modalBtn");
const modalBtnCancel = document.getElementById("modalBtnCancel");

let accionConfirmada = null;
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
  accionConfirmada = null;
}

modalBtn.addEventListener("click", () => {
  modal.classList.remove("mostrar");

  if (accionConfirmada) {
    const fn = accionConfirmada;
    accionConfirmada = null;
    fn();
    return;
  }

  if (redireccion) window.location.href = redireccion;
});

if (modalBtnCancel) {
  modalBtnCancel.addEventListener("click", () => {
    modal.classList.remove("mostrar");
    modalBtnCancel.style.display = "none";
    accionConfirmada = null;
    redireccion = null;
  });
}

function mostrarConfirmacion(mensajeConfirmacion, onConfirm) {
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

function confirmarBorrado(id) {
  const formData = new FormData();
  formData.append("id", id);

  fetch(`../php/eliminar_patrocinador.php`, {
    method: "POST",
    body: formData,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.status === "success") {
        mostrarModal("success", data.message);
        cargarPatrocinadores();
      } else {
        mostrarModal("error", data.message);
      }
    })
    .catch((err) => {
      console.error("Error en la solicitud:", err);
      mostrarModal("error", "Error en la solicitud. Mira consola.");
    });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => {
    return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[m]);
  });
}
