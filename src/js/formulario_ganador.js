// Cargar la cabecera
document.addEventListener("DOMContentLoaded", () => {
    // 1) Cargar los datos del usuario
    fetch("../php/session_info.php")
        .then((response) => response.json())
        .then((info) => {
            if (!info.logged || info.rol !== "admin") {
                window.location.href = "../html/login.html";
                return;
            }

            // Cargamos el nombre del Admin en el panel
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

// FUNCIÓN DEL MODAL
const modal = document.getElementById("modal_mensaje");
const modalIcono = document.getElementById("modal_icono");
const modalTitulo = document.getElementById("modal_titulo");
const modalTexto = document.getElementById("modal_texto");
const modalBtn = document.getElementById("modalBtn");

let redireccion = null;

function mostrarModal(tipo, mensaje, redirect = null) {
    modal.className = "modal mostrar";

    modalIcono.className = "fa-solid";
    modal.classList.remove("modal_exito", "modal_error");

    if (tipo === "success") {
        modal.classList.add("modal_exito");
        modalIcono.classList.add("fa-circle-check");
        modalTitulo.textContent = "Operación correcta";
    } else {
        modal.classList.add("modal_error");
        modalIcono.classList.add("fa-circle-xmark");
        modalTitulo.textContent = "Error";
    }

    modalTexto.textContent = mensaje;
    redireccion = redirect;
}

modalBtn.addEventListener("click", () => {
    modal.classList.remove("mostrar");
    if (redireccion) {
        window.location.href = redireccion;
    }
});



// Variables del formulario
const form_ganador_honorifico = document.getElementById("news-form");
const input_nombre = document.getElementById("nombre_profesional");
const input_correo = document.getElementById("correo");
const input_numero = document.getElementById("numero");
const input_video = document.getElementById("video");
// Variables de los mensajes de error
const mensaje_nombre = document.getElementById("mensaje_nombre");
const mensaje_correo = document.getElementById("mensaje_correo");
const mensaje_numero = document.getElementById("mensaje_numero");
const mensaje_video = document.getElementById("mensaje_video");
const mensaje_formulario = document.getElementById("mensaje_formulario");

// Creamos un array de las variables que haremos validaciones
const campos = [
    { input: input_nombre, mensaje: mensaje_nombre, texto: "*Escribe un nombre" },
    { input: input_correo, mensaje: mensaje_correo, texto: "*Escribe un correo" },
    { input: input_numero, mensaje: mensaje_numero, texto: "*Escribe un número" }
];

// Validación para algunos campos 
campos.forEach(c => {
    c.input.addEventListener("blur", () => {
        if (
            c.input.type !== "file" && c.input.value.trim() === ""
        ) {
            c.mensaje.textContent = c.texto;
        }
    });

    c.input.addEventListener("input", () => {
        c.mensaje.textContent = "";
    });
});

input_video.addEventListener("change", () => {
    const file = input_video.files[0];

    if (!file) {
        mensaje_video.textContent = "Debes seleccionar un vídeo";
        return;
    }

    // Tipo
    const tiposPermitidos = ["video/mp4", "video/mov"];
    if (!tiposPermitidos.includes(file.type)) {
        mensaje_video.textContent = "Formato de vídeo no válido";
        input_video.value = "";
        return;
    }

    // Tamaño (50 MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        mensaje_video.textContent = "El vídeo no puede superar los 50 MB";
        input_video.value = "";
        return;
    }

    mensaje_video.textContent = "";
});

// Verificamos cuando se envíe
if (form_ganador_honorifico) {
    form_ganador_honorifico.addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = input_nombre.value;
        const correo = input_correo.value;
        const numero = input_numero.value;
        const video = input_video.files[0];

        // Validaciones
        if (!nombre || !correo || !numero || !video) {
            mensaje_formulario.textContent = "*Por favor completa todos los campos";
            return;
        }

        // Pasamos todo al PHP
        publicar_ganador(nombre, correo, numero, video);
    });
}

// --- Envío al PHP ---
function publicar_ganador(nombre, correo, numero, video) {
    let formData = new FormData();
    formData.append("funcion", "publicar_ganador");
    // formData.append("accion", "crear");
    formData.append("nombre", nombre);
    formData.append("correo", correo);
    formData.append("numero", numero);
    formData.append("video", video);

    fetch("../php/formulario_ganador_honorifico.php", {
        method: "POST",
        body: formData
    })
        .then(response => {
            if (!response.ok) {
                throw new Error("Error HTTP");
            }
            return response.json();
        })
        .then(data => {
            if (data.status === "success") {
                mostrarModal(
                    "success",
                    data.message,
                    "../html/panel_ganadores.html"
                );
            } else {
                mostrarModal(
                    "error",
                    data.message
                );
            }
        })
        .catch(error => {
            mostrarModal(
                "error",
                "Error de conexión con el servidor"
            );
            console.error(error);
        });
}