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
    fetch("../php/mostrar_detalle_candidatura_usuario.php")
        .then(res => res.json())
        .then(candidatura => {
            const tituloCorto = document.getElementById("tituloCortometraje");
            const cartel = document.getElementById("cartel");
            const sinopsis = document.getElementById("sinopsis");
            const video = document.getElementById("video");

            tituloCorto.textContent = candidatura.titulo;
            sinopsis.textContent = candidatura.sinopsis;
        })
        .catch(err => console.error("Error cargando candidaturas:", err));

});