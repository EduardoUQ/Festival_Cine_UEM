document.addEventListener("DOMContentLoaded", () => {
  fetch("../php/session_info.php")
    .then((response) => response.json())
    .then((info) => {
      if (!info.logged || info.rol !== "admin") {
        window.location.href = "../html/login.html";
        return;
      }

      //Para poner el nombre
      const elNombre = document.getElementById("user_nombre");
      if (elNombre) {
        elNombre.textContent = info.nombre;
      }

      // Futuro botón logout
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

      //Validaciones/listeners del formulario
      iniciarFormularioPremio();
    })
    .catch((error) => {
      console.error("No se pudo comprobar la sesión:", error);
      window.location.href = "../html/login.html";
    });
});

function iniciarFormularioPremio() {
  const form = document.getElementById("formulario-premio");
  if (!form) return;

  //Inputs
  const campoCategoria = document.getElementById("categoria");
  const campoPuesto = document.getElementById("puesto");
  const campoDescripcion = document.getElementById("descripcion");
  const campoDotacion = document.getElementById("dotacion");
  const campoActiva = document.getElementById("activa");

  // Mensajes validaciones
  const msgCategoria = document.getElementById("mensaje_categoria");
  const msgPuesto = document.getElementById("mensaje_puesto");
  const msgDescripcion = document.getElementById("mensaje_descripcion");
  const msgDotacion = document.getElementById("mensaje_dotacion");
  const msgActiva = document.getElementById("mensaje_activa");
  const msgFormulario = document.getElementById("mensaje_formulario");

  //Función para limpiar mensajes
  function limpiarMensajes() {
    if (msgCategoria) msgCategoria.textContent = "";
    if (msgPuesto) msgPuesto.textContent = "";
    if (msgDescripcion) msgDescripcion.textContent = "";
    if (msgDotacion) msgDotacion.textContent = "";
    if (msgActiva) msgActiva.textContent = "";
    if (msgFormulario) msgFormulario.textContent = "";
  }

  //Función para validacion de campo vacío en blur
  function validarCampoVacio(campo, mensaje, elMsg) {
    if (!campo) return true;

    if (campo.value.trim() === "") {
      campo.classList.add("error"); //CSS para borde rojo
      campo.setCustomValidity(mensaje);
      if (elMsg) elMsg.textContent = mensaje;
      return false;
    } else {
      campo.classList.remove("error");
      campo.setCustomValidity("");
      if (elMsg) elMsg.textContent = "";
      return true;
    }
  }

  // Validaciones específicas
  function validarCategoria() {
    return validarCampoVacio(
      campoCategoria,
      "*Debes indicar una categoría",
      msgCategoria
    );
  }

  function validarPuesto() {
    if (!campoPuesto) return true;

    // vacío
    if (!validarCampoVacio(campoPuesto, "*Debes indicar un puesto", msgPuesto)) {
      return false;
    }

    const valor = parseInt(campoPuesto.value, 10);
    if (Number.isNaN(valor) || valor < 0) {
      const m = "El puesto debe ser un número 0 o mayor";
      campoPuesto.classList.add("error");
      campoPuesto.setCustomValidity(m);
      if (msgPuesto) msgPuesto.textContent = m;
      return false;
    }

    campoPuesto.classList.remove("error");
    campoPuesto.setCustomValidity("");
    if (msgPuesto) msgPuesto.textContent = "";
    return true;
  }

  function validarDescripcion() {
    return validarCampoVacio(
      campoDescripcion,
      "*Debes indicar una descripción",
      msgDescripcion
    );
  }

  function validarDotacion() {
    if (!campoDotacion) return true;

    const v = campoDotacion.value.trim();
    if (v === "") {
      // dotación es NULL/optional en BD
      campoDotacion.classList.remove("error");
      campoDotacion.setCustomValidity("");
      if (msgDotacion) msgDotacion.textContent = "";
      return true;
    }

    const valor = Number(v);
    if (Number.isNaN(valor) || valor < 0) {
      const m = "La dotación debe ser un número igual o mayor que 0";
      campoDotacion.classList.add("error");
      campoDotacion.setCustomValidity(m);
      if (msgDotacion) msgDotacion.textContent = m;
      return false;
    }

    campoDotacion.classList.remove("error");
    campoDotacion.setCustomValidity("");
    if (msgDotacion) msgDotacion.textContent = "";
    return true;
  }

  function validarActiva() {
    if (!campoActiva) return true;

    // es required en HTML, pero por si acaso:
    const v = campoActiva.value;
    if (v !== "0" && v !== "1") {
      const m = "Debes seleccionar un estado válido";
      campoActiva.classList.add("error");
      campoActiva.setCustomValidity(m);
      if (msgActiva) msgActiva.textContent = m;
      return false;
    }

    campoActiva.classList.remove("error");
    campoActiva.setCustomValidity("");
    if (msgActiva) msgActiva.textContent = "";
    return true;
  }

  // Listeners blur 
  if (campoCategoria) campoCategoria.addEventListener("blur", validarCategoria);
  if (campoPuesto) campoPuesto.addEventListener("blur", validarPuesto);
  if (campoDescripcion) campoDescripcion.addEventListener("blur", validarDescripcion);
  if (campoDotacion) campoDotacion.addEventListener("blur", validarDotacion);
  if (campoActiva) campoActiva.addEventListener("blur", validarActiva);

  // Submit 
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    limpiarMensajes();

    // Validaciones
    const ok =
      validarCategoria() &
      validarPuesto() &
      validarDescripcion() &
      validarDotacion() &
      validarActiva();

    if (!ok) {
      if (msgFormulario) msgFormulario.textContent = "Revisa los campos marcados.";
      return;
    }

    // Datos
    const categoria = campoCategoria.value.trim();
    const puesto = parseInt(campoPuesto.value, 10);
    const descripcion = campoDescripcion.value.trim();

    // dotacion puede ser "" => enviamos vacío y el servidor lo tratará como NULL
    const dotacion = campoDotacion.value.trim();
    const activa = campoActiva.value; // "0" o "1"

    // FormData
    const formData = new FormData();
    formData.append("funcion", "crearPremio");
    formData.append("categoria", categoria);
    formData.append("puesto", String(puesto)); 
    formData.append("descripcion", descripcion);
    formData.append("dotacion", dotacion); // "" o "123.45"
    formData.append("activa", activa);

    // Debug para ver en consola el JSON
    for (const [k, v] of formData.entries()) {
      console.log(`${k}: ${v}`);
    }

    // Fetch al back
    fetch("../php/formulario_premio.php", {
      method: "POST",
      body: formData,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Premio creado con éxito");
          form.reset();
        } else {
          const m = data.message || "Error al crear el premio";
          if (msgFormulario) msgFormulario.textContent = m;
          console.error("Respuesta servidor:", data);
        }
      })
      .catch((error) => {
        console.error("Error en el fetch de premio.php", error);
        if (msgFormulario) {
          msgFormulario.textContent =
            "Error de comunicación con el servidor. Observa la consola.";
        }
      });
  });
}
