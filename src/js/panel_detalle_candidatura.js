// Variables del formulario de datos
const nombreUsuario = document.getElementById("nombreForm");
const dni = document.getElementById("dni");
const expediente = document.getElementById("expediente");
const email = document.getElementById("email")

// Variables del corto
const tituloCorto = document.getElementById("tituloCortometraje");
const cartel = document.getElementById("cartel");
const sinopsis = document.getElementById("sinopsis");
const video = document.getElementById("video");
const rechazar = document.getElementById("rechazar");
const subsanar = document.getElementById("subsanar");
const aceptar = document.getElementById("aceptar");
let imagen_actual = null;      // URL (modo edición)
let video_actual = null;
let estadoCandidatura = "";  //Estado en el que se encuentra la candidatura

// Variables de los botones
const btnRechazar = document.getElementById("btnRechazar");
const btnSubsanar = document.getElementById("btnSubsanar");
const btnNominar = document.getElementById("btnNominar");
const btnAceptar = document.getElementById("btnAceptar");

// Comenzamos con los botones ocultos y lo cambiaremos según el estado que se encuentre la candidatura
btnRechazar.style.display = "none";
btnSubsanar.style.display = "none";
btnNominar.style.display = "none";
btnAceptar.style.display = "none";

// Obtener id de la candidatura
function getCandidaturaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? id : null;
}

// EDITAR CANDIDATURAS
const candidaturaId = getCandidaturaIdFromUrl();

// Cargar los datos del usuario
document.addEventListener("DOMContentLoaded", () => {
    // Cargamos los datos del perfil del usuario
    fetch(`../php/mostrar_usuario_datos.php?id=${encodeURIComponent(candidaturaId)}`)
        .then(res => res.json())
        .then((data) => {
            const d = data.datos;
            console.log(d)
            nombreUsuario.value = d.nombre_apellidos ?? "";
            dni.value = d.dni ?? "";
            expediente.value = d.num_expediente ?? "";
            email.value = d.email ?? "";
        })
        .catch(err => console.error("Error cargando candidaturas:", err));

});

// Cargar los datos del corto
if (candidaturaId) {
    fetch(`../php/mostrar_detalle_candidatura_usuario.php?id=${encodeURIComponent(candidaturaId)}`)
        .then((r) => r.json())
        .then((data) => {
            const c = data.candidatura;
            console.log(c)
            estadoCandidatura = c.estado;
            tituloCorto.value = c.titulo ?? "";
            sinopsis.value = c.sinopsis ?? "";

            // Imagen existente
            imagen_actual = "../" + c.cartel_url;
            cartel.src = imagen_actual;
            // Video existente
            video_actual = "../" + c.corto_url;
            video.src = video_actual;

            if (estadoCandidatura == "PENDIENTE") {
                btnRechazar.style.display = "block";
                btnSubsanar.style.display = "block";
                btnAceptar.style.display = "block"
            } else if (estadoCandidatura == "RECHAZADA") {
                btnAceptar.style.display = "block";
                btnSubsanar.style.display = "block";
            } else if (estadoCandidatura == "ACEPTADA") {
                btnRechazar.style.display = "block";
                btnSubsanar.style.display = "block";
                btnNominar.style.display = "block";
            } else if (estadoCandidatura == "SUBSANAR") {
                btnRechazar.style.display = "block";
                btnAceptar.style.display = "block";
            } else if (estadoCandidatura == "NOMINADA") {
                btnRechazar.style.display = "block";
                btnSubsanar.style.display = "block";
                btnAceptar.style.display = "block";
            }

        })
        .catch(err => console.error("Error cargando candidaturas:", err));
}

// Click en el botón de aceptar
btnAceptar.addEventListener("click", () => abrirModal("ACEPTADA"));

// Click en el botón de subsanar
btnSubsanar.addEventListener("click", () => abrirModal("SUBSANAR"));

// Click en el botón de rechazar
btnRechazar.addEventListener("click", () => abrirModal("RECHAZADA"));

// Click en el botón de nominar
btnNominar.addEventListener("click", () => abrirModal("NOMINADA"));

// Variables del modal
const modal = document.getElementById("modalAccion");
const modalTitulo = document.getElementById("modalTitulo");
const modalTexto = document.getElementById("modalTexto");
const modalMensaje = document.getElementById("modalMensaje");
const btnConfirmar = document.getElementById("modalConfirmar");
const btnCancelar = document.getElementById("modalCancelar");

let accionActual = null;

// Función del modal
function abrirModal(accion) {
    accionActual = accion;
    modal.classList.remove("hidden");
    modalMensaje.classList.add("hidden");
    modalMensaje.value = "";

    if (accion === "ACEPTADA") {
        modalTitulo.textContent = "Aceptar candidatura";
        modalTexto.textContent = "¿Confirmas que deseas aceptar esta candidatura?";
    }

    if (accion === "NOMINADA") {
        modalTitulo.textContent = "Nominar candidatura";
        modalTexto.textContent = "¿Deseas nominar esta candidatura?";
    }

    if (accion === "SUBSANAR") {
        modalTitulo.textContent = "Subsanar candidatura";
        modalTexto.textContent = "Indica qué debe corregir el participante:";
        modalMensaje.classList.remove("hidden");
    }

    if (accion === "RECHAZADA") {
        modalTitulo.textContent = "Rechazar candidatura";
        modalTexto.textContent = "Indica el motivo del rechazo:";
        modalMensaje.classList.remove("hidden");
    }
}

btnCancelar.addEventListener("click", () => {
    modal.classList.add("hidden");
});

// Confirmar el envío
btnConfirmar.addEventListener("click", () => {
    const mensaje = modalMensaje.value.trim();

    if ((accionActual === "SUBSANAR" || accionActual === "RECHAZADA") && mensaje === "") {
        alert("Debes escribir un mensaje");
        return;
    }

    editar_estado_candidatura(accionActual, mensaje);
});

function editar_estado_candidatura(accion, mensaje) {
    let formData = new FormData();
    formData.append("accion", accion);
    formData.append("comentarios", mensaje);
    formData.append("id", candidaturaId);

    fetch("../php/editar_estado_candidatura.php", {
        method: "POST",
        body: formData
    })
        .then(r => r.json())
        .then(data => {
            // alert(data.message);
            if (data.status === "success") {
                window.location.href = "../html/panel_candidaturas.html"
            }
        });
}