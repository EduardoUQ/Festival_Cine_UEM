document.addEventListener("DOMContentLoaded", () => {
    const tabs = document.querySelectorAll(".tab");
    const filas = document.querySelectorAll("tbody tr");

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            // 1. Activar pestaña seleccionada
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // 2. Obtener estado a filtrar (id del botón)
            const estadoSeleccionado = tab.id; // pendiente, aceptadas, rechazadas

            // 3. Filtrar filas
            filas.forEach(fila => {
                const estado = fila.querySelector(".estado").classList[1];
                // classList[1] será pendiente / aceptada / rechazada

                if (estado === estadoSeleccionado) {
                    fila.style.display = "";
                } else {
                    fila.style.display = "none";
                }
            });
        });
    });
});
