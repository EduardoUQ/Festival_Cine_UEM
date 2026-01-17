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

// Cancelar: volver al panel (crear y editar)
const btnCancelar = document.getElementById("btn_cancelar");
if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
        window.location.href = "panel_patrocinadores.html";
    });
}

// Variables del formulario
const form_patrocinador = document.getElementById("news-form");
const input_nombre = document.getElementById("nombre_patrocinador");
const input_imagen = document.getElementById("image");
const input_preview = document.getElementById("preview");
let imagen_seleccionada = null; // File
let imagen_actual = null;      // URL (modo edición)
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

// Obtener 
function getPatrocinadorIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? id : null;
}


// EDITAR PATROCINADORES
const patrocinadorId = getPatrocinadorIdFromUrl();

if (patrocinadorId) {
    const h1 = document.getElementById("titulo")
    if (h1) h1.textContent = "EDITAR PATROCINADOR";

    const btnSubmit = document.getElementById("btn_enviar");
    if (btnSubmit) btnSubmit.textContent = "Guardar cambios";

    fetch(`../php/editar_patrocinador.php?id=${encodeURIComponent(patrocinadorId)}`)
        .then((r) => r.json())
        .then((data) => {
            const p = data.patrocinador;
            input_nombre.value = p.nombre ?? "";

            // Imagen existente
            imagen_actual = "../" + p.logo_url;
            input_preview.src = imagen_actual;
            input_preview.style.display = "block";
            document.getElementById("image-upload").classList.add("has-image");
        })
        .catch((err) => {
            console.error("Error cargando premio:", err);
            if (mensaje_formulario)
                mensaje_formulario.textContent =
                    "Error cargando el patrocinador. Observa la consola.";
        });
}


// Validación de imagen
const uploadBox = document.getElementById("image-upload");

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
if (form_patrocinador) {
    form_patrocinador.addEventListener("submit", function (event) {
        event.preventDefault();

        const nombre = input_nombre.value;

        // Validaciones
        if (!nombre || !input_preview.src) {
            mensaje_formulario.textContent = "*Por favor completa todos los campos";
            return;
        }

        // Pasamos todo al PHP
        agregar_patrocinador();
    });
}

// --- Envío al PHP ---
function agregar_patrocinador() {
    let formData = new FormData();
    formData.append("funcion", "agregar_patrocinador");
    formData.append("nombre", input_nombre.value);
    if (imagen_seleccionada) {
        formData.append("imagen", imagen_seleccionada);
    }

    if (patrocinadorId) {
        formData.append("id", patrocinadorId);
        formData.append("accion", "editar");
    } else {
        formData.append("accion", "crear");
    }

    fetch("../php/formulario_patrocinador.php", {
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