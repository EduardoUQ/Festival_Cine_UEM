document.addEventListener("DOMContentLoaded", () => {
    cargarEventos();

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

        if (modalBtnCancel) {
            modalBtnCancel.addEventListener("click", () => {
                modal.classList.remove("mostrar");
                modalBtnCancel.style.display = "none";
                accionConfirmada = null;
                redireccion = null;
            });
        }

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

    function borrarEvento(id) {
        let formData = new FormData();
        formData.append("funcion", "borrar_evento");
        formData.append("id", id);

        fetch("../php/formulario_evento.php", {
            method: "POST",
            body: formData
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

    const tbody = document.getElementById("tbody_eventos");
    if (!tbody) return;

    tbody.addEventListener("click", function (e) {
        const btn = e.target.closest(".btn-borrar");
        if (!btn) return;

        e.preventDefault();

        const id = btn.getAttribute("data-id");
        if (!id) return;

        mostrarConfirmacion("¿Seguro que quieres borrar este evento?", function(){
            borrarEvento(id);
        });
        if (!confirmar) return;

        //borrarEvento(id);
    });
});

function cargarEventos() {
    const tbody = document.getElementById("tbody_eventos");
    if (!tbody) return;

    let formData = new FormData();
    formData.append("funcion", "listar_eventos");

    fetch("../php/formulario_evento.php", {
        method: "POST",
        body: formData
    })
        .then(function (response) {
            if (!response.ok) {
                throw new Error("Error en la solicitud: " + response.statusText);
            }
            return response.json();
        })
        .then(function (data) {
            if (data.status !== "success") {
                console.log(data);
                tbody.innerHTML = "";
                return;
            }

            const eventos = data.eventos || [];
            tbody.innerHTML = "";

            eventos.forEach(ev => {
                const tr = document.createElement("tr");

                tr.innerHTML = `
                    <td>${ev.titulo}</td>
                    <td>${formatearFecha(ev.fecha)}</td>
                    <td>${ev.hora}</td>
                    <td>${ev.localizacion}</td>
                    <td>
                        <a class="btn" href="#">Ver</a>
                        <a class="btn" href="#">Editar</a>
                        <a class="btn btn-borrar" href="#" data-id="${ev.id}">Borrar</a>
                    </td>
                `;

                tbody.appendChild(tr);
            });
        })
        .catch(function (error) {
            console.error("Error en la solicitud:", error);
        });
}

function formatearFecha(fechaISO) {
    // fechaISO = "YYYY-MM-DD"
    if (!fechaISO) return "";
    const parts = fechaISO.split("-");
    if (parts.length !== 3) return fechaISO;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

