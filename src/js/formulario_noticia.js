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

// VARIABLES DEL FORMULARIO
// Variables del formulario
const form_noticias = document.getElementById("news-form");
const input_titulo = document.getElementById("title");
const input_contenido = document.getElementById("content");
const input_imagen = document.getElementById("image");
const input_fecha = document.getElementById("date");
const input_preview = document.getElementById("preview");
let imagen_seleccionada = null; // File
let imagen_actual = null;      // URL (modo edición)

// Variables de los mensajes de error
const mensaje_titulo = document.getElementById("mensaje_titulo");
const mensaje_descripcion = document.getElementById("mensaje_descripcion");
const mensaje_imagen = document.getElementById("mensaje_imagen");
const mensaje_fecha = document.getElementById("mensaje_fecha");
const mensaje_formulario = document.getElementById("mensaje_formulario");

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

// Cancelar: volver al panel (crear y editar)
const btnCancelar = document.getElementById("btn_cancelar");
if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
        window.location.href = "panel_noticias.html";
    });
}

// Obtener 
function getNoticiaIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? id : null;
}

// EDITAR NOTICIAS
const noticiaId = getNoticiaIdFromUrl();

if (noticiaId) {
    const h1 = document.getElementById("titulo")
    if (h1) h1.textContent = "EDITAR NOTICIA";

    const btnSubmit = document.getElementById("btn_enviar");
    if (btnSubmit) btnSubmit.textContent = "Guardar cambios";

    fetch(`../php/editar_noticia.php?id=${encodeURIComponent(noticiaId)}`)
        .then((r) => r.json())
        .then((data) => {
            const n = data.noticia;

            input_titulo.value = n.titulo ?? "";
            input_contenido.value = n.contenido ?? "";
            input_fecha.value = n.fecha ?? "";

            // Imagen existente
            imagen_actual = n.imagen_url;
            input_preview.src = imagen_actual;
            input_preview.style.display = "block";
            document.getElementById("image-upload").classList.add("has-image");
        })
        .catch((err) => {
            console.error("Error cargando premio:", err);
            if (mensaje_formulario)
                mensaje_formulario.textContent =
                    "Error cargando la noticia. Observa la consola.";
        });
}



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

const uploadBox = document.getElementById("image-upload");
// Validación de imagen

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
        input_preview.src = reader.result;
        input_preview.style.display = "block";
        uploadBox.classList.add("has-image");
    };
    reader.readAsDataURL(file);

    input_imagen.value = "";

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
        if (!titulo || !contenido || !fecha || !input_preview.src) {
            mensaje_formulario.textContent = "*Por favor completa todos los campos";
            return;
        }

        // Pasamos todo al PHP
        publicar_noticia();
    });
}

// --- Envío al PHP ---
function publicar_noticia() {
    let formData = new FormData();

    formData.append("titulo", input_titulo.value);
    formData.append("contenido", input_contenido.value);
    formData.append("fecha", input_fecha.value);

    if (imagen_seleccionada) {
        formData.append("imagen", imagen_seleccionada);
    }

    if (noticiaId) {
        formData.append("id", noticiaId);
        formData.append("accion", "editar");
    } else {
        formData.append("accion", "crear");
    }

    fetch("../php/formulario_noticia.php", {
        method: "POST",
        body: formData
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                mostrarModal("success", data.message, "panel_noticias.html");
            } else {
                mostrarModal("error", data.message);
            }
        });
}