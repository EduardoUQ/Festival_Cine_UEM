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
const input_color = document.getElementById("color_hex");
const input_web = document.getElementById("web_url");

const input_imagen = document.getElementById("image");
const input_preview = document.getElementById("preview");
const uploadBox = document.getElementById("image-upload");

let imagen_seleccionada = null; // File
let imagen_actual = null;      // URL (modo edición)

// Variables de los mensajes de error
const mensaje_nombre = document.getElementById("mensaje_nombre");
const mensaje_color = document.getElementById("mensaje_color");
const mensaje_web = document.getElementById("mensaje_web");
const mensaje_imagen = document.getElementById("mensaje_imagen");
const mensaje_formulario = document.getElementById("mensaje_formulario");

// Helpers
function esHex6(valor) {
    return /^[0-9a-fA-F]{6}$/.test(valor);
}

function validarWebOpcional(url) {
    const v = url.trim();
    if (v === "") return true;
    // Acepta con o sin http(s), pero con dominio válido
    return /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/.test(v);
}

// Validar el nombre
input_nombre.addEventListener("blur", function () {
    if (this.value.trim() === "") {
        mensaje_nombre.textContent = "*Ingresa el nombre del patrocinador";
    }
});
input_nombre.addEventListener("input", function () {
    if (this.value.trim() !== "") mensaje_nombre.textContent = "";
});

// Validar color (required)
input_color.addEventListener("blur", function () {
    const v = this.value.trim();
    if (v === "") {
        mensaje_color.textContent = "*El color es obligatorio";
        return;
    }
    if (!esHex6(v)) {
        mensaje_color.textContent = "*Debe tener 6 caracteres HEX (sin #). Ej: FFAACC";
        return;
    }
    mensaje_color.textContent = "";
});
input_color.addEventListener("input", function () {
    // Limpiar mientras escribe si va bien
    const v = this.value.trim();
    if (v !== "" && esHex6(v)) mensaje_color.textContent = "";
});

// Validar web (opcional)
input_web.addEventListener("blur", function () {
    const v = this.value.trim();
    if (v === "") {
        mensaje_web.textContent = "";
        return;
    }
    if (!validarWebOpcional(v)) {
        mensaje_web.textContent = "*URL no válida. Ej: marca.com o https://marca.com";
        return;
    }
    mensaje_web.textContent = "";
});
input_web.addEventListener("input", function () {
    const v = this.value.trim();
    if (v === "" || validarWebOpcional(v)) mensaje_web.textContent = "";
});

// Obtener ID por URL
function getPatrocinadorIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    return id ? id : null;
}

// EDITAR PATROCINADORES
const patrocinadorId = getPatrocinadorIdFromUrl();

if (patrocinadorId) {
    const h1 = document.getElementById("titulo");
    if (h1) h1.textContent = "EDITAR PATROCINADOR";

    const btnSubmit = document.getElementById("btn_enviar");
    if (btnSubmit) btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';

    fetch(`../php/editar_patrocinador.php?id=${encodeURIComponent(patrocinadorId)}`)
        .then((r) => r.json())
        .then((data) => {
            const p = data.patrocinador;

            input_nombre.value = p.nombre ?? "";
            input_color.value = p.color_hex ?? "";
            input_web.value = p.web_url ?? "";

            // Imagen existente
            if (p.logo_url) {
                imagen_actual = "../" + p.logo_url;
                input_preview.src = imagen_actual;
                input_preview.style.display = "block";
                uploadBox.classList.add("has-image");
            }
        })
        .catch((err) => {
            console.error("Error cargando patrocinador:", err);
            if (mensaje_formulario) {
                mensaje_formulario.textContent = "Error cargando el patrocinador. Observa la consola.";
            }
        });
}

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

    // Importante: si vuelves a elegir el mismo archivo, algunos navegadores no disparan change
    input_imagen.value = "";
});

// Submit
if (form_patrocinador) {
    form_patrocinador.addEventListener("submit", function (event) {
        event.preventDefault();

        mensaje_formulario.textContent = "";

        const nombre = input_nombre.value.trim();
        const color = input_color.value.trim();
        const web = input_web.value.trim();

        // Validaciones
        let ok = true;

        if (nombre === "") {
            mensaje_nombre.textContent = "*Ingresa el nombre del patrocinador";
            ok = false;
        }

        if (color === "") {
            mensaje_color.textContent = "*El color es obligatorio";
            ok = false;
        } else if (!esHex6(color)) {
            mensaje_color.textContent = "*Debe tener 6 caracteres HEX (sin #). Ej: FFAACC";
            ok = false;
        }

        if (web !== "" && !validarWebOpcional(web)) {
            mensaje_web.textContent = "*URL no válida. Ej: marca.com o https://marca.com";
            ok = false;
        }

        // Imagen:
        // - Crear: obligatoria
        // - Editar: vale con la existente o con una nueva
        if (!patrocinadorId) {
            if (!imagen_seleccionada) {
                mensaje_imagen.textContent = "*La imagen es obligatoria";
                ok = false;
            }
        } else {
            if (!imagen_seleccionada && !imagen_actual) {
                mensaje_imagen.textContent = "*La imagen es obligatoria";
                ok = false;
            }
        }

        if (!ok) {
            mensaje_formulario.textContent = "*Por favor revisa los campos marcados";
            return;
        }

        // Pasamos todo al PHP
        enviarFormulario();
    });
}

// --- Envío al PHP ---
function enviarFormulario() {
    let formData = new FormData();

    // Si tu PHP usa "accion" (crear/editar), esto es lo importante:
    formData.append("nombre", input_nombre.value.trim());
    formData.append("color_hex", input_color.value.trim());
    formData.append("web_url", input_web.value.trim()); // opcional, puede ir vacío

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
                mostrarModal("error", data.message);
            }
        })
        .catch(error => {
            mostrarModal("error", "Error de conexión con el servidor");
            console.error(error);
        });
}
