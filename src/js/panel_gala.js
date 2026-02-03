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
    // window.location.href = "premios_galas.html"; // Ir a la otra página
});

document.getElementById("activarPost").addEventListener("click", () => {
    localStorage.setItem("modoGala", "post");
    // window.location.href = "premios_galas.html";
});
