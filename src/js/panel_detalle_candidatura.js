// Variables del formulario de datos
const nombreForm = document.getElementById("nombreForm");
const dni = document.getElementById("dni");
const expediente = document.getElementById("expediente");
const email = document.getElementById("email")

// Variables del corto
const cartel = document.getElementById("cartel");
const sinopsis = document.getElementById("sinopsis");
const video = document.getElementById("video");
const rechazar = document.getElementById("rechazar");
const subsanar = document.getElementById("subsanar");
const aceptar = document.getElementById("aceptar");
let imagen_actual = null;      // URL (modo edición)
let video_actual = null;
let estadoCandidatura = "";  //Estado en el que se encuentra la candidatura

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
    fetch("../php/mostrar_usuario_datos.php")
        .then(res => res.json())
        .then((data) => {
            console.log(data);
            const d = data.datos;
            console.log(d)
            nombreForm.value = d.nombre_apellidos ?? "";
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

        })
        .catch(err => console.error("Error cargando candidaturas:", err));
}