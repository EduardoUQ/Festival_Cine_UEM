document.addEventListener("DOMContentLoaded", () => {
  // ====== ELEMENTOS ======
  const form = document.getElementById("formUpload");

  const nombre = document.getElementById("nombre_apellidos");
  const dni = document.getElementById("dni");
  const expediente = document.getElementById("num_expediente");
  const email = document.getElementById("email");
  const pass = document.getElementById("pass");
  const pass2 = document.getElementById("pass2");

  const selAnio = document.getElementById("anio_graduacion");
  const grupoCatManual = document.getElementById("grupo_categoria_manual");
  const selCatManual = document.getElementById("categoria_manual");

  const titulo = document.getElementById("titulo");
  const sinopsis = document.getElementById("sinopsis");
  const counterSinopsis = document.getElementById("counterSinopsis");

  const cartel = document.getElementById("cartel");
  const corto = document.getElementById("corto");
  const videoInfo = document.getElementById("videoInfo");

  const btnCancelar = document.getElementById("btnCancelar");

  // Modal
  const modal = document.getElementById("modal_mensaje");
  const modalIcono = document.getElementById("modal_icono");
  const modalTitulo = document.getElementById("modal_titulo");
  const modalTexto = document.getElementById("modal_texto");
  const modalBtn = document.getElementById("modalBtn");
  const modalBtnCancel = document.getElementById("modalBtnCancel");

  // ====== MODAL ======
  function abrirModal(tipo, tituloTxt, textoTxt, onAceptar) {
    // limpiar clases de color
    modalIcono.classList.remove("modal-ok", "modal-error", "modal-warn");

    modalIcono.className = "fa-solid";
    if (tipo === "ok") {
      modalIcono.classList.add("fa-circle-check", "modal-ok");
    } else if (tipo === "warn") {
      modalIcono.classList.add("fa-triangle-exclamation", "modal-warn");
    } else {
      modalIcono.classList.add("fa-circle-xmark", "modal-error");
    }

    modalTitulo.textContent = tituloTxt;
    modalTexto.textContent = textoTxt;

    modalBtnCancel.style.display = "none";
    modal.style.display = "flex";

    modalBtn.onclick = () => {
      modal.style.display = "none";
      if (typeof onAceptar === "function") onAceptar();
    };
  }

  // ====== MENSAJES BAJO INPUT ======
  function ponerMensajeError(el, msg) {
    let cont = el.closest(".form-group");
    if (!cont) return;

    let small = cont.querySelector('small[data-error-for="' + el.id + '"]');
    if (!small) {
      small = document.createElement("small");
      small.className = "error-text";
      small.setAttribute("data-error-for", el.id);
      cont.appendChild(small);
    }

    if (msg) {
      small.textContent = "* " + msg;
      small.style.display = "block";
      el.style.borderColor = "#FF3228";
    } else {
      small.textContent = "";
      small.style.display = "none";
      el.style.borderColor = "transparent";
    }
  }

  function hayErroresEnPantalla() {
    let ok = false;
    document.querySelectorAll("small.error-text").forEach((s) => {
      if (s.style.display !== "none" && s.textContent.trim() !== "") ok = true;
    });
    return ok;
  }

  // ====== SELECT AÑO GRADUACIÓN (dinámico) ======
  const anioActual = new Date().getFullYear();

  // Poblar select año
  selAnio.innerHTML = "";

  let opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "Selecciona una opción";
  selAnio.appendChild(opt0);

  for (let y = anioActual - 5; y <= anioActual - 1; y++) {
    let opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    selAnio.appendChild(opt);
  }

  let optCurso = document.createElement("option");
  optCurso.value = "CURSO";
  optCurso.textContent = "Me gradúo este curso";
  selAnio.appendChild(optCurso);

  let optFuturo = document.createElement("option");
  optFuturo.value = "FUTURO";
  optFuturo.textContent = "Aún no me gradúo (más de un curso)";
  selAnio.appendChild(optFuturo);

  // Poblar select manual categoría
  selCatManual.innerHTML = "";
  let m0 = document.createElement("option");
  m0.value = "";
  m0.textContent = "Selecciona";
  selCatManual.appendChild(m0);

  let m1 = document.createElement("option");
  m1.value = "ALUMNO";
  m1.textContent = "Alumno";
  selCatManual.appendChild(m1);

  let m2 = document.createElement("option");
  m2.value = "ALUMNI";
  m2.textContent = "Alumni";
  selCatManual.appendChild(m2);

  function refrescarCategoriaManual() {
    const v = selAnio.value;

    // Si selecciona anioActual-1 => mostrar selector manual
    if (v !== "" && !isNaN(Number(v)) && Number(v) === anioActual - 1) {
      grupoCatManual.style.display = "block";
    } else {
      grupoCatManual.style.display = "none";
      selCatManual.value = "";
      ponerMensajeError(selCatManual, "");
    }
  }

  selAnio.addEventListener("change", () => {
    refrescarCategoriaManual();
    // no bloqueamos, solo mensaje en blur o en submit
  });

  // ====== CONTADOR SINOPSIS ======
  function pintarCounter() {
    counterSinopsis.textContent = `${sinopsis.value.length} / 500`;
  }
  sinopsis.addEventListener("input", pintarCounter);
  pintarCounter();

  // ====== VALIDACIONES EN BLUR ======
  nombre.addEventListener("blur", () => {
    if (nombre.value.trim().length < 3)
      ponerMensajeError(
        nombre,
        "Introduce nombre y apellidos (mínimo 3 caracteres)",
      );
    else ponerMensajeError(nombre, "");
  });

  dni.addEventListener("blur", () => {
    const v = dni.value.trim().toUpperCase();
    if (v.length < 9 || v.length > 9)
      ponerMensajeError(dni, "DNI/NIE inválido");
    else ponerMensajeError(dni, "");
  });

  expediente.addEventListener("blur", () => {
    const v = expediente.value.trim();
    const expRegex = /^[A-Za-z0-9]{8}$/; 

    if (!expRegex.test(v))
      ponerMensajeError(
        expediente,
        "Expediente inválido. Debe tener 8 dígitos.",
      );
    else ponerMensajeError(expediente, "");
  });

  email.addEventListener("blur", () => {
    if (!email.value.trim())
      ponerMensajeError(email, "El email es obligatorio");
    else ponerMensajeError(email, "");
  });

  pass.addEventListener("blur", () => {
    if (pass.value.length < 4)
      ponerMensajeError(pass, "Contraseña demasiado corta (mín. 4)");
    else ponerMensajeError(pass, "");
  });

  // Confirmar contraseña
  pass2.addEventListener("blur", () => {
    if (!pass2.value) {
      ponerMensajeError(pass2, "Confirma la contraseña");
    } else if (pass.value !== pass2.value) {
      ponerMensajeError(pass2, "Las contraseñas no coinciden");
    } else {
      ponerMensajeError(pass2, "");
    }
  });

  selAnio.addEventListener("blur", () => {
    if (!selAnio.value)
      ponerMensajeError(selAnio, "Selecciona tu año de graduación");
    else ponerMensajeError(selAnio, "");
    refrescarCategoriaManual();
  });

  selCatManual.addEventListener("blur", () => {
    const v = selAnio.value;
    if (v !== "" && !isNaN(Number(v)) && Number(v) === anioActual - 1) {
      if (!selCatManual.value)
        ponerMensajeError(selCatManual, "Selecciona Alumno o Alumni");
      else ponerMensajeError(selCatManual, "");
    } else {
      ponerMensajeError(selCatManual, "");
    }
  });

  titulo.addEventListener("blur", () => {
    if (titulo.value.trim().length < 2)
      ponerMensajeError(titulo, "El título es obligatorio");
    else ponerMensajeError(titulo, "");
  });

  sinopsis.addEventListener("blur", () => {
    if (sinopsis.value.trim().length === 0)
      ponerMensajeError(sinopsis, "La sinopsis es obligatoria");
    else ponerMensajeError(sinopsis, "");
  });

  // ====== ARCHIVOS (validación en change; blur en file no funcaba bien) ======
  cartel.addEventListener("change", () => {
    if (!cartel.files || !cartel.files[0]) {
      ponerMensajeError(cartel, "El cartel es obligatorio");
      return;
    }

    const f = cartel.files[0];
    const okType = f.type === "image/jpeg" || f.type === "image/png";
    const okSize = f.size <= 2 * 1024 * 1024;

    if (!okType) ponerMensajeError(cartel, "Formato inválido. Solo JPG o PNG");
    else if (!okSize) ponerMensajeError(cartel, "El cartel supera 2MB");
    else ponerMensajeError(cartel, "");
  });

  corto.addEventListener("change", () => {
    videoInfo.textContent = "";

    if (!corto.files || !corto.files[0]) {
      ponerMensajeError(corto, "El vídeo es obligatorio");
      return;
    }
    //formato quicktime, no mov.
    const f = corto.files[0];
    const okType = f.type === "video/mp4" || f.type === "video/quicktime";
    if (!okType) {
      ponerMensajeError(corto, "Formato inválido. Solo MP4 o MOV (QuickTime)");
      return;
    }

    // límite lógico A AJUSTAR: 2GB
    const maxBytes = 2 * 1024 * 1024 * 1024;
    if (f.size > maxBytes) {
      ponerMensajeError(corto, "El vídeo es demasiado grande (máx. 2GB)");
      return;
    }

    ponerMensajeError(corto, "");

    // Intento de lectura de resolución (si se puede)
    const url = URL.createObjectURL(f);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.src = url;

    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const w = v.videoWidth;
      const h = v.videoHeight;

      if (w && h) {
        videoInfo.textContent = `Resolución detectada: ${w}×${h}`;
        // AHORA MISMO NO OBLIGATORIO, descomentar para hacerlo obligatorio:
        // if (!(w === 1920 && h === 1080)) ponerMensajeError(corto, "Resolución no válida: debe ser 1920×1080");
      }
    };

    v.onerror = () => {
      URL.revokeObjectURL(url);
      videoInfo.textContent =
        "No se pudo leer la resolución del vídeo en este navegador.";
    };
  });

  // ====== CANCELAR ======
  btnCancelar.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // ====== SUBMIT ======
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // Forzamos validación (repitiendo condiciones, sin bloquear el foco)
    if (nombre.value.trim().length < 3)
      ponerMensajeError(
        nombre,
        "Introduce nombre y apellidos (mínimo 3 caracteres)",
      );
    else ponerMensajeError(nombre, "");

    const vDni = dni.value.trim().toUpperCase();
    if (vDni.length !== 9)
      ponerMensajeError(dni, "DNI/NIE inválido");
    else ponerMensajeError(dni, "");

    if (expediente.value.trim().length !== 8)
      ponerMensajeError(expediente, "Número de expediente inválido");
    else ponerMensajeError(expediente, "");

    if (!email.value.trim())
      ponerMensajeError(email, "El email es obligatorio");
    else ponerMensajeError(email, "");

    if (pass.value.length < 4)
      ponerMensajeError(pass, "Contraseña demasiado corta (mín. 4)");
    else ponerMensajeError(pass, "");

    if (!pass2.value) ponerMensajeError(pass2, "Confirma la contraseña");
    else if (pass.value !== pass2.value)
      ponerMensajeError(pass2, "Las contraseñas no coinciden");
    else ponerMensajeError(pass2, "");

    if (!selAnio.value)
      ponerMensajeError(selAnio, "Selecciona tu año de graduación");
    else ponerMensajeError(selAnio, "");

    refrescarCategoriaManual();
    const vAnio = selAnio.value;
    if (
      vAnio !== "" &&
      !isNaN(Number(vAnio)) &&
      Number(vAnio) === anioActual - 1
    ) {
      if (!selCatManual.value)
        ponerMensajeError(selCatManual, "Selecciona Alumno o Alumni");
      else ponerMensajeError(selCatManual, "");
    } else {
      ponerMensajeError(selCatManual, "");
    }

    if (titulo.value.trim().length < 2)
      ponerMensajeError(titulo, "El título es obligatorio");
    else ponerMensajeError(titulo, "");

    if (sinopsis.value.trim().length === 0)
      ponerMensajeError(sinopsis, "La sinopsis es obligatoria");
    else ponerMensajeError(sinopsis, "");

    // Archivos: si no han pasado por change
    if (!cartel.files || !cartel.files[0])
      ponerMensajeError(cartel, "El cartel es obligatorio");
    if (!corto.files || !corto.files[0])
      ponerMensajeError(corto, "El vídeo es obligatorio");

    // Si hay errores, no enviamos
    if (hayErroresEnPantalla()) {
      abrirModal(
        "warn",
        "Revisa el formulario",
        "Hay campos con errores. Corrígelos antes de enviar.",
      );
      return;
    }

    // Enviar a PHP
    const fd = new FormData(form);

    fetch("../php/crear_candidatura.php", {
      method: "POST",
      body: fd,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "success") {
          abrirModal(
            "error",
            "Error",
            data.message || "No se pudo crear la candidatura.",
          );
          return;
        }

        abrirModal(
          "ok",
          "Candidatura creada",
          "Tu candidatura se ha registrado correctamente.",
          () => {
            window.location.href = "panel_usuario_candidaturas.html";
          },
        );
      })
      .catch(() => {
        abrirModal("error", "Error", "Error de conexión con el servidor.");
      });
  });

  // Arranque
  refrescarCategoriaManual();
});
