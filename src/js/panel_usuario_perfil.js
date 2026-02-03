// ====== ELEMENTOS ======
const form = document.getElementById("profileForm");
const formPass = document.getElementById("passwordForm");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const editPassBtn = document.getElementById("editPassBtn");
const savePassBtn = document.getElementById("savePassBtn");

const inputs = form.querySelectorAll("input");
const inputsPassword = formPass.querySelectorAll("input");

let editMode = false;
let originalValues = {};

// ====== MODAL ======
const modalOverlay = document.getElementById("modalOverlay");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// ====== CAMPOS PERFIL ======
const nombreForm = document.getElementById("nombreForm");
const dni = document.getElementById("dni");
const expediente = document.getElementById("expediente");
const email = document.getElementById("email");

// ====== CAMPOS PASSWORD ======
const password = document.getElementById("password");
const repassword = document.getElementById("repassword");

// ====== MOSTRAR MODAL ======
function showModal(type, title, message) {
  modalIcon.className = `modal-icon ${type}`;
  modalIcon.innerHTML =
    type === "success"
      ? '<i class="fa-solid fa-circle-check"></i>'
      : '<i class="fa-solid fa-circle-xmark"></i>';

  modalTitle.textContent = title;
  modalMessage.textContent = message;

  modalOverlay.classList.add("active");
}

modalCloseBtn.addEventListener("click", () => {
  modalOverlay.classList.remove("active");
});

// Mantener el botón de guardado en disable
saveBtn.disabled = true;
savePassBtn.disabled = true;

// ====== Activar / desactivar inputs ======
function toggleInputs(enable) {
  inputs.forEach((input) => {
    input.disabled = !enable;
  });
}

function toggleInputsPassword(enable) {
  inputsPassword.forEach((input) => {
    input.disabled = !enable;
  });
}

// Guardar valores originales
function saveOriginalValues() {
  inputs.forEach((input) => {
    originalValues[input.id] = input.value;
  });
}

// Restaurar valores originales
function restoreValues() {
  inputs.forEach((input) => {
    if (originalValues[input.id] !== undefined) {
      input.value = originalValues[input.id];
    }
  });
}

// Restaurar valores password
function restoreValuesPassword() {
  inputsPassword.forEach((input) => {
    input.value = "";
  });
}

// ====== CARGA INICIAL ======
document.addEventListener("DOMContentLoaded", () => {
  // 1) Session + pintar nombre en sidebar + logout (AQUÍ ESTABA EL FALLO)
  fetch("../php/session_info.php")
    .then((r) => r.json())
    .then((info) => {
      if (!info.logged || info.rol !== "usuario") {
        window.location.href = "../html/login.html";
        return;
      }

      const elNombreSidebar = document.getElementById("nombre");
      if (elNombreSidebar) elNombreSidebar.textContent = info.nombre;

      // Logout
      const btnLogout = document.getElementById("btn_logout");
      if (btnLogout) {
        btnLogout.addEventListener("click", () => {
          fetch("../php/logout.php", { method: "POST" })
            .then((r) => r.json())
            .then((resp) => {
              if (resp.status === "success") {
                window.location.href = "../html/login.html";
              } else {
                showModal("error", "Error", "No se pudo cerrar sesión");
              }
            })
            .catch(() => {
              showModal("error", "Error", "Error al cerrar sesión");
            });
        });
      }
    })
    .catch(() => {
      window.location.href = "../html/login.html";
    });

  // 2) Cargar los datos del perfil del usuario (formulario)
  fetch("../php/mostrar_usuario_datos.php")
    .then((res) => res.json())
    .then((data) => {
      const d = data.datos;
      console.log(d);
      nombreForm.value = d?.nombre_apellidos ?? "";
      dni.value = d?.dni ?? "";
      expediente.value = d?.num_expediente ?? "";
      email.value = d?.email ?? "";
    })
    .catch((err) => console.error("Error cargando datos de usuario:", err));
});

// ====== CLICK EDITAR / CANCELAR (DATOS) ======
editBtn.addEventListener("click", () => {
  editMode = !editMode;

  if (editMode) {
    saveOriginalValues();
    toggleInputs(true);
    saveBtn.disabled = false;
    editBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar edición';
  } else {
    restoreValues();
    toggleInputs(false);
    saveBtn.disabled = true;
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';
  }
});

// ====== GUARDAR CAMBIOS (DATOS) ======
form.addEventListener("submit", (e) => {
  e.preventDefault();

  editar_datos_usuario();

  toggleInputs(false);
  saveBtn.disabled = true;
  editMode = false;
  editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';
});

// --- Envío al PHP (DATOS) ---
function editar_datos_usuario() {
  let formData = new FormData();

  formData.append("accion", "editar_datos");
  formData.append("nombre", nombreForm.value);
  formData.append("dni", dni.value);
  formData.append("expediente", expediente.value);
  formData.append("email", email.value);

  fetch("../php/editar_usuario_datos.php", {
    method: "POST",
    body: formData,
  })
    .then((r) => r.json())
    .then((data) => {
      showModal(data.status, data.titulo, data.message);
    })
    .catch(() => {
      showModal("error", "Error", "Error de conexión con el servidor");
    });
}

// ====== CLICK EDITAR / CANCELAR (PASSWORD) ======
editPassBtn.addEventListener("click", () => {
  editMode = !editMode;

  if (editMode) {
    toggleInputsPassword(true);
    savePassBtn.disabled = false;
    editPassBtn.innerHTML =
      '<i class="fa-solid fa-xmark"></i> Cancelar edición';
  } else {
    restoreValuesPassword();
    toggleInputsPassword(false);
    savePassBtn.disabled = true;
    editPassBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';
  }
});

// ====== GUARDAR CAMBIOS (PASSWORD) ======
formPass.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!password.value || !repassword.value) {
    showModal("error", "Acción no válida", "Todos los campos son obligatorios");
    return;
  }

  if (password.value !== repassword.value) {
    showModal("error", "Acción no válida", "Los campos no coinciden");
    return;
  }

  editar_contrasena_usuario();

  toggleInputsPassword(false);
  savePassBtn.disabled = true;
  editMode = false;
  editPassBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';
});

// --- Envío al PHP (PASSWORD) ---
function editar_contrasena_usuario() {
  let formData = new FormData();

  formData.append("accion", "editar_contraseña");
  formData.append("password", password.value);

  fetch("../php/editar_usuario_datos.php", {
    method: "POST",
    body: formData,
  })
    .then((r) => r.json())
    .then((data) => {
      showModal(data.status, data.titulo, data.message);
    })
    .catch(() => {
      showModal("error", "Error", "Error de conexión con el servidor");
    });
}
