document.addEventListener("DOMContentLoaded", () => {

    //FORM
    const form = document.getElementById("news-form");

    //INPUTS
    const inputAnio = document.getElementById("anio");
    const inputDescripcion = document.getElementById("descripcion");
    const inputFechaEvento = document.getElementById("fecha_evento");

    const inputLugarNombre = document.getElementById("lugar_nombre");
    const inputLugarSubtitulo = document.getElementById("lugar_subtitulo");
    const inputDireccion = document.getElementById("direccion");
    const inputCapacidad = document.getElementById("capacidad");
    const inputEstacionamiento = document.getElementById("estacionamiento");

    const inputImage = document.getElementById("image");
    const selectActiva = document.getElementById("activa");

    //MENSAJES
    const mensajeFormulario = document.getElementById("mensaje_formulario");
    const mensajeAnio = document.getElementById("mensaje_anio");
    const mensajeDescripcion = document.getElementById("mensaje_descripcion");
    const mensajeFechaEvento = document.getElementById("mensaje_fecha_evento");
    const mensajeLugarNombre = document.getElementById("mensaje_lugar_nombre");

    //MODAL
    const modal = document.getElementById("modal_mensaje");
    const modalIcono = document.getElementById("modal_icono");
    const modalTitulo = document.getElementById("modal_titulo");
    const modalTexto = document.getElementById("modal_texto");
    const modalBtn = document.getElementById("modalBtn");

    let idGala = null;

    function mostrarModal(tipo, mensaje) {
        modal.className = "modal mostrar";
        modalIcono.className = "fa-solid";

        if (tipo === "success") {
            modalIcono.classList.add("fa-circle-check");
            modalTitulo.textContent = "Operación correcta";
        } else {
            modalIcono.classList.add("fa-circle-xmark");
            modalTitulo.textContent = "Error";
        }

        modalTexto.textContent = mensaje;
    }

    modalBtn.addEventListener("click", () => {
        modal.classList.remove("mostrar");
    });

    function limpiarMensajes() {
        if (mensajeFormulario) mensajeFormulario.textContent = "";
        if (mensajeAnio) mensajeAnio.textContent = "";
        if (mensajeDescripcion) mensajeDescripcion.textContent = "";
        if (mensajeFechaEvento) mensajeFechaEvento.textContent = "";
        if (mensajeLugarNombre) mensajeLugarNombre.textContent = "";
    }

    //CARGAR GALA ACTIVA Y PINTAR EN EL FORM 
    function cargarGalaActiva() {
        let formData = new FormData();
        formData.append("funcion", "obtener_gala_activa");

        fetch("../php/formulario_gala.php", {
            method: "POST",
            body: formData
        })
            .then(r => r.json())
            .then(data => {
                if (data.status !== "success" || !data.gala) return;

                const g = data.gala;
                idGala = g.id;

                inputAnio.value = g.anio || "";
                inputDescripcion.value = g.descripcion || "";
                inputFechaEvento.value = g.fecha_evento || "";

                inputLugarNombre.value = g.lugar_nombre || "";
                inputLugarSubtitulo.value = g.lugar_subtitulo || "";
                inputDireccion.value = g.direccion || "";
                inputCapacidad.value = (g.capacidad !== null && g.capacidad !== undefined) ? g.capacidad : "";
                inputEstacionamiento.value = g.estacionamiento || "";

                selectActiva.value = (g.activa == 1) ? "1" : "0";
            })
            .catch(() => {
                // no bloqueamos el panel, solo no se precarga
            });
    }

    cargarGalaActiva();

    //VALIDACIÓN SIMPLE (solo vacío)
    const campos = [
        { input: inputAnio, mensaje: mensajeAnio, texto: "*Escribe el año" },
        { input: inputDescripcion, mensaje: mensajeDescripcion, texto: "*Escribe la descripción" },
        { input: inputFechaEvento, mensaje: mensajeFechaEvento, texto: "*Selecciona la fecha del evento" },
        { input: inputLugarNombre, mensaje: mensajeLugarNombre, texto: "*Escribe el lugar" }
    ];

    campos.forEach(c => {
        c.input.addEventListener("blur", () => {
            if (c.input.value.trim() === "") {
                c.mensaje.textContent = c.texto;
                c.mensaje.style.color = "#A71D2D";
            }
        });

        c.input.addEventListener("input", () => {
            c.mensaje.textContent = "";
            if (mensajeFormulario) mensajeFormulario.textContent = "";
        });
    });

    // SUBMIT
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            limpiarMensajes();

            const anio = inputAnio.value.trim();
            const descripcion = inputDescripcion.value.trim();
            const fecha_evento = inputFechaEvento.value;
            const lugar_nombre = inputLugarNombre.value.trim();

            //Validación mínima (solo vacío)
            let hayError = false;

            if (!anio) { mensajeAnio.textContent = "*Escribe el año"; mensajeAnio.style.color = "#A71D2D"; hayError = true; }
            if (!descripcion) { mensajeDescripcion.textContent = "*Escribe la descripción"; mensajeDescripcion.style.color = "#A71D2D"; hayError = true; }
            if (!fecha_evento) { mensajeFechaEvento.textContent = "*Selecciona la fecha del evento"; mensajeFechaEvento.style.color = "#A71D2D"; hayError = true; }
            if (!lugar_nombre) { mensajeLugarNombre.textContent = "*Escribe el lugar"; mensajeLugarNombre.style.color = "#A71D2D"; hayError = true; }

            if (hayError) {
                if (mensajeFormulario) {
                    mensajeFormulario.textContent = "Por favor completa los campos obligatorios";
                    mensajeFormulario.style.color = "#A71D2D";
                }
                return;
            }

            let formData = new FormData();

            if (idGala) {
                formData.append("funcion", "actualizar_gala");
                formData.append("id", idGala);
            } else {
                formData.append("funcion", "crear_gala");
            }

            formData.append("anio", anio);
            formData.append("descripcion", descripcion);
            formData.append("fecha_evento", fecha_evento);

            formData.append("lugar_nombre", lugar_nombre);
            formData.append("lugar_subtitulo", inputLugarSubtitulo.value.trim());
            formData.append("direccion", inputDireccion.value.trim());
            formData.append("capacidad", inputCapacidad.value.trim());
            formData.append("estacionamiento", inputEstacionamiento.value.trim());

            formData.append("activa", selectActiva.value);

            // Imagen opcional
            if (inputImage && inputImage.files && inputImage.files[0]) {
                formData.append("image", inputImage.files[0]);
            }

            fetch("../php/formulario_gala.php", {
                method: "POST",
                body: formData
            })
                .then(r => r.json())
                .then(data => {
                    if (data.status === "success") {
                        mostrarModal("success", data.message || "Guardado correctamente");
                        // recargamos datos para fijar idGala si era creación
                        cargarGalaActiva();
                    } else {
                        mostrarModal("error", data.message || "No se pudo guardar");
                    }
                })
                .catch(() => {
                    mostrarModal("error", "Error de conexión con el servidor");
                });
        });
    }

});
