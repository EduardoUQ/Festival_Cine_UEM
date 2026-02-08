//Botones
const btnPre = document.getElementById("preEventoBtn");
const btnPost = document.getElementById("postEventoBtn");
const btnEdiciones = document.getElementById("edicionesAnterioresBtn");

//Secciones
const preEvento = document.querySelector(".preEvento");
const postEvento = document.querySelector(".postEvento");
const edicionesAnteriores = document.querySelector(".edicionesAnteriores");

//Agrupamos para simplificar
const secciones = [preEvento, postEvento, edicionesAnteriores];
const botones = [btnPre, btnPost, btnEdiciones];

//Función para mostrar solo una sección
function mostrarSeccion(seccionActiva, botonActivo) {
    // Ocultar todas las secciones
    secciones.forEach(sec => sec.hidden = true);

    // Quitar "active" de todos los botones
    botones.forEach(btn => btn.classList.remove("active"));

    // Mostrar la sección seleccionada
    seccionActiva.hidden = false;

    // Activar el botón correspondiente
    botonActivo.classList.add("active");
}

// Eventos
btnPre.addEventListener("click", () => {
    mostrarSeccion(preEvento, btnPre);
});

btnPost.addEventListener("click", () => {
    mostrarSeccion(postEvento, btnPost);
});

btnEdiciones.addEventListener("click", () => {
    mostrarSeccion(edicionesAnteriores, btnEdiciones);
});

// Mostrar por defecto la primera sección
mostrarSeccion(preEvento, btnPre);

// ===========================================
// Activar el modo PRE evento o POST evento
document.getElementById("activarPre").addEventListener("click", () => {
    localStorage.setItem("modoGala", "pre");
    mostrarModal("success", "Modo PRE GALA activado. Ir a la página de eventos y gala para ver los cambios.");
});

document.getElementById("activarPost").addEventListener("click", () => {
    localStorage.setItem("modoGala", "post");
    mostrarModal("success", "Modo POST GALA activado. Ir a la página de eventos y gala para ver los cambios.");
});

// MODAL (igual que calendario)
// =======================
const modal = document.getElementById("modal_mensaje");
const modalIcono = document.getElementById("modal_icono");
const modalTitulo = document.getElementById("modal_titulo");
const modalTexto = document.getElementById("modal_texto");
const modalBtn = document.getElementById("modalBtn");
const modalBtnCancel = document.getElementById("modalBtnCancel");

let accionConfirmada = null;
let redireccion = null;

const modalDisponible =
    modal && modalIcono && modalTitulo && modalTexto && modalBtn;

function mostrarModal(tipo, mensaje, redirect = null) {
    if (!modalDisponible) {
        console.error("Modal no disponible: falta el HTML del modal en panel_premios.html");
        if (redirect) window.location.href = redirect;
        return;
    }

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
    accionConfirmada = null;

    if (modalBtnCancel) modalBtnCancel.style.display = "none";
}

function mostrarConfirmacion(mensajeConfirmacion, onConfirm) {
    if (!modalDisponible) {
        console.error("Modal no disponible para confirmación.");
        return;
    }

    modal.className = "modal mostrar";
    modalIcono.className = "fa-solid";
    modal.classList.remove("modal_exito", "modal_error");

    modal.classList.add("modal_error");
    modalIcono.classList.add("fa-triangle-exclamation");
    modalTitulo.textContent = "Confirmación";
    modalTexto.textContent = mensajeConfirmacion;

    redireccion = null;
    accionConfirmada = onConfirm;

    if (modalBtnCancel) modalBtnCancel.style.display = "inline-block";
}

if (modalDisponible) {
    modalBtn.addEventListener("click", () => {
        modal.classList.remove("mostrar");

        // Si venimos de una confirmación, ejecutamos la acción
        if (accionConfirmada) {
            const fn = accionConfirmada;
            accionConfirmada = null;
            fn();
            return;
        }

        // Si venimos de un mensaje normal con redirección
        if (redireccion) {
            window.location.href = redireccion;
        }
    });

    if (modalBtnCancel) {
        modalBtnCancel.addEventListener("click", () => {
            modal.classList.remove("mostrar");
            modalBtnCancel.style.display = "none";
            accionConfirmada = null;
            redireccion = null;
        });
    }
}