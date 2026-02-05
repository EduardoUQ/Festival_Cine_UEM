document.addEventListener("DOMContentLoaded", () => {
    const hamburger = document.getElementById("hamburger");
    const nav = document.getElementById("nav");

    if (!hamburger || !nav) return; // evita errores si no existe el menú

    hamburger.addEventListener("click", () => {
        nav.classList.toggle("active");
    });
});
