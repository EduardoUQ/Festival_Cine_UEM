document.addEventListener("DOMContentLoaded", () => {
    // 1) Cargar los datos del usuario
    fetch("../php/session_info.php")
        .then((response) => response.json())
        .then((info) => {
            if (!info.logged || info.rol !== "usuario") {
                window.location.href = "../html/login.html";
                return;
            }

            // Cargamos el nombre del usuario en el panel
            const elNombre = document.getElementById("nombre");
            if (elNombre) {
                elNombre.textContent = info.nombre;
            }

            // Botón para cerrar sesión
            const btnLogout = document.getElementById("btn_logout");
            if (btnLogout) {
                btnLogout.addEventListener("click", () => {
                    fetch("../php/logout.php", { method: "POST" })
                        .then((r) => r.json())
                        .then((resp) => {
                            if (resp.status === "success") {
                                window.location.href = "../html/login.html";
                            } else {
                                alert("No se pudo cerrar sesión");
                            }
                        })
                        .catch((err) => {
                            console.error("Error al cerrar sesión", err);
                            alert("Error al cerrar sesión. Observa la consola.");
                        });
                });
            }
        })
        .catch((error) => {
            console.error("No se pudo comprobar la sesión:", error);
            window.location.href = "../html/login.html";
        });
});

// Variables del modal
const modalOverlay = document.getElementById("modalOverlay");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// Funciones del modal
function showModal(type, title, message) {
    modalIcon.className = `modal-icon ${type}`;
    modalIcon.innerHTML =
        type === "success"
            ? '<i class="fa-solid fa-circle-check"></i>'
            : '<i class="fa-solid fa-circle-xmark"></i>';

    modalTitle.textContent = title;
    modalMessage.textContent = message;

    modalOverlay.classList.add("active");
}

modalCloseBtn.addEventListener("click", () => {
    modalOverlay.classList.remove("active");
});

// Variables de la cabecera
const titulo = document.getElementById("h4")
const parrafo = document.getElementById("parrafo");

// Variables del formulario de candidatura
const form = document.getElementById("formCandidatura")
const tituloCorto = document.getElementById("tituloCortometraje");
const cartel = document.getElementById("cartel");
const input_imagen = document.getElementById("imagen");
const sinopsis = document.getElementById("sinopsis");
const video = document.getElementById("video");
const editar = document.getElementById("editar");
const enviar = document.getElementById("enviar");
const mensaje_imagen = document.getElementById("mensaje_imagen");
const imagenBox = document.getElementById("imagenBox");
let editMode = false;
let imagen_seleccionada = null;
let imagen_actual = null;      // URL (modo edición)
let video_actual = null;
let estadoCandidatura = "";  //Estado en el que se encuentra la candidatura

// Comenzamos con los botones ocultos para editar
editar.style.display = "none";
enviar.style.display = "none";

// Comenzamos con el botón de enviar desabilitado
// Mantener el botón de guardado en disable
enviar.disabled = true;

// Obtener id de la candidatura
function getCandidaturaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? id : null;
}

// EDITAR CANDIDATURAS
const candidaturaId = getCandidaturaIdFromUrl();

// console.log(candidaturaId)
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

            if (estadoCandidatura == "SUBSANAR") {
                editar.style.display = "block";
                enviar.style.display = "block";
                titulo.textContent = "Pendiente de subsanación"
                parrafo.textContent = c.comentarios
            } else if (estadoCandidatura == "RECHAZAR") {
                titulo.textContent = "Rechazado"
                parrafo.textContent = c.comentarios
            } else if (estadoCandidatura == "ACEPTAR") {
                titulo.textContent = "Aceptado"
                parrafo.textContent = "Tu candidatura ha sido aceptada"
            }
        })
        .catch(err => console.error("Error cargando candidaturas:", err));
}

// Activar / desactivar inputs
function toggleInputs(enable) {
    tituloCorto.disabled = !enable;
    sinopsis.disabled = !enable;
    input_imagen.disabled = !enable;

}

// Click en el botón de editar
editar.addEventListener("click", () => {
    editMode = !editMode;

    if (editMode) {
        toggleInputs(true);
        editar.style.display = "block";
        enviar.style.display = "block";
        imagenBox.style.cursor = "pointer";
        enviar.disabled = false;
        editar.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar edición';
    } else {
        toggleInputs(false);
        enviar.disabled = true;
        imagenBox.style.cursor = "default";
        editar.innerHTML = '<i class="fa-solid fa-pen"></i> Editar';
    }
});

// Cargar la imagen cambiada para que se vea
input_imagen.addEventListener("change", () => {
    const file = input_imagen.files[0];

    if (!file) return;

    if (!["image/jpeg", "image/png"].includes(file.type)) {
        mensaje_imagen.textContent = "Solo JPG o PNG";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        mensaje_imagen.textContent = "Máx 2MB";
        return;
    }

    imagen_seleccionada = file;
    mensaje_imagen.textContent = "";

    const reader = new FileReader();
    reader.onload = () => {
        cartel.src = reader.result;
        cartel.style.display = "block";
    };
    reader.readAsDataURL(file);

    input_imagen.value = "";

});


// Función enviar los datos
form.addEventListener("submit", (e) => {

    e.preventDefault();

    // Pasamos todo al PHP
    editar_candidatura_usuario();

    toggleInputs(false);
    editMode = false;
    editar.innerHTML = '<i class="fa-solid fa-pen"></i> Editar';
});

// Función de envío al PHP
function editar_candidatura_usuario() {
    let formData = new FormData();

    formData.append("accion", "editar_candidatura");
    formData.append("titulo", tituloCorto.value);
    formData.append("sinopsis", sinopsis.value);
    formData.append("id", candidaturaId);
    if (imagen_seleccionada) {
        formData.append("cartel", imagen_seleccionada);
    }

    fetch("../php/editar_candidatura_usuario.php", {
        method: "POST",
        body: formData
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                showModal(data.status, data.titulo, data.message);
            } else {
                showModal(data.status, data.titulo, data.message);
            }
        });
}