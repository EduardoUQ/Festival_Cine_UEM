document.addEventListener("DOMContentLoaded", () => {
    pintarGala();
    pintarPrograma();
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
