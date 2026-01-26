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
        <i class="fa-solid fa-pen" data-id="${noticia.id}" style="cursor:pointer;"></i>
        <i class="fa-solid fa-trash" data-id="${noticia.id}" style="cursor:pointer;"></i>
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
    if (confirm("¿Seguro que quieres borrar esta noticia?")) {
      fetch(`../php/eliminar_noticia.php?id=${encodeURIComponent(id)}`)
        .then((res) => res.json())
        .then(() => cargarNoticias(paginaActual))
        .catch((err) => console.error("Error al eliminar:", err));
    }
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
