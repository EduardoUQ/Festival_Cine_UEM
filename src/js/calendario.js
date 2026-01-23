let fechaActual = new Date();
let fechaSeleccionadaActual = null;

let eventosBD = [];
let mapaEventosPorFecha = {};

document.addEventListener("DOMContentLoaded", function () {
    cargarEventosBD()
        .then(() => {
            generarCalendario();
            inicializarNavegacionMeses();


            const hoyStr = formatearYYYYMMDD(new Date());
            seleccionarDiaPorFecha(hoyStr);
        })
        .catch((err) => {
            console.error("Error cargando eventos:", err);
        });
});

function cargarEventosBD() {
    let formData = new FormData();
    formData.append("funcion", "listar_eventos");

    return fetch("../php/formulario_evento.php", {
        method: "POST",
        body: formData
    })
        .then((response) => {
            if (!response.ok) throw new Error("Error HTTP");
            return response.json();
        })
        .then((data) => {
            if (data.status !== "success") {
                eventosBD = [];
            } else {
                eventosBD = data.eventos || [];
            }

            // Construimos mapa por fecha
            mapaEventosPorFecha = {};
            eventosBD.forEach((ev) => {
                if (!mapaEventosPorFecha[ev.fecha]) mapaEventosPorFecha[ev.fecha] = [];
                mapaEventosPorFecha[ev.fecha].push(ev);
            });

            // Ordenar por hora dentro de cada fecha
            Object.keys(mapaEventosPorFecha).forEach((f) => {
                mapaEventosPorFecha[f].sort((a, b) => (a.hora || "").localeCompare(b.hora || ""));
            });
        });
}

// ---------- CALENDARIO (rejilla manual) ----------

function generarCalendario() {
    const contDias = document.getElementById("dias-calendario");
    if (!contDias) return;

    contDias.innerHTML = "";

    const ano = fechaActual.getFullYear();
    const mes = fechaActual.getMonth(); // 0-11

    const nombresMeses = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const tituloMes = document.getElementById("titulo-mes");
    if (tituloMes) tituloMes.textContent = `${nombresMeses[mes]} ${ano}`;

    const primerDiaFecha = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0).getDate();

    const diaSemanaPrimerDia = primerDiaFecha.getDay(); // 0 domingo
    const desplazamiento = (diaSemanaPrimerDia === 0) ? 6 : diaSemanaPrimerDia - 1; // L=0 ... D=6

    //huecos vacíos
    for (let i = 0; i < desplazamiento; i++) {
        const divVacio = document.createElement("div");
        divVacio.classList.add("dia-calendario", "vacio");
        contDias.appendChild(divVacio);
    }

    const hoy = new Date();

    for (let d = 1; d <= ultimoDiaMes; d++) {
        const divDia = document.createElement("div");
        divDia.classList.add("dia-calendario");
        divDia.textContent = d;

        const fecha = construirFecha(ano, mes, d);
        divDia.dataset.fecha = fecha;

        //marcar hoy
        if (d === hoy.getDate() && mes === hoy.getMonth() && ano === hoy.getFullYear()) {
            divDia.classList.add("dia-hoy");
        }

        //marcar si hay eventos en esa fecha
        if (mapaEventosPorFecha[fecha] && mapaEventosPorFecha[fecha].length > 0) {
            divDia.classList.add("dia-con-evento");
        }

        //click en día
        divDia.addEventListener("click", function () {
            document.querySelectorAll(".dia-calendario").forEach(c => c.classList.remove("activo"));
            divDia.classList.add("activo");

            fechaSeleccionadaActual = fecha;
            pintarEventosDia(fecha);
        });

        contDias.appendChild(divDia);
    }
}

function inicializarNavegacionMeses() {
    const btnAnt = document.getElementById("mes-anterior");
    const btnSig = document.getElementById("mes-siguiente");

    if (btnAnt && !btnAnt.dataset.listener) {
        btnAnt.dataset.listener = "1";
        btnAnt.addEventListener("click", function () {
            fechaActual.setMonth(fechaActual.getMonth() - 1);
            generarCalendario();
        });
    }

    if (btnSig && !btnSig.dataset.listener) {
        btnSig.dataset.listener = "1";
        btnSig.addEventListener("click", function () {
            fechaActual.setMonth(fechaActual.getMonth() + 1);
            generarCalendario();
        });
    }
}

//---------- LISTA DE EVENTOS DEL DÍA ----------

function pintarEventosDia(fecha) {
    const detalleFecha = document.getElementById("detalleFecha");
    const listaEventos = document.getElementById("listaEventos");
    if (!listaEventos) return;

    if (detalleFecha) detalleFecha.textContent = `Eventos del ${formatearDDMMYYYY(fecha)}`;

    const eventos = mapaEventosPorFecha[fecha] || [];

    if (eventos.length === 0) {
        listaEventos.innerHTML = "<p>No hay eventos programados para este día.</p>";
        return;
    }

    listaEventos.innerHTML = eventos.map(ev => `
    <div class="event-item">
      <div class="event-date">
        <span class="day-number">${fecha.split("-")[2]}</span>
        <span class="month">${mesCorto(fecha)}</span>
      </div>
      <div class="event-info">
        <h5>${ev.titulo}</h5>
        <p><strong>Hora:</strong> ${ev.hora} | <strong>Lugar:</strong> ${ev.localizacion}</p>
        <p>${ev.descripcion || ""}</p>
      </div>
    </div>
  `).join("");
}

function seleccionarDiaPorFecha(fecha) {
    //si el mes actual no coincide, lo movemos
    const [y, m] = fecha.split("-").map(x => parseInt(x, 10));
    fechaActual = new Date(y, m - 1, 1);
    generarCalendario();

    //marcar activo si existe en el mes mostrado
    const celda = document.querySelector(`.dia-calendario[data-fecha="${fecha}"]`);
    if (celda) {
        document.querySelectorAll(".dia-calendario").forEach(c => c.classList.remove("activo"));
        celda.classList.add("activo");
    }

    fechaSeleccionadaActual = fecha;
    pintarEventosDia(fecha);
}

// ---------- HELPERS ----------

function construirFecha(ano, mesIndex, dia) {
    const mes = String(mesIndex + 1).padStart(2, "0");
    const d = String(dia).padStart(2, "0");
    return `${ano}-${mes}-${d}`;
}

function formatearDDMMYYYY(fecha) {
    const p = fecha.split("-");
    return `${p[2]}/${p[1]}/${p[0]}`;
}

function mesCorto(fecha) {
    const mes = fecha.split("-")[1];
    const meses = {
        "01": "ENE", "02": "FEB", "03": "MAR", "04": "ABR",
        "05": "MAY", "06": "JUN", "07": "JUL", "08": "AGO",
        "09": "SEP", "10": "OCT", "11": "NOV", "12": "DIC"
    };
    return meses[mes] || "";
}

function formatearYYYYMMDD(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}
