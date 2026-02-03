document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("news_grid");
  const pagination = document.getElementById("pagination");
  const searchInput = document.getElementById("buscar_input");


  let currentPage = 1;
  let currentSearch = "";

  function cargarNoticias() {
    const url =
      "../php/mostrar_noticias_noticias.php?page=" +
      currentPage +
      "&search=" +
      encodeURIComponent(currentSearch);

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        grid.innerHTML = "";
        pagination.innerHTML = "";

        grid.innerHTML = "";
        pagination.innerHTML = "";

        if (
          !data ||
          !Array.isArray(data.noticias) ||
          data.noticias.length === 0
        ) {
          const msg = document.createElement("p");
          msg.className = "no-results";
          msg.textContent =
            "No se han encontrado noticias con ese criterio de búsqueda.";
          grid.appendChild(msg);
          return;
        }

        data.noticias.forEach((n) => {
          const article = document.createElement("article");
          article.className = "news-card";

          const img = document.createElement("img");
          img.src = n.imagen_url ? "../" + n.imagen_url : "../img/noticia1.png";
          img.alt = n.titulo;

          const content = document.createElement("div");
          content.className = "news-content";

          const date = document.createElement("span");
          date.className = "date";
          date.textContent = n.fecha;

          const h3 = document.createElement("h3");
          h3.textContent = n.titulo;

          const p = document.createElement("p");
          p.textContent = n.contenido;

          content.appendChild(date);
          content.appendChild(h3);
          content.appendChild(p);

          article.appendChild(img);
          article.appendChild(content);

          article.style.cursor = "pointer";
          article.addEventListener("click", () => {
            window.location.href =
              "noticia1.html?id=" + encodeURIComponent(n.id);
          });

          grid.appendChild(article);
        });

        // paginación
        if (data.total_pages > 1) {
          if (currentPage > 1) {
            crearBoton("‹", currentPage - 1);
          }

          for (let i = 1; i <= data.total_pages; i++) {
            crearBoton(i, i, i === currentPage);
          }

          if (currentPage < data.total_pages) {
            crearBoton("›", currentPage + 1);
          }
        }
      })
      .catch((e) => console.error(e));
  }

  function crearBoton(texto, page, active = false) {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (active ? " active" : "");
    btn.textContent = texto;
    btn.addEventListener("click", () => {
      currentPage = page;
      cargarNoticias();
    });
    pagination.appendChild(btn);
  }

  // Buscar SOLO al pulsar Enter
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      currentSearch = searchInput.value.trim();
      currentPage = 1;
      cargarNoticias();
    }
  });

  cargarNoticias();
});
