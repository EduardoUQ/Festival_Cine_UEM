document.addEventListener("DOMContentLoaded", () => {

  // -------- SESIÓN / ADMIN --------
  fetch("../php/session_info.php")
    .then(r => r.json())
    .then(info => {
      if (!info.logged || info.rol !== "admin") {
        window.location.href = "../html/login.html";
        return;
      }

      const elNombre = document.getElementById("nombre");
      if (elNombre) elNombre.textContent = info.nombre;

      // Logout igual que en panel_candidaturas.js
      const btnLogout = document.getElementById("btn_logout");
      if (btnLogout) {
        btnLogout.addEventListener("click", () => {
          fetch("../php/logout.php", { method: "POST" })
            .then(r => r.json())
            .then(resp => {
              if (resp.status === "success") window.location.href = "../html/login.html";
              else showInfoModal("Error", "No se pudo cerrar sesión.");
            })
            .catch(() => showInfoModal("Error", "Error de red al cerrar sesión."));
        });
      }

      // Si es super_admin, mostramos sección y cargamos admins
      const sec = document.getElementById("sec_superadmin");
      const isSuper = info.super_admin === true;

      if (isSuper) {
        if (sec) sec.style.display = "block";
        cargarAdmins();
      } else {
        if (sec) sec.style.display = "none";
      }

      initModal();
      initPasswordValidation();
      initAdminValidation(isSuper);

      initPasswordActions();
      initAdminsActions(isSuper);
    })
    .catch(() => window.location.href = "../html/login.html");
});

/* =========================================================
   REGEX
========================================================= */
const REGEX_DNI = /^[0-9]{8}[A-Za-z]$/;
// Permite letras/números y símbolos típicos (., _, %, +, -) en local-part y dominio.
// Exige un punto y TLD de mínimo 2 letras.
const REGEX_EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

/* =========================================================
   MODAL (confirmación / info)
========================================================= */
let modalOverlay, modalTitle, modalMessage, modalActions, modalCancel, modalConfirm, modalClose;
let _onConfirm = null;

function initModal() {
  modalOverlay = document.getElementById("modal_overlay");
  modalTitle = document.getElementById("modal_title");
  modalMessage = document.getElementById("modal_message");
  modalActions = document.getElementById("modal_actions");
  modalCancel = document.getElementById("modal_cancel");
  modalConfirm = document.getElementById("modal_confirm");
  modalClose = document.getElementById("modal_close");

  const closeAll = () => closeModal();

  if (modalClose) modalClose.addEventListener("click", closeAll);
  if (modalCancel) modalCancel.addEventListener("click", closeAll);

  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeAll();
    });
  }

  if (modalConfirm) {
    modalConfirm.addEventListener("click", () => {
      const cb = _onConfirm;
      closeModal();
      if (typeof cb === "function") cb();
    });
  }
}

function openModal({ title, message, type = "confirm", onConfirm = null }) {
  if (!modalOverlay) return;

  modalTitle.textContent = title || "Confirmación";
  modalMessage.textContent = message || "";

  _onConfirm = onConfirm;

  // type: "confirm" => Cancelar+Confirmar
  // type: "info" => solo OK
  if (type === "info") {
    modalCancel.style.display = "none";
    modalConfirm.textContent = "OK";
    modalConfirm.style.display = "inline-block";
    _onConfirm = null; // en info no ejecutamos nada al OK
  } else {
    modalCancel.style.display = "inline-block";
    modalConfirm.textContent = "Confirmar";
    modalConfirm.style.display = "inline-block";
  }

  modalOverlay.style.display = "grid";
}

function closeModal() {
  if (!modalOverlay) return;
  modalOverlay.style.display = "none";
  _onConfirm = null;
}

function showInfoModal(title, message) {
  openModal({ title, message, type: "info" });
}

function showConfirmModal(title, message, onConfirm) {
  openModal({ title, message, type: "confirm", onConfirm });
}

/* =========================================================
   VALIDACIONES (helpers)
========================================================= */
function setError(inputId, errId, msg) {
  const input = document.getElementById(inputId);
  const err = document.getElementById(errId);

  if (err) err.textContent = msg || "";
  if (input) {
    if (msg) input.classList.add("invalid");
    else input.classList.remove("invalid");
  }
}

function validateNotEmpty(inputId, errId, fieldName) {
  const v = (document.getElementById(inputId)?.value || "").trim();
  if (!v) {
    setError(inputId, errId, `El campo "${fieldName}" es obligatorio.`);
    return false;
  }
  setError(inputId, errId, "");
  return true;
}

/* =========================================================
   VALIDACIÓN CONTRASEÑAS (blur)
========================================================= */
function initPasswordValidation() {
  const current = document.getElementById("current_pass");
  const np = document.getElementById("new_pass");
  const cp = document.getElementById("confirm_pass");

  if (current) current.addEventListener("blur", () => validateCurrentPass());
  if (np) np.addEventListener("blur", () => validateNewPass());
  if (cp) cp.addEventListener("blur", () => validateConfirmPass());
}

function validateCurrentPass() {
  const v = (document.getElementById("current_pass")?.value || "");
  if (!v) {
    setError("current_pass", "err_current_pass", "Introduce tu contraseña actual.");
    return false;
  }
  setError("current_pass", "err_current_pass", "");
  return true;
}

function validateNewPass() {
  const v = (document.getElementById("new_pass")?.value || "");
  if (!v) {
    setError("new_pass", "err_new_pass", "Introduce la nueva contraseña.");
    return false;
  }
  if (v.length < 4) {
    setError("new_pass", "err_new_pass", "Mínimo 4 caracteres.");
    return false;
  }
  setError("new_pass", "err_new_pass", "");
  return true;
}

function validateConfirmPass() {
  const v = (document.getElementById("confirm_pass")?.value || "");
  const np = (document.getElementById("new_pass")?.value || "");

  if (!v) {
    setError("confirm_pass", "err_confirm_pass", "Confirma la nueva contraseña.");
    return false;
  }
  if (v !== np) {
    setError("confirm_pass", "err_confirm_pass", "Las contraseñas no coinciden.");
    return false;
  }
  setError("confirm_pass", "err_confirm_pass", "");
  return true;
}

function validateAllPass() {
  const a = validateCurrentPass();
  const b = validateNewPass();
  const c = validateConfirmPass();
  return a && b && c;
}

/* =========================================================
   VALIDACIÓN CREAR ADMIN (blur)
========================================================= */
function initAdminValidation(isSuper) {
  if (!isSuper) return;

  const dni = document.getElementById("dni");
  const email = document.getElementById("email");
  const nombre = document.getElementById("nombre_apellidos");

  if (dni) dni.addEventListener("blur", () => validateDni());
  if (email) email.addEventListener("blur", () => validateEmail());
  if (nombre) nombre.addEventListener("blur", () => validateNombre());
}

function validateDni() {
  const v = (document.getElementById("dni")?.value || "").trim();
  if (!v) {
    setError("dni", "err_dni", "Introduce el DNI.");
    return false;
  }
  if (!REGEX_DNI.test(v)) {
    setError("dni", "err_dni", "Formato inválido. Ej: 12345678A");
    return false;
  }
  setError("dni", "err_dni", "");
  return true;
}

function validateEmail() {
  const v = (document.getElementById("email")?.value || "").trim();
  if (!v) {
    setError("email", "err_email", "Introduce el email.");
    return false;
  }
  if (!REGEX_EMAIL.test(v)) {
    setError("email", "err_email", "Email inválido.");
    return false;
  }
  setError("email", "err_email", "");
  return true;
}

function validateNombre() {
  const v = (document.getElementById("nombre_apellidos")?.value || "").trim();
  if (!v) {
    setError("nombre_apellidos", "err_nombre", "Introduce nombre y apellidos.");
    return false;
  }
  setError("nombre_apellidos", "err_nombre", "");
  return true;
}

function validateAllAdmin() {
  const a = validateDni();
  const b = validateEmail();
  const c = validateNombre();
  return a && b && c;
}

/* =========================================================
   ACCIONES: CAMBIO DE CONTRASEÑA (con confirm modal)
========================================================= */
function initPasswordActions() {
  const btn = document.getElementById("btn_cambiar_pass");
  const btnLimpiar = document.getElementById("btn_limpiar_pass");

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      document.getElementById("current_pass").value = "";
      document.getElementById("new_pass").value = "";
      document.getElementById("confirm_pass").value = "";
      setError("current_pass", "err_current_pass", "");
      setError("new_pass", "err_new_pass", "");
      setError("confirm_pass", "err_confirm_pass", "");
    });
  }

  if (!btn) return;

  btn.addEventListener("click", () => {
    // Forzamos validación antes de confirmar
    if (!validateAllPass()) {
      showInfoModal("Revisa los campos", "Corrige los errores antes de continuar.");
      return;
    }

    showConfirmModal(
      "Confirmar cambio de contraseña",
      "¿Seguro que quieres cambiar tu contraseña?",
      () => doChangePassword()
    );
  });
}

function doChangePassword() {
  const currentPass = document.getElementById("current_pass").value;
  const newPass = document.getElementById("new_pass").value;
  const confirmPass = document.getElementById("confirm_pass").value;

  const fd = new FormData();
  fd.append("funcion", "cambiarPassAdminPanel");
  fd.append("current_pass", currentPass);
  fd.append("new_pass", newPass);
  fd.append("confirm_pass", confirmPass);

  fetch("../php/login.php", { method: "POST", body: fd })
    .then(r => r.json())
    .then(resp => {
      if (resp.status === "success") {
        document.getElementById("current_pass").value = "";
        document.getElementById("new_pass").value = "";
        document.getElementById("confirm_pass").value = "";
        showInfoModal("Contraseña actualizada", "Se ha actualizado correctamente.");
      } else {
        showInfoModal("No se pudo cambiar", resp.message || "Error al actualizar la contraseña.");
      }
    })
    .catch(() => showInfoModal("Error", "Error de red."));
}

/* =========================================================
   SUPER ADMIN: crear/borrar (confirm modal)
========================================================= */
function initAdminsActions(isSuper) {
  if (!isSuper) return;

  const btnCrear = document.getElementById("btn_crear_admin");
  const tbody = document.getElementById("tbody_admins");

  if (btnCrear) {
    btnCrear.addEventListener("click", () => {
      // Forzamos validación antes de confirmar
      if (!validateAllAdmin()) {
        showInfoModal("Revisa los campos", "Corrige los errores antes de continuar.");
        return;
      }

      const dni = document.getElementById("dni").value.trim();
      const email = document.getElementById("email").value.trim();
      const nombre = document.getElementById("nombre_apellidos").value.trim();
      const superAdmin = document.getElementById("super_admin_checkbox").checked ? "Sí" : "No";

      showConfirmModal(
        "Confirmar alta de admin",
        `¿Crear el admin "${nombre}" (${email})? Super_admin: ${superAdmin}.`,
        () => doCreateAdmin()
      );
    });
  }

  // Delegación para borrar (sin alert/confirm nativos)
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const btn = e.target.closest(".js-borrar-admin");
      if (!btn) return;

      const id = btn.getAttribute("data-id");
      const nombre = btn.getAttribute("data-nombre") || "este admin";

      showConfirmModal(
        "Confirmar borrado",
        `¿Seguro que quieres borrar a "${nombre}"?`,
        () => doDeleteAdmin(id)
      );
    });
  }
}

function doCreateAdmin() {
  const dni = document.getElementById("dni").value.trim();
  const email = document.getElementById("email").value.trim();
  const nombre = document.getElementById("nombre_apellidos").value.trim();
  const superAdmin = document.getElementById("super_admin_checkbox").checked ? 1 : 0;

  const fd = new FormData();
  fd.append("dni", dni);
  fd.append("email", email);
  fd.append("nombre_apellidos", nombre);
  fd.append("super_admin", superAdmin);

  fetch("../php/crear_admin.php", { method: "POST", body: fd })
    .then(r => r.json())
    .then(resp => {
      if (resp.status === "success") {
        document.getElementById("dni").value = "";
        document.getElementById("email").value = "";
        document.getElementById("nombre_apellidos").value = "";
        document.getElementById("super_admin_checkbox").checked = false;

        setError("dni", "err_dni", "");
        setError("email", "err_email", "");
        setError("nombre_apellidos", "err_nombre", "");

        showInfoModal("Admin creado", "Admin creado. Contraseña inicial: 12345");
        cargarAdmins();
      } else {
        showInfoModal("No se pudo crear", resp.message || "No se pudo crear el admin.");
      }
    })
    .catch(() => showInfoModal("Error", "Error de red."));
}

function doDeleteAdmin(id) {
  if (!id) return;

  const fd = new FormData();
  fd.append("id", id);

  fetch("../php/eliminar_admin.php", { method: "POST", body: fd })
    .then(r => r.json())
    .then(resp => {
      if (resp.status === "success") {
        showInfoModal("Admin eliminado", "Se ha eliminado correctamente.");
        cargarAdmins();
      } else {
        showInfoModal("No se pudo eliminar", resp.message || "No se pudo eliminar.");
      }
    })
    .catch(() => showInfoModal("Error", "Error de red."));
}

/* =========================================================
   Cargar admins
========================================================= */
function cargarAdmins() {
  const tbody = document.getElementById("tbody_admins");
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Cargando...</td></tr>`;

  fetch("../php/listar_admins.php")
    .then(r => r.json())
    .then(resp => {
      if (!resp || resp.status !== "success") {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No se pudieron cargar los admins</td></tr>`;
        return;
      }

      const admins = resp.admins || [];
      if (admins.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No hay otros administradores</td></tr>`;
        return;
      }

      tbody.innerHTML = "";
      admins.forEach(a => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${escapeHTML(a.nombre_apellidos)}</td>
          <td>${escapeHTML(a.email)}</td>
          <td>${escapeHTML(a.dni)}</td>
          <td>
            ${a.super_admin ? `<span class="badge gold">super_admin</span>` : `<span class="badge">admin</span>`}
          </td>
          <td>
            <button class="icon-btn js-borrar-admin" data-id="${a.id}" data-nombre="${escapeHTML(a.nombre_apellidos)}" title="Borrar admin">
              <i class="fa-solid fa-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(() => {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Error de red</td></tr>`;
    });
}

/* =========================================================
   Utils
========================================================= */
function escapeHTML(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
