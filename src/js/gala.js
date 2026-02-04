document.addEventListener("DOMContentLoaded", () => {
  pintarGala();
  pintarPrograma();
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

  // function formatearFecha(f) {
  //     const d = new Date(f);
  //     return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  // }

  /* ============================
     SUMMARY CARDS
     ============================ */
  // function pintarSummary(gala) {
  //     const cards = document.querySelectorAll(".summary-card h2");

  //     cards[0].textContent = gala.anio;
  //     cards[1].textContent = gala.total_participantes;
  //     cards[2].textContent = ""; // se rellena con ganadores reales luego
  // }

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
  function pintarGaleria(imagenes) {
    const grid = document.querySelector(".gallery-grid");
    grid.innerHTML = "";

    imagenes.forEach(url => {
      const div = document.createElement("div");
      div.classList.add("gallery-item");

      div.innerHTML = `<img src="${url}" alt="">`;
      grid.appendChild(div);
    });
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
}

