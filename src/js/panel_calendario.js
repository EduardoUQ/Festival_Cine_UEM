  const POR_PAGINA = 8;
  let paginaActual = 1;
  let filtroActual = "todos";

document.addEventListener("DOMContentLoaded", () => {
  cargarEventos();

  // FUNCIÓN DEL MODAL
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

  function borrarEvento(id) {
    let formData = new FormData();
    formData.append("funcion", "borrar_evento");
    formData.append("id", id);

    fetch("../php/formulario_evento.php", {
      method: "POST",
      body: formData,
    })
      .then(function (response) {
        if (!response.ok) {
          throw new Error("Error en la solicitud: " + response.statusText);
        }
        return response.json();
      })
      .then(function (data) {
        console.log(data);

        if (data.status === "success") {
          mostrarModal("success", data.message);
          cargarEventos();
        } else {
          //podemos hacerlo con el mismo modal de formulario evento
          //alert(data.message);
          mostrarModal("error", data.message);
        }
      })
      .catch(function (error) {
        console.error("Error en la solicitud:", error);
      });
  }

  const tbody = document.getElementById("tbody_eventos");
  if (!tbody) return;

  tbody.addEventListener("click", function (e) {
    const iconTrash = e.target.closest(".fa-trash");
    if (iconTrash) {
      e.preventDefault();

      const id = iconTrash.getAttribute("data-id");
      if (!id) return;

      mostrarConfirmacion(
        "¿Seguro que quieres borrar este evento?",
        function () {
          borrarEvento(id);
        },
      );
      return;
    }

    const iconEdit = e.target.closest(".fa-pen");
    if (iconEdit) {
      e.preventDefault();

      const id = iconEdit.getAttribute("data-id");
      if (!id) return;

      window.location.href = `formulario_evento.html?id=${id}`;
      return;
    }
  });
});

function cargarEventos() {
  const tbody = document.getElementById("tbody_eventos");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>`;

  let formData = new FormData();
  formData.append("funcion", "listar_eventos");
  formData.append("page", paginaActual);
  formData.append("per_page", POR_PAGINA);
  formData.append("filtro", filtroActual);

  fetch("../php/formulario_evento.php", {
    method: "POST",
    body: formData,
  })
    .then((r) => r.json())
    .then((data) => {
      if (data.status !== "success") {
        tbody.innerHTML = "";
        return;
      }

      pintarTabla(data.eventos);
      pintarInfo(data.from, data.to, data.total);
      pintarBotones(data.total, data.per_page, data.page);
    })
    .catch((err) => {
      console.error("Error cargando eventos:", err);
      tbody.innerHTML = "";
    });
}

function pintarTabla(eventos) {
  const tbody = document.getElementById("tbody_eventos");
  tbody.innerHTML = "";

  if (eventos.length === 0) {
    tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">No hay eventos</td>
            </tr>`;
    return;
  }

  eventos.forEach((ev) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${ev.titulo}</td>
            <td>${formatearFecha(ev.fecha)}</td>
            <td>${ev.hora}</td>
            <td>${ev.localizacion}</td>
            <td>
                <i class="fa-solid fa-pen" data-id="${ev.id}"></i>
                <i class="fa-solid fa-trash" data-id="${ev.id}"></i>
            </td>`;
    tbody.appendChild(tr);
  });
}

function pintarInfo(desde, hasta, total) {
  const el = document.getElementById("paginacion_info");
  if (!el) return;
  if (total === 0) el.textContent = "Mostrando 0–0 de 0 eventos";
  else el.textContent = `Mostrando ${desde}–${hasta} de ${total} eventos`;
}

function pintarBotones(total, perPage, page) {
  const cont = document.getElementById("paginacion_botones");
  cont.innerHTML = "";

  const totalPaginas = Math.ceil(total / perPage);

  for (let p = 1; p <= totalPaginas; p++) {
    const btn = document.createElement("button");
    btn.textContent = p;
    if (p === page) btn.classList.add("active");

    btn.addEventListener("click", () => {
      paginaActual = p;
      cargarEventos();
    });

    cont.appendChild(btn);
  }
}

const selFiltro = document.getElementById("filtro_eventos");
if (selFiltro) {
  selFiltro.addEventListener("change", () => {
    filtroActual = selFiltro.value;
    paginaActual = 1;
    cargarEventos();
  });
}

function formatearFecha(fechaISO) {
  // fechaISO = "YYYY-MM-DD"
  if (!fechaISO) return "";
  const parts = fechaISO.split("-");
  if (parts.length !== 3) return fechaISO;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
