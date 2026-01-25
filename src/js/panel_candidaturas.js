document.addEventListener("DOMContentLoaded", () => {

    // 1) Cargar los datos del usuario
    fetch("../php/session_info.php")
        .then((response) => response.json())
        .then((info) => {
            if (!info.logged || info.rol !== "admin") {
                window.location.href = "../html/login.html";
                return;
            }

            // Cargamos el nombre del usuario en el panel
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

    // Ordenar cómo aparee en la tabla
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

    // Cargamos todas las candidaturas
    fetch("../php/mostrar_candidaturas.php")
        .then(res => res.json())
        .then(candidaturas => {
            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; // Limpia las filas estáticas

            candidaturas.forEach(candidatura => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                <td>${candidatura.titulo}</td>
                <td>${candidatura.categoria}</td>
                <td>${candidatura.participante}</td>
                <td>${candidatura.estado}</td>
                <td>
                <a class="btn" href="panel_detalle_candidatura.html?id=${encodeURIComponent(candidatura.id)}">Ver candidatura</a>
                </td>
            `;

                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("Error cargando candidaturas:", err));
});

