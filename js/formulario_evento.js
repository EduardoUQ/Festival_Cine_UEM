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
const form_eventos = document.getElementById("news-form");
const input_titulo = document.getElementById("title");
const input_fecha = document.getElementById("date");

// Variables de los mensajes de error
const mensaje_titulo = document.getElementById("mensaje_titulo");
const mensaje_fecha = document.getElementById("mensaje_fecha");
const mensaje_formulario = document.getElementById("mensaje_formulario");

// Límite superior (próxima gala)
const FECHA_MAXIMA_EVENTO = "2026-12-21";

// Fecha de hoy en formato YYYY-MM-DD 
function obtenerHoyLocal() {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, "0");
    const d = String(hoy.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

const FECHA_MINIMA_EVENTO = obtenerHoyLocal();

//Establecemos límites directamente en el input date
if (input_fecha) {
    input_fecha.min = FECHA_MINIMA_EVENTO;
    input_fecha.max = FECHA_MAXIMA_EVENTO;
}

//Creamos un array de las variables que haremos validaciones
const campos = [
    { input: input_titulo, mensaje: mensaje_titulo, texto: "*Escribe un titulo" },
    { input: input_fecha, mensaje: mensaje_fecha, texto: "*Selecciona una fecha" }
];

// Validación para los campos (vacío)
campos.forEach(c => {
    c.input.addEventListener("blur", () => {
        if (c.input.value.trim() === "") {
            c.mensaje.textContent = c.texto;
        }
    });

    c.input.addEventListener("input", () => {
        c.mensaje.textContent = "";
        mensaje_formulario.textContent = "";
    });
});

// Validación de rango de fechas 
function validarRangoFecha() {
    const fecha = input_fecha.value.trim();

    if (fecha === "") {
        //el vacío ya lo controla la otra validación 
        return false;
    }

    if (fecha < FECHA_MINIMA_EVENTO) {
        mensaje_fecha.textContent = "*La fecha no puede ser anterior a hoy";
        return false;
    }

    if (fecha > FECHA_MAXIMA_EVENTO) {
        mensaje_fecha.textContent = "*La fecha no puede ser posterior al 21/12/2026";
        return false;
    }

    mensaje_fecha.textContent = "";
    return true;
}

if (input_fecha) {
    input_fecha.addEventListener("change", () => {
        mensaje_formulario.textContent = "";
        validarRangoFecha();
    });

    input_fecha.addEventListener("blur", () => {
        validarRangoFecha();
    });
}

// Verificamos cuando se envíe
form_eventos.addEventListener("submit", function (event) {
    event.preventDefault();

    const titulo = input_titulo.value.trim();
    const fecha = input_fecha.value.trim();

    // Validaciones
    if (titulo === "" || fecha === "") {
        mensaje_formulario.textContent = "*Por favor completa todos los campos";
        return;
    }

    //Validación rango de fechas
    if (!validarRangoFecha()) {
        mensaje_formulario.textContent = "*Revisa la fecha del evento";
        return;
    }

    //Llamamos a la función de publicar (de momento sin fetch)
    publicar_evento(titulo, fecha);
});

//Función preparada para cuando hagamos evento.php
function publicar_evento(titulo, fecha) {
    console.log("Publicar evento (pendiente de PHP):", { titulo: titulo, fecha: fecha });
}


// --- Envío al PHP ---
function publicar_evento(titulo, fecha) {
    let formData = new FormData();
    formData.append("funcion", "publicar_evento");
    formData.append("titulo", titulo);
    formData.append("fecha", fecha);

    fetch("../php/evento.php", {
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
                    "../html/panel_calendario.html"
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
