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
      "Slider: no encuentro .hero-slide o las flechas. Revisa clases en el HTML."
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
