document.addEventListener("DOMContentLoaded", function () {

    // Variables del formulario
    const form_eventos = document.getElementById("news-form");
    const input_titulo = document.getElementById("title");
    const input_fecha = document.getElementById("date");

    // Variables de los mensajes de error
    const mensaje_titulo = document.getElementById("mensaje_titulo");
    const mensaje_fecha = document.getElementById("mensaje_fecha");
    const mensaje_formulario = document.getElementById("mensaje_formulario");

    // Límite superior (próxima gala)
    const FECHA_MAXIMA_EVENTO = "2026-12-21";

    // Fecha de hoy en formato YYYY-MM-DD 
    function obtenerHoyLocal() {
        const hoy = new Date();
        const y = hoy.getFullYear();
        const m = String(hoy.getMonth() + 1).padStart(2, "0");
        const d = String(hoy.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    }

    const FECHA_MINIMA_EVENTO = obtenerHoyLocal();

    //Establecemos límites directamente en el input date
    if (input_fecha) {
        input_fecha.min = FECHA_MINIMA_EVENTO;
        input_fecha.max = FECHA_MAXIMA_EVENTO;
    }

    //Creamos un array de las variables que haremos validaciones
    const campos = [
        { input: input_titulo, mensaje: mensaje_titulo, texto: "*Escribe un titulo" },
        { input: input_fecha, mensaje: mensaje_fecha, texto: "*Selecciona una fecha" }
    ];

    // Validación para los campos (vacío)
    campos.forEach(c => {
        c.input.addEventListener("blur", () => {
            if (c.input.value.trim() === "") {
                c.mensaje.textContent = c.texto;
            }
        });

        c.input.addEventListener("input", () => {
            c.mensaje.textContent = "";
            mensaje_formulario.textContent = "";
        });
    });

    // Validación de rango de fechas 
    function validarRangoFecha() {
        const fecha = input_fecha.value.trim();

        if (fecha === "") {
            //el vacío ya lo controla la otra validación 
            return false;
        }

        if (fecha < FECHA_MINIMA_EVENTO) {
            mensaje_fecha.textContent = "*La fecha no puede ser anterior a hoy";
            return false;
        }

        if (fecha > FECHA_MAXIMA_EVENTO) {
            mensaje_fecha.textContent = "*La fecha no puede ser posterior al 21/12/2026";
            return false;
        }

        mensaje_fecha.textContent = "";
        return true;
    }

    if (input_fecha) {
        input_fecha.addEventListener("change", () => {
            mensaje_formulario.textContent = "";
            validarRangoFecha();
        });

        input_fecha.addEventListener("blur", () => {
            validarRangoFecha();
        });
    }

    // Verificamos cuando se envíe
    form_eventos.addEventListener("submit", function (event) {
        event.preventDefault();

        const titulo = input_titulo.value.trim();
        const fecha = input_fecha.value.trim();

        // Validaciones
        if (titulo === "" || fecha === "") {
            mensaje_formulario.textContent = "*Por favor completa todos los campos";
            return;
        }

        //Validación rango de fechas
        if (!validarRangoFecha()) {
            mensaje_formulario.textContent = "*Revisa la fecha del evento";
            return;
        }

        //Llamamos a la función de publicar (de momento sin fetch)
        publicar_evento(titulo, fecha);
    });

    //Función preparada para cuando hagamos evento.php
    function publicar_evento(titulo, fecha) {
        console.log("Publicar evento (pendiente de PHP):", { titulo: titulo, fecha: fecha });
    }

});

