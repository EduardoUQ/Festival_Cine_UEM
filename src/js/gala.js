document.addEventListener("DOMContentLoaded", () => {
  pintarGala();
  pintarPrograma();
  pintarPremiosEnPremiosGalas();
  mostrarEvento()
  mostrar_post_evento();
});

function pintarGala() {
  const contLocalizacion = document.getElementById("gala_localizacion");
  if (!contLocalizacion) return;

  const formData = new FormData();
  formData.append("funcion", "obtener_gala_activa");

  fetch("../php/gala.php", {
    method: "POST",
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      if (data.status !== "success" || !data.gala) {
        contLocalizacion.innerHTML = "<li><span>No hay gala activa.</span></li>";
        return;
      }

      const g = data.gala;
      const h2Info = document.getElementById("titulo_info_gala");
      if (h2Info) {
        h2Info.textContent = `Información de la gala ${g.anio || ""}`;
      }
      contLocalizacion.innerHTML = `
        <li>
          <strong>${g.lugar_nombre || ""}</strong>
          <span>${g.lugar_subtitulo || ""}</span>
        </li>
        <li>
          <strong>Dirección</strong>
          <span>${g.direccion || ""}</span>
        </li>
        <li>
          <strong>Capacidad</strong>
          <span>${g.capacidad || ""}</span>
        </li>
        <li>
          <strong>Estacionamiento</strong>
          <span>${g.estacionamiento || ""}</span>
        </li>
      `;
    })
    .catch(() => {
      contLocalizacion.innerHTML = "<li><span>Error al cargar la gala.</span></li>";
    });
}

function pintarPrograma() {
  const contPrograma = document.getElementById("schedule_gala");
  if (!contPrograma) return;

  const formData = new FormData();
  formData.append("funcion", "obtener_programa_gala");

  fetch("../php/gala.php", {
    method: "POST",
    body: formData
  })
    .then(r => r.json())
    .then(data => {
      if (data.status !== "success") {
        contPrograma.innerHTML = "<li class='schedule-item'><div>Error al cargar el programa.</div></li>";
        return;
      }

      const eventos = data.eventos || [];
      if (eventos.length === 0) {
        contPrograma.innerHTML = "<li class='schedule-item'><div>No hay eventos en la fecha de la gala.</div></li>";
        return;
      }

      contPrograma.innerHTML = eventos.map(ev => `
        <li class="schedule-item">
          <span class="time">${ev.hora || ""}</span>
          <div>
            <strong>${ev.titulo || ""}</strong>
            <p>${ev.descripcion || ""}</p>
            <span class="place">${ev.localizacion || ""}</span>
          </div>
        </li>
      `).join("");
    })
    .catch(() => {
      contPrograma.innerHTML = "<li class='schedule-item'><div>Error al cargar el programa.</div></li>";
    });
}

function mostrarEvento() {
  const modo = localStorage.getItem("modoGala");

  // Selecciones de tus secciones
  const pre = document.querySelector(".pre-gala-section");
  const post = document.querySelector(".post-gala-section");

  // Ocultas todo por defecto
  pre.hidden = true;
  post.hidden = true;

  if (modo === "pre") {
    pre.hidden = false;
  }

  if (modo === "post") {
    post.hidden = false;
  }

}

function mostrar_post_evento() {
  fetch("../php/mostrar_gala_post_evento.php")
    .then(r => r.json())
    .then(data => {
      if (data.status !== "success") return;
      console.log(data.ganadores);
      pintarHeader(data.gala);
      // pintarSummary(data.gala);
      pintarGanadores(data.ganadores);
      pintarGaleria(data.imagenes);
    });

  /* ============================
     HEADER
     ============================ */
  function pintarHeader(gala) {
    document.getElementById("h2").textContent = "Información de la Gala " + gala.anio;
    // document.querySelector(".event-date strong").textContent = formatearFecha(gala.fecha_evento);
  }

  /* ============================
     GANADORES
     ============================ */
  function pintarGanadores(lista) {
    const grid = document.querySelector(".winners-grid");
    grid.innerHTML = ""; // limpiar contenido estático

    lista.forEach(g => {
      const div = document.createElement("div");
      div.classList.add("winner-card");

      if (g.participante || g.honorifico) {

        div.innerHTML = `
            <div class="winner-badge">
                <span>${g.categoria}</span>
            </div>

            <div class="winner-info">
                <h3>${g.participante ?? g.honorifico}</h3>
                <span class="winner-place">${g.puesto !== 0 ? g.puesto + "º" : ""}</span>
            </div>

            <p class="work-title">${g.titulo ?? g.descripcion}</p>
            <p class="description">${g.sinopsis ?? ""}</p>

            ${g.corto_url ? `<a href="../${g.corto_url}" target="_blank" class="btn-view">Ver cortometraje</a>` : ""}
            ${g.cartel_url ? `<a href="../${g.cartel_url}" target="_blank" class="btn-view">Ver cartel</a>` : ""}
            ${g.video_url ? `<a href="../${g.video_url}" target="_blank" class="btn-view">Ver video</a>` : ""}
        `;
        grid.appendChild(div);
      }

    });
    console.log(lista);
    // Actualizar total premios
    // document.querySelectorAll(".summary-card h2")[2].textContent = lista.length;
  }

  /* ============================
     GALERÍA
     ============================ */
  let imagenesLightbox = [];
  let indexActual = 0;

  function pintarGaleria(imagenes) {
    const grid = document.querySelector(".gallery-grid");
    grid.innerHTML = "";
    imagenesLightbox = imagenes;

    imagenes.forEach((url, i) => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");
      div.dataset.index = i;

      div.innerHTML = `<img src="${url}" alt="">`;
      grid.appendChild(div);
    });
  }

  // Abrir lightbox
  document.addEventListener("click", e => {
    const item = e.target.closest(".gallery-item");
    if (!item) return;

    indexActual = Number(item.dataset.index);
    mostrarImagen(indexActual);
  });

  // Abrir cartel / video en el lightbox
  document.addEventListener("click", e => {
    if (e.target.classList.contains("btn-view")) {
      e.preventDefault();

      const url = e.target.getAttribute("href");
      abrirEnLightbox(url);
    }
  });


  // Botón siguiente
  document.getElementById("lb-next").addEventListener("click", e => {
    e.stopPropagation(); // evita que se cierre el lightbox
    indexActual = (indexActual + 1) % imagenesLightbox.length;
    mostrarImagen(indexActual);
  });

  // Botón anterior
  document.getElementById("lb-prev").addEventListener("click", e => {
    e.stopPropagation();
    indexActual = (indexActual - 1 + imagenesLightbox.length) % imagenesLightbox.length;
    mostrarImagen(indexActual);
  });

  // Cerrar solo si se hace click fuera de la imagen y de las flechas
  document.getElementById("lightbox").addEventListener("click", e => {
    if (e.target.id === "lightbox") {
      document.getElementById("lightbox").style.display = "none";
    }
  });

  function mostrarImagen(i) {
    const content = document.getElementById("lightbox-content");

    content.innerHTML = `<img src="${imagenesLightbox[i]}">`;

    // Mostrar flechas para imágenes
    document.getElementById("lb-prev").style.display = "block";
    document.getElementById("lb-next").style.display = "block";

    document.getElementById("lightbox").style.display = "flex";
  }

  function abrirEnLightbox(url) {
    const content = document.getElementById("lightbox-content");

    // limpiar contenido anterior
    content.innerHTML = "";

    const ext = url.split(".").pop().toLowerCase();

    // Imagen (carteles)
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) {
      content.innerHTML = `<img src="${url}">`;
    }

    // Video (mp4 / mov / webm)
    else if (["mp4", "mov", "webm"].includes(ext)) {
      content.innerHTML = `
            <video controls autoplay>
                <source src="${url}">
            </video>
        `;
    }

    // Ocultar flechas porque video/cartel no pertenece al carrusel
    document.getElementById("lb-prev").style.display = "none";
    document.getElementById("lb-next").style.display = "none";

    document.getElementById("lightbox").style.display = "flex";
  }

}

/*=================================
GALAS ANTERIORES
===================================*/
const previousSection = document.querySelector(".galas-grid");

fetch("../php/cargar_ediciones.php")
  .then(r => r.json())
  .then(data => {
    if (data.status !== "success") return;

    data.ediciones.forEach(ed => {
      const card = document.createElement("div");
      card.classList.add("gala-card");

      card.innerHTML = `
                <div class="gala-image"><img src="${ed.media_url}"></div>

                <div class="gala-content"> <h3>Gala ${ed.anio}</h3></div>
                    
                <div class="gala-footer"><a href="edicion_anterior.html?id=${ed.id}" class="btn-secondary">
                    Ver Gala completa →
                </a>
                </div>
            `;

      previousSection.appendChild(card);
    });
  });


function pintarPremiosEnPremiosGalas() {
  const cont = document.getElementById("premios_container");
  if (!cont) return;

  fetch("../php/listar_premios_publico.php")
    .then(r => r.json())
    .then(lista => {
      cont.innerHTML = "";
      if (!Array.isArray(lista) || lista.length === 0) return;

      // Agrupar por categoria
      const grupos = {};
      lista.forEach(p => {
        const cat = (p.categoria || "").trim().toUpperCase();
        if (!grupos[cat]) grupos[cat] = [];
        grupos[cat].push(p);
      });

      // Helper: crea una card con el formato index
      const crearCard = (p, tituloOverride = null) => {
        const card = document.createElement("article");
        card.className = "award-card";

        const iconWrap = document.createElement("div");
        iconWrap.className = "award-icon " + claseIcono(p.puesto);

        const icon = document.createElement("i");
        icon.className = iconoFa(p.puesto);
        iconWrap.appendChild(icon);

        const title = document.createElement("h3");
        title.textContent = (tituloOverride ?? (((p.titulo || "").trim()) || puestoTexto(p.puesto)));

        const dot = document.createElement("span");
        dot.className = "award-amount";
        const d = p.dotacion;

        if (d !== null && d !== undefined && d !== "" && !isNaN(Number(d))) {
          dot.textContent = "€" + Number(d).toFixed(2).replace(".00", "");
        } else {
          dot.style.display = "none";
        }

        const desc = document.createElement("p");
        desc.textContent = (p.descripcion || "").trim();

        card.appendChild(iconWrap);
        card.appendChild(title);
        card.appendChild(dot);
        card.appendChild(desc);

        return card;
      };

      // Helper: render sección con título + fila
      const renderSeccion = (titulo, premios, cardsPorFila = null) => {
        if (!premios || premios.length === 0) return;

        // título sección (si lo quieres igual que en tu HTML hardcode)
        const h = document.createElement("h3");
        h.textContent = titulo;
        h.style.color = "#fff";
        h.style.margin = "40px 0 16px";
        h.style.textAlign = "center";

        const fila = document.createElement("div");
        fila.className = "awards-cards";

        // si quieres forzar nº de columnas por fila (3/2), puedes hacerlo inline
        if (cardsPorFila) {
          fila.style.display = "grid";
          fila.style.gridTemplateColumns = `repeat(${cardsPorFila}, minmax(0, 1fr))`;
          fila.style.gap = "16px";
        }

        premios.forEach(p => fila.appendChild(crearCard(p)));

        cont.appendChild(h);
        cont.appendChild(fila);
      };

      // Orden por puesto dentro de cada categoría
      Object.keys(grupos).forEach(cat => {
        grupos[cat].sort((a, b) => (a.puesto || 0) - (b.puesto || 0));
      });

      // 1) ALUMNO: 3 tarjetas en una fila
      renderSeccion("Mejor Cortometraje UE", grupos["ALUMNO"], 3);

      // 2) ALUMNI: 2 tarjetas en una fila
      renderSeccion("Mejor Cortometraje Alumni", grupos["ALUMNI"], 2);

      // 3) ESPECIAL/HONORIFICO: 1 tarjeta (ancha)
      const especiales = grupos["ESPECIAL"] || grupos["HONORIFICO"] || grupos["HONORÍFICO"] || [];
      if (especiales.length) {
        const h = document.createElement("h3");
        h.textContent = "Premio a la Trayectoria Profesional";
        h.style.color = "#fff";
        h.style.margin = "40px 0 16px";
        h.style.textAlign = "center";

        const wrap = document.createElement("div");
        wrap.className = "awards-cards";
        wrap.style.display = "grid";
        wrap.style.gridTemplateColumns = "1fr";

        const card = crearCard(especiales[0], "Premio a la Trayectoria Profesional");
        wrap.appendChild(card);

        cont.appendChild(h);
        cont.appendChild(wrap);
      }
    })
    .catch(err => console.error("Error cargando premios:", err));

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
    if (n === 1) return "Primer Premio";
    if (n === 2) return "Segundo Premio";
    if (n === 3) return "Tercer Premio";
    return "Premio";
  }
}

