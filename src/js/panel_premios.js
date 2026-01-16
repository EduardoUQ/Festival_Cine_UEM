document.addEventListener("DOMContentLoaded", () => {
  fetch("../php/session_info.php")
    .then(r => r.json())
    .then(info => {
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
            .then(r => r.json())
            .then(resp => {
              if (resp.status === "success") window.location.href = "../html/login.html";
              else alert("No se pudo cerrar sesión");
            })
            .catch(err => {
              console.error("Error al cerrar sesión", err);
              alert("Error al cerrar sesión. Observa la consola.");
            });
        });
      }

      iniciarPanelPremios();
    })
    .catch(err => {
      console.error("No se pudo comprobar la sesión:", err);
      window.location.href = "../html/login.html";
    });
});

function iniciarPanelPremios() {
  const cont = document.getElementById("categoriasContainer");
  const selectActiva = document.getElementById("selectActiva");
  const tplCard = document.getElementById("tplCategoriaCard");
  const tplRow = document.getElementById("tplPremioRow");

  // Validaciones mínimas de HTML
  if (!cont) {
    console.error("Falta #categoriasContainer en el HTML");
    return;
  }
  if (!tplCard) {
    cont.innerHTML = `<p style="padding:12px;">Falta el template <b>#tplCategoriaCard</b> en el HTML.</p>`;
    console.error("Falta #tplCategoriaCard en el HTML");
    return;
  }
  if (!tplRow) {
    cont.innerHTML = `<p style="padding:12px;">Falta el template <b>#tplPremioRow</b> en el HTML.</p>`;
    console.error("Falta #tplPremioRow en el HTML");
    return;
  }

  // Carga inicial
  cargarYPintarPremios();

  if (selectActiva) {
    selectActiva.addEventListener("change", cargarYPintarPremios);
  } else {
    console.warn("No existe #selectActiva (el filtro no funcionará).");
  }

  // Clicks editar/borrar
  document.addEventListener("click", (e) => {
    const btnEditar = e.target.closest(".js-editar");
    if (btnEditar) {
      e.preventDefault();
      const id = btnEditar.dataset.id;
      window.location.href = `formulario_premio.html?id=${encodeURIComponent(id)}`;
      return;
    }

    const btnBorrar = e.target.closest(".js-borrar");
    if (btnBorrar) {
      const id = btnBorrar.dataset.id;
      confirmarBorrado(id);
      return;
    }
  });

  function cargarYPintarPremios() {
    const activa = selectActiva ? selectActiva.value : "";
    const url =
      activa === ""
        ? "../php/mostrar_premios.php"
        : `../php/mostrar_premios.php?activa=${encodeURIComponent(activa)}`;

    console.log("Cargando premios desde:", url);

    fetch(url)
      .then(async (r) => {
        const data = await r.json().catch(() => null);

        // Si el servidor devuelve 401/500, igual verás JSON (o null)
        if (!r.ok) {
          console.error("HTTP error:", r.status, data);
          mostrarMensajeError(data?.message || `Error HTTP ${r.status}`);
          return null;
        }
        return data;
      })
      .then((data) => {
        if (data === null) return;

        // Si NO es array, es que el PHP devolvió un objeto error
        if (!Array.isArray(data)) {
          console.error("mostrar_premios.php NO devolvió un array:", data);
          mostrarMensajeError(data?.message || "Respuesta inválida del servidor");
          return;
        }

        console.log("Premios recibidos:", data);

        cont.innerHTML = "";

        if (data.length === 0) {
          cont.innerHTML = `<p style="padding:12px;">No hay premios para mostrar con ese filtro.</p>`;
          return;
        }

        pintarPorCategoria(data);
      })
      .catch((err) => {
        console.error("Error cargando premios:", err);
        mostrarMensajeError("Error cargando premios. Mira consola/Network.");
      });
  }

  function mostrarMensajeError(msg) {
    cont.innerHTML = `
      <div style="padding:12px; border:1px solid #f2bcbc; background:#fff5f5; border-radius:8px;">
        <b>No se pudieron cargar los premios.</b><br>
        <span>${msg}</span>
      </div>
    `;
  }

  function pintarPorCategoria(premios) {
    // Agrupar SOLO para mostrar cajas por categoría
    const mapa = new Map();
    premios.forEach((p) => {
      const cat = p.categoria || "Sin categoría";
      if (!mapa.has(cat)) mapa.set(cat, []);
      mapa.get(cat).push(p);
    });

    mapa.forEach((lista, categoria) => {
      const cardFrag = tplCard.content.cloneNode(true);

      const badge = cardFrag.querySelector(".js-categoria-nombre");
      if (badge) badge.textContent = categoria;

      const tbody = cardFrag.querySelector(".js-premios-body");
      lista.forEach((p) => {
        const rowFrag = tplRow.content.cloneNode(true);

        rowFrag.querySelector(".js-puesto").textContent = p.puesto;
        rowFrag.querySelector(".js-dotacion").textContent =
          (p.dotacion === null || p.dotacion === "") ? "-" : `${p.dotacion} €`;
        rowFrag.querySelector(".js-descripcion").textContent = p.descripcion;
        rowFrag.querySelector(".js-activa").textContent = (p.activa == 1) ? "Sí" : "No";

        const aEditar = rowFrag.querySelector(".js-editar");
        if (aEditar) aEditar.dataset.id = p.id;

        const tdAcciones = rowFrag.querySelector("td:last-child");
        if (tdAcciones) {
          tdAcciones.insertAdjacentHTML(
            "beforeend",
            ` <i class="fa-solid fa-trash js-borrar" data-id="${p.id}" style="cursor:pointer;"></i>`
          );
        }

        tbody.appendChild(rowFrag);
      });

      cont.appendChild(cardFrag);
    });
  }
}

function confirmarBorrado(id) {
  if (!confirm("¿Seguro que quieres borrar este premio?")) return;

  const formData = new FormData();
  formData.append("id", id);

  fetch("../php/eliminar_premio.php", {
    method: "POST",
    body: formData,
  })
    .then(r => r.json())
    .then(data => {
      console.log("Respuesta borrar:", data);
      if (data.status === "success") location.reload();
      else alert(data.message || "No se pudo eliminar el premio");
    })
    .catch(err => {
      console.error("Error al eliminar:", err);
      alert("Error al eliminar. Observa la consola.");
    });
}
