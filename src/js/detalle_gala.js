const params = new URLSearchParams(window.location.search);
const id = params.get("id");

if (!id) {
    alert("ID de gala no encontrado");
}

fetch("../php/mostrar_detalle_gala.php?id=" + id)
    .then(r => r.json())
    .then(data => {
        if (data.status !== "success") return;
        console.log(data.ganadores);
        pintarHeader(data.gala);
        pintarSummary(data.gala);
        pintarGanadores(data.ganadores);
        pintarGaleria(data.imagenes);
    });

/* ============================
   HEADER
   ============================ */
function pintarHeader(gala) {
    document.querySelector(".edition-header h1").textContent = "FESTIVAL DE CORTOS " + gala.anio;
    document.querySelector(".event-date strong").textContent = formatearFecha(gala.fecha_evento);
}

function formatearFecha(f) {
    const d = new Date(f);
    return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

/* ============================
   SUMMARY CARDS
   ============================ */
function pintarSummary(gala) {
    const cards = document.querySelectorAll(".summary-card h2");

    cards[0].textContent = gala.anio;
    cards[1].textContent = gala.total_participantes;
    cards[2].textContent = ""; // se rellena con ganadores reales luego
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
    document.querySelectorAll(".summary-card h2")[2].textContent = lista.length;
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
