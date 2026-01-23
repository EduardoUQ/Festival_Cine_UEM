// Al cargar la página, cargamos las noticias de la BBDD
document.addEventListener("DOMContentLoaded", () => {
    // Se obtienen las noticias de la consulta
    fetch("../php/mostrar_noticia.php")
        .then(res => res.json())
        .then(noticias => {
            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; // Limpia las filas estáticas

            noticias.forEach(noticia => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                <td>${noticia.titulo}</td>
                <td>${noticia.fecha}</td>
                <td>
                    <i class="fa-solid fa-pen" data-id="${noticia.id}"></i>
                    <i class="fa-solid fa-trash" data-id="${noticia.id}"></i>
                </td>
            `;

                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("Error cargando noticias:", err));

});

// Eventos para los íconos
document.addEventListener("click", (e) => {
    // Evento para EDITAR
    if (e.target.classList.contains("fa-pen")) {
        const id = e.target.dataset.id;
        console.log("Editar noticia:", id);
        // abrirModalEdicion(id);
        window.location.href = `formulario_noticia.html?id=${encodeURIComponent(id)}`;

    }

    // Evento para BORRAR
    if (e.target.classList.contains("fa-trash")) {
        const id = e.target.dataset.id;
        console.log("Borrar noticia:", id);
        confirmarBorrado(id);
    }
});

function abrirModalEdicion(id) {
    // Aquí puedemos hacer un fetch para obtener la noticia por ID
    // y abrir el modal con los datos cargados
    console.log("Abriendo modal para editar noticia", id);
}

function confirmarBorrado(id) {
    if (confirm("¿Seguro que quieres borrar esta noticia?")) {
        fetch(`../php/eliminar_noticia.php?id=${id}`)
            .then(res => res.json())
            .then(data => {
                console.log(data);
                // Recargar tabla o eliminar fila directamente
                location.reload()
            })
            .catch(err => console.error("Error al eliminar:", err));;
    }
}
