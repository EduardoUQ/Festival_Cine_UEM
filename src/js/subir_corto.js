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

  // ====== MODO PANEL ======
  const params = new URLSearchParams(window.location.search);
  const modoPanel = params.get("modo") === "panel";

  // Localiza el bloque “Datos personales” (primer .form-card)
  const cards = document.querySelectorAll(".form-card");
  const cardDatosPersonales = cards.length ? cards[0] : null;

  // ====== VALIDACIÓN RESOLUCIÓN VÍDEO ======
  // Ajusta aquí si cambias la resolución “oficial”
  const RES_W = 1920;
  const RES_H = 1080;
  // true por defecto para NO bloquear si el navegador no puede leer metadata
  let resolucionOk = true;

  // ====== DNI/NIE (letra de control) ======
  // >>> AQUÍ he metido TODO lo del DNI/NIE:
  // - Regex robusta para formato (DNI: 8 dígitos + letra / NIE: X/Y/Z + 7 dígitos + letra)
  // - Cálculo de letra por módulo 23 y tabla oficial
  const DNI_LETRAS = [
    "T",
    "R",
    "W",
    "A",
    "G",
    "M",
    "Y",
    "F",
    "P",
    "D",
    "X",
    "B",
    "N",
    "J",
    "Z",
    "S",
    "Q",
    "V",
    "H",
    "L",
    "C",
    "K",
    "E",
  ];

  // DNI: 8 dígitos + letra | NIE: X/Y/Z + 7 dígitos + letra (última letra A-Z)
  const DNI_NIE_REGEX = /^(\d{8}|[XYZ]\d{7})[A-Z]$/;

  function validarDniNie(valor) {
    const v = String(valor || "").trim().toUpperCase();

    // 1) Validación de formato
    if (!DNI_NIE_REGEX.test(v)) return false;

    // 2) Extraer número base y letra introducida
    const letraIntroducida = v.slice(-1);
    const cuerpo = v.slice(0, -1);

    // 3) Convertir NIE a número (X=0, Y=1, Z=2)
    let numeroStr = cuerpo;
    if (cuerpo[0] === "X") numeroStr = "0" + cuerpo.slice(1);
    else if (cuerpo[0] === "Y") numeroStr = "1" + cuerpo.slice(1);
    else if (cuerpo[0] === "Z") numeroStr = "2" + cuerpo.slice(1);

    const numero = Number(numeroStr);
    if (Number.isNaN(numero)) return false;

    // 4) Calcular letra por módulo 23
    const letraCorrecta = DNI_LETRAS[numero % 23];
    return letraIntroducida === letraCorrecta;
  }

  // ====== MODAL ======
  function abrirModal(tipo, tituloTxt, textoTxt, onAceptar) {
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
    if (!el) return;

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

  // ====== DESACTIVAR DATOS PERSONALES EN MODO PANEL (SIN OCULTAR LA CARD ENTERA) ======
  function desactivarDatosPersonales() {
    // NO ocultamos toda la tarjeta porque dentro vive grupo_categoria_manual
    if (cardDatosPersonales) {
      const h2 = cardDatosPersonales.querySelector("h2");
      if (h2) h2.textContent = "Participación";
    }

    const ocultarGrupo = (el) => {
      if (!el) return;
      const g = el.closest(".form-group");
      if (g) g.style.display = "none";
      el.required = false;
      el.disabled = true;
      el.value = "";
      ponerMensajeError(el, "");
    };

    ocultarGrupo(nombre);
    ocultarGrupo(dni);
    ocultarGrupo(expediente);
    ocultarGrupo(email);
    ocultarGrupo(pass);
    ocultarGrupo(pass2);
    ocultarGrupo(selAnio);

    // el manual se mostrará solo si aplica (según BBDD)
    if (grupoCatManual) grupoCatManual.style.display = "none";
    if (selCatManual) {
      selCatManual.disabled = true;
      selCatManual.required = false;
      selCatManual.value = "";
      ponerMensajeError(selCatManual, "");
    }
  }

  // ====== SELECT AÑO GRADUACIÓN (solo modo público) ======
  const anioActual = new Date().getFullYear();

  if (!modoPanel) {
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
  }

  // Poblar select manual categoría (vale para ambos modos)
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

  function refrescarCategoriaManualPublico() {
    const v = selAnio.value;

    if (v !== "" && !isNaN(Number(v)) && Number(v) === anioActual - 1) {
      grupoCatManual.style.display = "block";
    } else {
      grupoCatManual.style.display = "none";
      selCatManual.value = "";
      ponerMensajeError(selCatManual, "");
    }
  }

  // ====== CONTADOR SINOPSIS ======
  function pintarCounter() {
    counterSinopsis.textContent = `${sinopsis.value.length} / 500`;
  }
  sinopsis.addEventListener("input", pintarCounter);
  pintarCounter();

  // ====== LISTENERS PERSONALES (solo modo público) ======
  if (!modoPanel) {
    selAnio.addEventListener("change", () => {
      refrescarCategoriaManualPublico();
    });

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

      // >>> AQUÍ he cambiado la validación simple por validarDniNie()
      if (!validarDniNie(v)) ponerMensajeError(dni, "DNI/NIE inválido");
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
      // >>> AQUÍ he cambiado la validación de contraseña:
      // - Mínimo 8 caracteres
      // - Al menos 1 letra y 1 número
      // - Da igual mayúsculas/minúsculas
      const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

      if (!passRegex.test(pass.value)) {
        ponerMensajeError(
          pass,
          "Contraseña inválida (mín. 8 caracteres y debe incluir al menos 1 letra y 1 número)",
        );
      } else {
        ponerMensajeError(pass, "");
      }
    });

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
      refrescarCategoriaManualPublico();
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
  }

  // ====== LISTENERS DEL CORTO (ambos modos) ======
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

  // ====== ARCHIVOS ======
  cartel.addEventListener("change", () => {
    if (!cartel.files || !cartel.files[0]) {
      ponerMensajeError(cartel, "El cartel es obligatorio");
      return;
    }

    const f = cartel.files[0];
    const okType = f.type === "image/jpeg" || f.type === "image/tif";
    const okSize = f.size <= 2 * 1024 * 1024;

    if (!okType) ponerMensajeError(cartel, "Formato inválido. Solo JPG o TIF");
    else if (!okSize) ponerMensajeError(cartel, "El cartel supera 2MB");
    else ponerMensajeError(cartel, "");
  });

  corto.addEventListener("change", () => {
    videoInfo.textContent = "";
    resolucionOk = true; // reseteo

    if (!corto.files || !corto.files[0]) {
      ponerMensajeError(corto, "El vídeo es obligatorio");
      return;
    }

    const f = corto.files[0];
    const okType = f.type === "video/mp4" || f.type === "video/quicktime";
    if (!okType) {
      ponerMensajeError(corto, "Formato inválido. Solo MP4 o MOV (QuickTime)");
      return;
    }

    const maxBytes = 2 * 1024 * 1024 * 1024; // 2GB
    if (f.size > maxBytes) {
      ponerMensajeError(corto, "El vídeo es demasiado grande (máx. 2GB)");
      return;
    }

    // Limpio errores previos de tipo/tamaño
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

        if (!(w === RES_W && h === RES_H)) {
          resolucionOk = false;
          ponerMensajeError(
            corto,
            `Resolución no válida: debe ser ${RES_W}×${RES_H}`,
          );
        } else {
          resolucionOk = true;
          ponerMensajeError(corto, "");
        }
      } else {
        // No se pudo leer => no bloqueamos (limitación conocida)
        resolucionOk = true;
      }
    };

    v.onerror = () => {
      URL.revokeObjectURL(url);
      videoInfo.textContent =
        "No se pudo leer la resolución del vídeo en este navegador.";
      // No bloqueamos
      resolucionOk = true;
    };
  });

  // ====== CANCELAR ======
  btnCancelar.addEventListener("click", () => {
    if (modoPanel) window.location.href = "panel_usuario_candidatura.html";
    else window.location.href = "index.html";
  });

  // ====== ARRANQUE SEGÚN MODO ======
  if (modoPanel) {
    desactivarDatosPersonales();

    // Cargar año graduación real desde BBDD
    fetch("../php/usuario_info.php")
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "success") {
          abrirModal(
            "error",
            "Sesión",
            data.message || "No autorizado",
            () => {
              window.location.href = "../html/login.html";
            },
          );
          return;
        }

        const anioUser = Number(data.anio_graduacion);

        if (anioUser === anioActual - 1) {
          grupoCatManual.style.display = "block";
          selCatManual.disabled = false;
          selCatManual.required = true;
        } else {
          grupoCatManual.style.display = "none";
          selCatManual.value = "";
          selCatManual.disabled = true;
          selCatManual.required = false;
          ponerMensajeError(selCatManual, "");
        }
      })
      .catch(() => {
        abrirModal(
          "error",
          "Error",
          "No se pudo cargar la información del usuario.",
          () => {
            window.location.href = "../html/login.html";
          },
        );
      });
  } else {
    refrescarCategoriaManualPublico();
  }

  // ====== SUBMIT ======
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!modoPanel) {
      // ====== VALIDACIÓN COMPLETA (MODO PÚBLICO) ======
      if (nombre.value.trim().length < 3)
        ponerMensajeError(
          nombre,
          "Introduce nombre y apellidos (mínimo 3 caracteres)",
        );
      else ponerMensajeError(nombre, "");

      const vDni = dni.value.trim().toUpperCase();

      // >>> AQUÍ he cambiado la validación simple por validarDniNie()
      if (!validarDniNie(vDni)) ponerMensajeError(dni, "DNI/NIE inválido");
      else ponerMensajeError(dni, "");

      if (expediente.value.trim().length !== 8)
        ponerMensajeError(expediente, "Número de expediente inválido");
      else ponerMensajeError(expediente, "");

      if (!email.value.trim())
        ponerMensajeError(email, "El email es obligatorio");
      else ponerMensajeError(email, "");

      // (mantengo coherencia en submit también)
      const passRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
      if (!passRegex.test(pass.value))
        ponerMensajeError(
          pass,
          "Contraseña inválida (mín. 8 caracteres y debe incluir al menos 1 letra y 1 número)",
        );
      else ponerMensajeError(pass, "");

      if (!pass2.value) ponerMensajeError(pass2, "Confirma la contraseña");
      else if (pass.value !== pass2.value)
        ponerMensajeError(pass2, "Las contraseñas no coinciden");
      else ponerMensajeError(pass2, "");

      if (!selAnio.value)
        ponerMensajeError(selAnio, "Selecciona tu año de graduación");
      else ponerMensajeError(selAnio, "");

      refrescarCategoriaManualPublico();
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

      if (!cartel.files || !cartel.files[0])
        ponerMensajeError(cartel, "El cartel es obligatorio");
      if (!corto.files || !corto.files[0])
        ponerMensajeError(corto, "El vídeo es obligatorio");
    } else {
      // ====== VALIDACIÓN (MODO PANEL) SOLO DATOS DEL CORTO ======
      if (titulo.value.trim().length < 2)
        ponerMensajeError(titulo, "El título es obligatorio");
      else ponerMensajeError(titulo, "");

      if (sinopsis.value.trim().length === 0)
        ponerMensajeError(sinopsis, "La sinopsis es obligatoria");
      else ponerMensajeError(sinopsis, "");

      if (!cartel.files || !cartel.files[0])
        ponerMensajeError(cartel, "El cartel es obligatorio");
      if (!corto.files || !corto.files[0])
        ponerMensajeError(corto, "El vídeo es obligatorio");

      if (grupoCatManual && grupoCatManual.style.display !== "none") {
        if (!selCatManual.value)
          ponerMensajeError(selCatManual, "Selecciona Alumno o Alumni");
        else ponerMensajeError(selCatManual, "");
      } else {
        ponerMensajeError(selCatManual, "");
      }
    }

    // Bloqueo por resolución SI se detectó y no es válida
    if (!resolucionOk) {
      abrirModal(
        "warn",
        "Vídeo inválido",
        `La resolución del vídeo debe ser ${RES_W}×${RES_H}.`,
      );
      return;
    }

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
    fd.append("modo", modoPanel ? "panel" : "publico");

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
            window.location.href = modoPanel
              ? "panel_usuario_candidatura.html"
              : "panel_usuario_candidatura.html";
          },
        );
      })
      .catch(() => {
        abrirModal("error", "Error", "Error de conexión con el servidor.");
      });
  });
});
