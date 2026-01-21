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
        mostrarConfirmacion("¿Seguro que quieres borrar este evento?", function () {
            confirmarBorrado(id);
        });
        if (!confirmar) return;

    }
});

// MODALES
// FUNCIÓN DEL MODAL
const modal = document.getElementById("modal_mensaje");
const modalIcono = document.getElementById("modal_icono");
const modalTitulo = document.getElementById("modal_titulo");
const modalTexto = document.getElementById("modal_texto");
const modalBtn = document.getElementById("modalBtn");
const modalBtnCancel = document.getElementById("modalBtnCancel");

let accionConfirmada = null;
let redireccion = null;

function mostrarModal(tipo, mensaje, redirect = null) {
    modal.className = "modal mostrar";

    modalIcono.className = "fa-solid";
    modal.classList.remove("modal_exito", "modal_error");

    if (tipo === "success") {
        modal.classList.add("modal_exito");
        modalIcono.classList.add("fa-circle-check");
        modalTitulo.textContent = "Operación correcta";
    } else {
        modal.classList.add("modal_error");
        modalIcono.classList.add("fa-circle-xmark");
        modalTitulo.textContent = "Error";
    }

    modalTexto.textContent = mensaje;
    redireccion = redirect;
    accionConfirmada = null;
}

modalBtn.addEventListener("click", () => {
    modal.classList.remove("mostrar");


    //Si venimos de una confirmación, ejecutamos la acción
    if (accionConfirmada) {
        const fn = accionConfirmada;
        accionConfirmada = null;
        fn();
        return;
    }

    //Si venimos de un mensaje normal con redirección
    if (redireccion) {
        window.location.href = redireccion;
    }
});

if (modalBtnCancel) {
    modalBtnCancel.addEventListener("click", () => {
        modal.classList.remove("mostrar");
        modalBtnCancel.style.display = "none";
        accionConfirmada = null;
        redireccion = null;
    });
}

function mostrarConfirmacion(mensajeConfirmacion, onConfirm) {
    modal.className = "modal mostrar";
    modalIcono.className = "fa-solid";
    modal.classList.remove("modal_exito", "modal_error");

    modal.classList.add("modal_error");
    modalIcono.classList.add("fa-triangle-exclamation");
    modalTitulo.textContent = "Confirmación";
    modalTexto.textContent = mensajeConfirmacion;

    redireccion = null;
    accionConfirmada = onConfirm;

    if (modalBtnCancel) modalBtnCancel.style.display = "inline-block";
}


function confirmarBorrado(id) {
    const formData = new FormData();
    formData.append("id", id);
    fetch(`../php/eliminar_patrocinador.php`, {
        method: "POST",
        body: formData,
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Error en la solicitud: " + response.statusText);
            }
            return response.json();
        })
        .then(function (data) {
            console.log(data);

            if (data.status === "success") {
                mostrarModal("success", data.message);
                cargarEventos();
            } else {
                //podemos hacerlo con el mismo modal de formulario evento
                //alert(data.message);
                mostrarModal("error", data.message);
            }
        })
        .catch(function (error) {
            console.error("Error en la solicitud:", error);
        });

}
