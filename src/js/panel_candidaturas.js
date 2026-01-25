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


    const tbody = document.querySelector("table tbody");

    const btnPendiente = document.getElementById("pendiente");
    const btnAceptada = document.getElementById("aceptada");
    const btnRechazada = document.getElementById("rechazada");
    const btnNominada = document.getElementById("nominada");
    const btnSubsanar = document.getElementById("subsanar");

    let todasLasCandidaturas = [];

    // =========================
    // CARGAR CANDIDATURAS
    // =========================
    fetch("../php/mostrar_candidaturas.php")
        .then(res => res.json())
        .then(data => {
            todasLasCandidaturas = data;
            pintarTabla("PENDIENTE"); // Por defecto
        })
        .catch(err => console.error("Error cargando candidaturas:", err));

    // =========================
    // PINTAR TABLA
    // =========================
    function pintarTabla(estado) {
        tbody.innerHTML = "";

        const filtradas = todasLasCandidaturas.filter(c =>
            c.estado === estado
        );

        if (filtradas.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align:center;">
                        No hay candidaturas en este estado
                    </td>
                </tr>
            `;
            return;
        }

        filtradas.forEach(candidatura => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${candidatura.titulo}</td>
                <td>${candidatura.categoria}</td>
                <td>${candidatura.participante}</td>
                <td class="estado">${candidatura.estado}</td>
                <td>
                    <a class="btn" href="panel_detalle_candidatura.html?id=${encodeURIComponent(candidatura.id)}">
                        Ver candidatura
                    </a>
                </td>
            `;

            tbody.appendChild(tr);
        });
    }

    // =========================
    // MANEJO DE TABS
    // =========================
    function activarTab(tabActivo) {
        document.querySelectorAll(".tab").forEach(tab => {
            tab.classList.remove("active");
        });
        tabActivo.classList.add("active");
    }

    btnPendiente.addEventListener("click", () => {
        activarTab(btnPendiente);
        pintarTabla("PENDIENTE");
    });

    btnAceptada.addEventListener("click", () => {
        activarTab(btnAceptada);
        pintarTabla("ACEPTADA");
    });

    btnRechazada.addEventListener("click", () => {
        activarTab(btnRechazada);
        pintarTabla("RECHAZADA");
    });

    btnNominada.addEventListener("click", () => {
        activarTab(btnNominada);
        pintarTabla("NOMINADA");
    });

    btnSubsanar.addEventListener("click", () => {
        activarTab(btnSubsanar);
        pintarTabla("SUBSANAR");
    });
});

