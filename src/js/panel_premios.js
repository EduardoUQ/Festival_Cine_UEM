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
              else alert("No se pudo cerrar sesión");
            })
            .catch((err) => {
              console.error("Error al cerrar sesión", err);
              alert("Error al cerrar sesión. Observa la consola.");
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
    confirmarBorrado(id);
  });

  function cargarYPintarPremios() {
    // si "todas" llamamos sin filtro "", si activas 1, si no activa 0
    const activa = selectActiva ? selectActiva.value : "";

    //construimos la url si activa está vacía muestra todos, si no muestra activa como filtro
    const url =
      activa === ""
        ? "../php/mostrar_premios.php"
        : `../php/mostrar_premios.php?activa=${activa}`;

    //llamada al servidor con la url con o sin la información de activa
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

  //función para pintar los premios a la que se le pasa el array de premios como parámetro
  function pintarPorCategoria(premios) {
    // Agrupar SOLO para mostrar cajas por categoría (usamos un objeto normal)
    const grupos = {};

    //recorremos los premios y guardamos las categorías
    premios.forEach((p) => {
      const cat = p.categoria || "Sin categoría";
      //si no hay categoría lo mete en un array vacío
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(p);
    });

    //recorremos cada categoría y pintamos su caja con su tabla
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

function confirmarBorrado(id) {
  if (!confirm("¿Seguro que quieres borrar este premio?")) return;

  const formData = new FormData();
  formData.append("id", id);

  fetch("../php/eliminar_premio.php", {
    method: "POST",
    body: formData,
  })
    .then((r) => r.json())
    .then((data) => {
      console.log("Respuesta borrar:", data);
      if (data.status === "success") location.reload();
      else alert(data.message || "No se pudo eliminar el premio");
    })
    .catch((err) => {
      console.error("Error al eliminar:", err);
      alert("Error al eliminar. Observa la consola.");
    });
}
