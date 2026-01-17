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

// Al cargar la página, cargamos las noticias de la BBDD
document.addEventListener("DOMContentLoaded", () => {
    // Se obtienen los patrocinadores de la consulta
    fetch("../php/mostrar_patrocinadores.php")
        .then(res => res.json())
        .then(patrocinadores => {
            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; // Limpia las filas estáticas

            patrocinadores.forEach(patrocinador => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                <td><img src="../${patrocinador.logo_url}"></td>
                <td>${patrocinador.nombre}</td>
                <td>
                    <i class="fa-solid fa-pen" data-id="${patrocinador.id}"></i>
                    <i class="fa-solid fa-trash" data-id="${patrocinador.id}"></i>
                </td>
            `;

                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("Error cargando patrocinadores:", err));

});

// Eventos para los íconos
document.addEventListener("click", (e) => {
    // Evento para EDITAR
    if (e.target.classList.contains("fa-pen")) {
        const id = e.target.dataset.id;
        console.log("Editar patrocinador:", id);
        window.location.href = `formulario_patrocinador.html?id=${encodeURIComponent(id)}`;

    }

    // Evento para BORRAR
    if (e.target.classList.contains("fa-trash")) {
        const id = e.target.dataset.id;
        console.log("Borrar patrocinador:", id);
        confirmarBorrado(id);
    }
});

function confirmarBorrado(id) {
    if (confirm("¿Seguro que quieres borrar este patrocinador?")) {
        const formData = new FormData();
        formData.append("id", id);
        fetch(`../php/eliminar_patrocinador.php`, {
            method: "POST",
            body: formData,
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                // Recargar tabla o eliminar fila directamente
                location.reload()
            })
            .catch(err => console.error("Error al eliminar:", err));;
    }
}
