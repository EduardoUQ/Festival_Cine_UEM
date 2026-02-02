document.addEventListener("DOMContentLoaded", () => {
    const cont = document.getElementById("auth_actions");
    if (!cont) return;

    fetch("../php/session_info.php", { method: "GET" })
        .then(r => r.json())
        .then(data => {
            if (data.logged === true) {
                cont.innerHTML = `
                    <i class="fa-solid fa-user" id="btn_user_panel" style="cursor:pointer;"></i>
                    <i class="fa-solid fa-right-from-bracket" id="btn_logout" style="cursor:pointer;"></i>
                `;

                const btnUser = document.getElementById("btn_user_panel");
                const btnLogout = document.getElementById("btn_logout");

                btnUser.addEventListener("click", () => {
                    if (data.rol === "admin") {
                        window.location.href = "panel_administrador.html"; 
                    } else {
                        window.location.href = "panel_candidaturas.html";
                    }
                });

                btnLogout.addEventListener("click", () => {
                    fetch("../php/logout.php", { method: "GET" })
                        .then(() => {
                            window.location.href = "index.html";
                        })
                        .catch(() => {
                            window.location.href = "index.html";
                        });
                });

            } else {
                //No logueado: dejamos el botón Ingresar
            }
        })
        .catch(() => {
            //si falla session_info, no rompemos nada
        });
});
