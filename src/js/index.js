document.addEventListener("DOMContentLoaded", () => {
  // =======================
  // MENÚ HAMBURGUESA
  // =======================
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("nav");

  if (hamburger && nav) {
    hamburger.addEventListener("click", () => {
      nav.classList.toggle("active");
    });
  }

  // =======================
  // NOTICIAS (4 más recientes)
  // =======================
  (function cargarNoticiasHome() {
    const grid = document.getElementById("news_grid");
    if (!grid) return;

    fetch("../php/listar_noticias_publico.php")
      .then((r) => r.json())
      .then((lista) => {
        grid.innerHTML = "";

        if (!Array.isArray(lista) || lista.length === 0) {
          // Si no hay noticias, ocultamos la sección entera
          const sec = document.querySelector("section.news");
          if (sec) sec.style.display = "none";
          return;
        }

        lista.forEach((n) => {
          const article = document.createElement("article");
          article.className = "news-card";

          const img = document.createElement("img");
          // imagen_url guardada como ruta relativa tipo "noticias/xxx.jpg"
          const urlImg = (n.imagen_url || "").trim();
          img.src = urlImg ? "../" + urlImg : "../img/noticia1.png";
          img.alt = n.titulo || "Noticia";

          const content = document.createElement("div");
          content.className = "news-content";

          const h3 = document.createElement("h3");
          h3.textContent = n.titulo || "Sin título";

          const p = document.createElement("p");
          p.textContent = recortarTexto(limpiarTexto(n.contenido || ""), 120);

          content.appendChild(h3);
          content.appendChild(p);

          //click a la noticia concreta
          article.style.cursor = "pointer";
          article.addEventListener("click", () => {
            window.location.href =
              "noticia1.html?id=" + encodeURIComponent(n.id);
          });

          article.appendChild(img);
          article.appendChild(content);
          grid.appendChild(article);
        });
      })
      .catch((err) => {
        console.error("Error cargando noticias:", err);
        const sec = document.querySelector("section.news");
        if (sec) sec.style.display = "none";
      });

    function limpiarTexto(txt) {
      // por si el contenido trae HTML
      return String(txt)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    function recortarTexto(txt, max) {
      if (!txt) return "";
      if (txt.length <= max) return txt;
      return txt.slice(0, max - 1) + "…";
    }
  })();

  // =======================
  // PREMIOS (por categoría: 1 categoría por línea)
  // =======================
  (function cargarPremiosHome() {
    const cont = document.getElementById("awards_by_category");
    if (!cont) return;

    fetch("../php/listar_premios_publico.php")
      .then((r) => r.json())
      .then((lista) => {
        cont.innerHTML = "";

        if (!Array.isArray(lista) || lista.length === 0) {
          // si no hay premios, ocultamos el bloque (pero mantenemos galas)
          return;
        }

        // Agrupar por categoria
        const grupos = {};
        lista.forEach((p) => {
          const cat = (p.categoria || "Otros").trim() || "Otros";
          if (!grupos[cat]) grupos[cat] = [];
          grupos[cat].push(p);
        });

        // Ordenar categorías alfabéticamente
        const categorias = Object.keys(grupos).sort((a, b) =>
          a.localeCompare(b, "es"),
        );

        categorias.forEach((cat) => {
          // Línea por categoría
          const bloque = document.createElement("div");
          bloque.style.maxWidth = "1100px";
          bloque.style.margin = "0 auto 26px";
          bloque.style.textAlign = "left";

          const h = document.createElement("h3");
          h.textContent = cat;
          h.style.margin = "0 0 12px";
          h.style.fontSize = "1.25rem";
          h.style.color = "#fff";

          const fila = document.createElement("div");
          fila.style.display = "grid";
          fila.style.gridTemplateColumns =
            "repeat(auto-fit, minmax(220px, 1fr))";
          fila.style.gap = "16px";

          // Ordenar por puesto
          grupos[cat].sort((x, y) => (x.puesto || 0) - (y.puesto || 0));

          grupos[cat].forEach((p) => {
            const card = document.createElement("article");
            card.className = "award-card";
            card.style.padding = "22px 18px";

            const iconWrap = document.createElement("div");
            iconWrap.className = "award-icon " + claseIcono(p.puesto);

            const icon = document.createElement("i");
            icon.className = iconoFa(p.puesto);

            iconWrap.appendChild(icon);

            const title = document.createElement("h3");
            title.textContent = puestoTexto(p.puesto);

            // Dotación (si viene NULL, no lo pintamos)
            const dot = document.createElement("span");
            dot.className = "award-amount";
            const d = p.dotacion;
            if (
              d !== null &&
              d !== undefined &&
              d !== "" &&
              !isNaN(Number(d))
            ) {
              dot.textContent = "€" + Number(d).toFixed(2).replace(".00", "");
            } else {
              dot.textContent = "";
              dot.style.display = "none";
            }

            const desc = document.createElement("p");
            desc.textContent = (p.descripcion || "").trim();

            card.appendChild(iconWrap);
            card.appendChild(title);
            card.appendChild(dot);
            card.appendChild(desc);

            fila.appendChild(card);
          });

          bloque.appendChild(h);
          bloque.appendChild(fila);
          cont.appendChild(bloque);
        });
      })
      .catch((err) => {
        console.error("Error cargando premios:", err);
      });

    function claseIcono(puesto) {
      const n = Number(puesto);
      if (n === 1) return "gold";
      if (n === 2) return "silver";
      return "bronze";
    }

    function iconoFa(puesto) {
      const n = Number(puesto);
      if (n === 1) return "fa-solid fa-trophy";
      if (n === 2) return "fa-solid fa-medal";
      return "fa-solid fa-star";
    }

    function puestoTexto(puesto) {
      const n = Number(puesto);
      if (n === 1) return "1º Puesto";
      if (n === 2) return "2º Puesto";
      if (n === 3) return "3º Puesto";
      if (!isNaN(n) && n > 3) return n + "º Puesto";
      return "Premio";
    }
  })();

  // =======================
  // BANDA PATROCINADORES (PUBLICO)
  // =======================
  (function cargarBandaPatrocinadores() {
    const cont = document.getElementById("banda_patrocinadores");
    if (!cont) return;

    fetch("../php/listar_patrocinadores_publico.php")
      .then((r) => r.json())
      .then((lista) => {
        cont.innerHTML = "";

        if (!Array.isArray(lista) || lista.length === 0) {
          cont.style.display = "none";
          return;
        }

        cont.style.display = "flex";

        lista.forEach((p) => {
          const a = document.createElement("a");
          a.className = "patro-item";

          // Color (required en tu formulario, pero por si acaso)
          const hex = (p.color_hex || "").trim();
          a.style.backgroundColor = hex ? "#" + hex : "#111";

          // Link en pestaña nueva si hay web_url
          const url = (p.web_url || "").trim();
          if (url) {
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
          } else {
            a.href = "javascript:void(0)";
          }

          const img = document.createElement("img");
          img.src = "../" + p.logo_url;
          img.alt = p.nombre || "Patrocinador";

          a.appendChild(img);
          cont.appendChild(a);
        });
      })
      .catch((err) => {
        console.error("Error cargando patrocinadores:", err);
        cont.style.display = "none";
      });
  })();

  // =======================
  // SLIDER HERO
  // =======================
  const slides = document.querySelectorAll(".hero-slide");
  const prev = document.querySelector(".hero-arrow.left");
  const next = document.querySelector(".hero-arrow.right");

  // Si no encuentra los elementos, no seguimos con el slider (pero el resto del JS ya corrió)
  if (!slides.length || !prev || !next) {
    console.warn(
      "Slider: no encuentro .hero-slide o las flechas. Revisa clases en el HTML.",
    );
    return;
  }

  let index = 0;
  let timer = null;
  const SLIDE_TIME = 15000; // 15 segundos

  function showSlide(i) {
    slides.forEach((slide) => slide.classList.remove("active"));
    slides[i].classList.add("active");

    const video = slides[i].querySelector("video");
    if (video) {
      video.currentTime = 0;

      const p = video.play();
      if (p && typeof p.catch === "function") {
        p.catch(() => {});
      }
    }
  }

  function nextSlide() {
    index = (index + 1) % slides.length;
    showSlide(index);
  }

  function prevSlide() {
    index = (index - 1 + slides.length) % slides.length;
    showSlide(index);
  }

  function startAuto() {
    stopAuto();
    if (slides.length > 1) {
      timer = setInterval(nextSlide, SLIDE_TIME);
    }
  }

  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  // Inicial
  showSlide(index);
  startAuto();

  // Flechas (reinician el contador)
  next.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    nextSlide();
    startAuto();
  });

  prev.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    prevSlide();
    startAuto();
  });
});
