document.addEventListener("DOMContentLoaded", () => {
    // 1) Cargar los datos del usuario
    fetch("../php/session_info.php")
        .then((response) => response.json())
        .then((info) => {
            if (!info.logged || info.rol !== "usuario") {
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


    // Cargamos sus candidaturas del usuario
    fetch("../php/mostrar_candidatura_usuario.php")
        .then(res => res.json())
        .then(candidaturas => {
            const tbody = document.querySelector("table tbody");
            tbody.innerHTML = ""; // Limpia las filas estáticas

            candidaturas.forEach(candidatura => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                <td>${candidatura.titulo}</td>
                <td>${candidatura.categoria}</td>
                <td>${candidatura.estado}</td>
                <td>
                <a class="btn" href="panel_usuario_detalle_candidatura.html?id=${encodeURIComponent(candidatura.id)}">Ver candidatura</a>
                </td>
            `;

                tbody.appendChild(tr);
            });
        })
        .catch(err => console.error("Error cargando candidaturas:", err));

});

