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
const form_noticias = document.getElementById("news-form");
const input_titulo = document.getElementById("title");
const input_contenido = document.getElementById("content");
const input_imagen = document.getElementById("image");
const input_fecha = document.getElementById("date");
// Variables de los mensajes de error
const mensaje_titulo = document.getElementById("mensaje_titulo");
const mensaje_descripcion = document.getElementById("mensaje_descripcion");
const mensaje_imagen = document.getElementById("mensaje_imagen");
const mensaje_fecha = document.getElementById("mensaje_fecha");
const mensaje_formulario = document.getElementById("mensaje_formulario");

// Creamos un array de las variables que haremos validaciones
const campos = [
    { input: input_titulo, mensaje: mensaje_titulo, texto: "*Escribe un titulo" },
    { input: input_contenido, mensaje: mensaje_descripcion, texto: "*Escribe el cuerpo de la noticia" },
    { input: input_fecha, mensaje: mensaje_fecha, texto: "*Selecciona una fecha" }
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

// Validación de imagen
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const TIPOS_PERMITIDOS = ["image/png", "image/jpeg"];

input_imagen.addEventListener("change", () => {
    const archivo = input_imagen.files[0];

    // No hay archivo
    if (!archivo) {
        mensaje_imagen.textContent = "*Selecciona una imagen";
        return;
    }

    // Validar tipo
    if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
        mensaje_imagen.textContent = "*Solo se permiten imágenes JPG o PNG";
        input_imagen.value = ""; // limpia el input
        return;
    }

    // Validar tamaño
    if (archivo.size > MAX_SIZE) {
        mensaje_imagen.textContent = "*La imagen no puede superar los 2MB";
        input_imagen.value = "";
        return;
    }

    // Si esta TODO OK
    mensaje_imagen.textContent = "";
});

input_imagen.addEventListener("change", () => {
    console.log(input_imagen.files);
});

const preview = document.getElementById("preview");

input_imagen.addEventListener("change", () => {
    const archivo = input_imagen.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = e => {
        preview.src = e.target.result;
        preview.style.display = "block";
    };
    reader.readAsDataURL(archivo);
});

// Ocultar texto de la imagen
const uploadBox = document.getElementById("image-upload");

input_imagen.addEventListener("change", () => {
    const archivo = input_imagen.files[0];

    if (!archivo) {
        uploadBox.classList.remove("has-image");
        return;
    }

    // Validaciones (tipo y tamaño)
    if (!["image/png", "image/jpeg"].includes(archivo.type) ||
        archivo.size > 2 * 1024 * 1024) {
        uploadBox.classList.remove("has-image");
        input_imagen.value = "";
        return;
    }

    // Imagen correcta → ocultar contenido
    uploadBox.classList.add("has-image");
});

// Verificamos cuando se envíe
if (form_noticias) {
    form_noticias.addEventListener("submit", function (event) {
        event.preventDefault();

        const titulo = input_titulo.value;
        const contenido = input_contenido.value;
        const imagen = input_imagen.files[0];
        const fecha = input_fecha.value;

        // Validaciones
        if (!titulo || !contenido || !fecha || imagen.lenght === 0) {
            mensaje_formulario.textContent = "*Por favor completa todos los campos";
            return;
        }

        // Pasamos todo al PHP
        publicar_noticia(titulo, contenido, imagen, fecha);
    });
}

// --- Envío al PHP ---
function publicar_noticia(titulo, contenido, imagen, fecha) {
    let formData = new FormData();
    formData.append("funcion", "publicar_noticia");
    formData.append("titulo", titulo);
    formData.append("contenido", contenido);
    formData.append("imagen", imagen);
    formData.append("fecha", fecha);

    fetch("../php/noticia.php", {
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
                    "../html/panel_noticias.html"
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