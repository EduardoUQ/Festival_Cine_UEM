// =======================
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

document.addEventListener("DOMContentLoaded", () => {
  fetch("../php/session_info.php")
    .then((r) => r.json())
    .then((info) => {
      if (!info.logged || info.rol !== "admin") {
        window.location.href = "../html/login.html";
        return;
      }

      const elNombre = document.getElementById("user_nombre");
      if (elNombre) elNombre.textContent = info.nombre;

      const btnLogout = document.getElementById("btn_logout");
      if (btnLogout) {
        btnLogout.addEventListener("click", () => {
          fetch("../php/logout.php", { method: "POST" })
            .then((r) => r.json())
            .then((resp) => {
              if (resp.status === "success") window.location.href = "../html/index.html";
              else mostrarModal("error", "No se pudo cerrar sesión");
            })
            .catch((err) => {
              console.error("Error al cerrar sesión", err);
              mostrarModal("error", "Error al cerrar sesión. Observa la consola.");
            });
        });
      }

      iniciarPanelPremios();
    })
    .catch((err) => {
      console.error("No se pudo comprobar la sesión:", err);
      window.location.href = "../html/login.html";
    });
});

function iniciarPanelPremios() {
  const cont = document.getElementById("categoriasContainer");
  const selectActiva = document.getElementById("selectActiva");

  // Validaciones mínimas de HTML
  if (!cont) {
    console.error("Falta #categoriasContainer en el HTML");
    return;
  }

  // Carga inicial
  cargarYPintarPremios();

  // Filtro (si existe)
  if (selectActiva) {
    selectActiva.addEventListener("change", cargarYPintarPremios);
  } else {
    console.warn("No existe #selectActiva (el filtro no funcionará).");
  }

  // Click SOLO para borrar (editar ya va por href)
  document.addEventListener("click", (e) => {
    const btnBorrar = e.target.closest(".js-borrar");
    if (!btnBorrar) return;

    const id = btnBorrar.dataset.id;
    if (!id) return;

    confirmarBorrado(id, cargarYPintarPremios);
  });

  function cargarYPintarPremios() {
    const activa = selectActiva ? selectActiva.value : "";

    const url =
      activa === ""
        ? "../php/mostrar_premios.php"
        : `../php/mostrar_premios.php?activa=${activa}`;

    fetch(url)
      .then((r) => r.json())
      .then((premios) => {
        cont.innerHTML = "";
        pintarPorCategoria(premios);
      })
      .catch((err) => {
        console.error("Error cargando premios:", err);
        cont.innerHTML = "<p>Error cargando premios</p>";
      });
  }

  // función para pintar los premios agrupados por categoría
  function pintarPorCategoria(premios) {
    const grupos = {};

    premios.forEach((p) => {
      const cat = p.categoria || "Sin categoría";
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(p);
    });

    for (const categoria in grupos) {
      let filas = "";

      grupos[categoria].forEach((p) => {
        const dotacionTexto =
          p.dotacion === null || p.dotacion === "" ? "-" : `${p.dotacion} €`;

        const activaTexto = p.activa == 1 ? "Sí" : "No";

        filas += `
          <tr>
            <td>${p.puesto}</td>
            <td>${dotacionTexto}</td>
            <td>${p.descripcion}</td>
            <td>${activaTexto}</td>
            <td>
              <a class="js-editar" href="formulario_premio.html?id=${p.id}">
                <i class="fa-solid fa-pen"></i>
              </a>
              <i class="fa-solid fa-trash js-borrar" data-id="${p.id}" style="cursor:pointer;"></i>
            </td>
          </tr>
        `;
      });

      cont.innerHTML += `
        <div class="card categoria-card">
          <h3>Premios en la categoría:</h3>
          <span class="badge">${categoria}</span>

          <table class="table">
            <thead>
              <tr>
                <th>Puesto</th>
                <th>Dotación</th>
                <th>Descripción</th>
                <th>Activa</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>
        </div>
      `;
    }
  }
}

function confirmarBorrado(id, onDone) {
  mostrarConfirmacion("¿Seguro que quieres borrar este premio?", function () {
    const formData = new FormData();
    formData.append("id", id);

    fetch("../php/eliminar_premio.php", {
      method: "POST",
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        console.log("Respuesta borrar:", data);

        if (data.status === "success") {
          mostrarModal("success", data.message || "Premio eliminado correctamente");
          if (typeof onDone === "function") onDone(); // recarga lista sin reload
        } else {
          mostrarModal("error", data.message || "No se pudo eliminar el premio");
        }
      })
      .catch((err) => {
        console.error("Error al eliminar:", err);
        mostrarModal("error", "Error al eliminar. Observa la consola.");
      });
  });
}
