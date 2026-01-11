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
const form_patrocinador = document.getElementById("news-form");
const input_nombre = document.getElementById("nombre");
const input_imagen = document.getElementById("image");
// Variables de los mensajes de error
const mensaje_nombre = document.getElementById("mensaje_nombre");
const mensaje_imagen = document.getElementById("mensaje_imagen");
const mensaje_formulario = document.getElementById("mensaje_formulario");

// Validar el nombre
input_nombre.addEventListener('blur', function () {
    if (this.value.trim() === '') {
        mensaje_nombre.textContent = '*Ingresa el nombre del patrocinador';
    }
});

// Limpiar mensaje al escribir
input_nombre.addEventListener("input", function () {
    if (this.value.trim() !== "") {
        mensaje_nombre.textContent = "";
    }
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
if (form_patrocinador) {
    form_patrocinador.addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = input_nombre.value;
        const imagen = input_imagen.files[0];

        // Validaciones
        if (!nombre || imagen.lenght === 0) {
            mensaje_formulario.textContent = "*Por favor completa todos los campos";
            return;
        }

        // Pasamos todo al PHP
        agregar_patrocinador(nombre, imagen);
    });
}

// --- Envío al PHP ---
function agregar_patrocinador(nombre, imagen) {
    let formData = new FormData();
    formData.append("funcion", "agregar_patrocinador");
    formData.append("nombre", nombre);
    formData.append("imagen", imagen);

    fetch("../php/patrocinador.php", {
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
                    "../html/panel_patrocinadores.html"
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