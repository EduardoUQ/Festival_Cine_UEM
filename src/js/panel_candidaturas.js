// =========================
// CONFIGURACIÓN GLOBAL
// =========================
const POR_PAGINA = 8;

let estadoActual = "PENDIENTE";
let categoriaActual = "";
let paginaActual = 1;
let textoBusqueda = "";

// =========================
// DOM READY
// =========================
document.addEventListener("DOMContentLoaded", () => {

  // -------- SESIÓN / ADMIN --------
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
            });
        });
      }

      // Primera carga
      cargarCategorias();
      cargarCandidaturas();
    })
    .catch(() => {
      window.location.href = "../html/login.html";
    });

  // -------- TABS ESTADO --------
  const btnPendiente = document.getElementById("pendiente");
  const btnAceptada = document.getElementById("aceptada");
  const btnRechazada = document.getElementById("rechazada");
  const btnNominada = document.getElementById("nominada");
  const btnSubsanar = document.getElementById("subsanar");

  function activarTab(tabActivo) {
    document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
    tabActivo.classList.add("active");
  }

  btnPendiente.addEventListener("click", () => {
    activarTab(btnPendiente);
    estadoActual = "PENDIENTE";
    paginaActual = 1;
    cargarCandidaturas();
  });

  btnAceptada.addEventListener("click", () => {
    activarTab(btnAceptada);
    estadoActual = "ACEPTADA";
    paginaActual = 1;
    cargarCandidaturas();
  });

  btnRechazada.addEventListener("click", () => {
    activarTab(btnRechazada);
    estadoActual = "RECHAZADA";
    paginaActual = 1;
    cargarCandidaturas();
  });

  btnNominada.addEventListener("click", () => {
    activarTab(btnNominada);
    estadoActual = "NOMINADA";
    paginaActual = 1;
    cargarCandidaturas();
  });

  btnSubsanar.addEventListener("click", () => {
    activarTab(btnSubsanar);
    estadoActual = "SUBSANAR";
    paginaActual = 1;
    cargarCandidaturas();
  });

  // -------- SELECT CATEGORÍA --------
  const selCategoria = document.getElementById("filtro_categoria");
  if (selCategoria) {
    selCategoria.addEventListener("change", () => {
      categoriaActual = selCategoria.value;
      paginaActual = 1;
      cargarCandidaturas();
    });
  }

  // -------- BUSCADOR (ENTER) --------
  const inputBuscar = document.getElementById("buscar_input");
  if (inputBuscar) {
    inputBuscar.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        textoBusqueda = inputBuscar.value.trim();
        paginaActual = 1;
        cargarCandidaturas();
      }
    });
  }
});

// =========================
// CARGAR CATEGORÍAS
// =========================
function cargarCategorias() {
  fetch("../php/listar_categorias.php")
    .then(r => r.json())
    .then(data => {
      if (!data || data.status !== "success") return;

      const sel = document.getElementById("filtro_categoria");
      if (!sel) return;

      sel.innerHTML = `<option value="">Todas</option>`;
      data.categorias.forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat;
        opt.textContent = cat;
        sel.appendChild(opt);
      });
    });
}

// =========================
// CARGAR CANDIDATURAS
// =========================
function cargarCandidaturas() {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>`;

  const params = new URLSearchParams();
  params.set("estado", estadoActual);
  params.set("page", paginaActual);
  params.set("per_page", POR_PAGINA);

  if (categoriaActual) params.set("categoria", categoriaActual);
  if (textoBusqueda !== "") params.set("busqueda", textoBusqueda);

  fetch(`../php/mostrar_candidaturas.php?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.status !== "success") {
        pintarError("No se pudieron cargar las candidaturas");
        return;
      }

      pintarTabla(data.candidaturas);
      pintarInfo(data.from, data.to, data.total);
      pintarBotones(data.total, data.per_page, data.page);
    })
    .catch(() => {
      pintarError("Error cargando candidaturas");
    });
}

// =========================
// PINTAR TABLA
// =========================
function pintarTabla(candidaturas) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = "";

  if (!candidaturas || candidaturas.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center;">
          No hay candidaturas para estos filtros
        </td>
      </tr>`;
    return;
  }

  candidaturas.forEach(c => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(c.titulo)}</td>
      <td>${escapeHTML(c.categoria)}</td>
      <td>${escapeHTML(c.participante)}</td>
      <td class="estado">${escapeHTML(c.estado)}</td>
      <td>
        <a class="btn" href="panel_detalle_candidatura.html?id=${encodeURIComponent(c.id)}">
          Ver candidatura
        </a>
      </td>`;
    tbody.appendChild(tr);
  });
}

// =========================
// PAGINACIÓN
// =========================
function pintarInfo(desde, hasta, total) {
  const el = document.getElementById("paginacion_info");
  if (!el) return;
  el.textContent = total === 0
    ? "Mostrando 0–0 de 0 candidaturas"
    : `Mostrando ${desde}–${hasta} de ${total} candidaturas`;
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
      cargarCandidaturas();
    });

    cont.appendChild(btn);
  }
}

// =========================
// ERRORES Y UTILIDADES
// =========================
function pintarError(msg) {
  const tbody = document.querySelector("table tbody");
  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">${escapeHTML(msg)}</td></tr>`;
}

function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
