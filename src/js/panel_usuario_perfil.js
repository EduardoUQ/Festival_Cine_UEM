const form = document.getElementById("profileForm");
const formPass = document.getElementById("passwordForm");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const editPassBtn = document.getElementById("editPassBtn")
const savePassBtn = document.getElementById("savePassBtn")

const inputs = form.querySelectorAll("input");
const inputsPassword = formPass.querySelectorAll("input")

let editMode = false;
let originalValues = {};

// Variables del modal
const modalOverlay = document.getElementById("modalOverlay");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");

// Variables del formulario de datos
const nombreForm = document.getElementById("nombreForm");
const dni = document.getElementById("dni");
const expediente = document.getElementById("expediente");
const email = document.getElementById("email")

// Variables del formulario de contraseña
const password = document.getElementById("password");
const repassword = document.getElementById("repassword")

// Cargar los datos del usuario
document.addEventListener("DOMContentLoaded", () => {
    // Cargamos los datos del perfil del usuario
    fetch("../php/mostrar_usuario_datos.php")
        .then(res => res.json())
        .then((data) => {
            const d = data.datos;
            console.log(d)
            nombreForm.value = d.nombre_apellidos ?? "";
            dni.value = d.dni ?? "";
            expediente.value = d.num_expediente ?? "";
            email.value = d.email ?? "";
        })
        .catch(err => console.error("Error cargando candidaturas:", err));

});

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

// Activar / desactivar inputs
function toggleInputs(enable) {
    inputs.forEach(input => {
        input.disabled = !enable;
    });
}

// Guardar valores originales
function saveOriginalValues() {
    inputs.forEach(input => {
        originalValues[input.id] = input.value;
    });
}

// Restaurar valores originales
function restoreValues() {
    inputs.forEach(input => {
        if (originalValues[input.id] !== undefined) {
            input.value = originalValues[input.id];
        }
    });
}

// CLICK EDITAR / CANCELAR
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

// GUARDAR CAMBIOS
form.addEventListener("submit", (e) => {

    e.preventDefault();

    // Aquí luego iría el fetch al backend
    console.log("Datos enviados:");

    // Pasamos todo al PHP
    editar_datos_usuario();

    inputs.forEach(input => {
        console.log(`${input.id}: ${input.value}`);
    });

    toggleInputs(false);
    saveBtn.disabled = true;
    editMode = false;
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';
});


// --- Envío al PHP ---
function editar_datos_usuario() {
    let formData = new FormData();

    formData.append("accion", "editar_datos");
    formData.append("nombre", nombreForm.value);
    formData.append("dni", dni.value);
    formData.append("expediente", expediente.value);
    formData.append("email", email.value);

    fetch("../php/editar_usuario_datos.php", {
        method: "POST",
        body: formData
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                showModal(data.status, data.titulo, data.message);
            } else {
                showModal(data.status, data.titulo, data.message);
            }
        });
}

// ---- CAMBIAR CONTRASEÑA DEL USUARIO ------
// Activar / desactivar inputs
function toggleInputsPassword(enable) {
    inputsPassword.forEach(input => {
        input.disabled = !enable;
    });
}

// Guardar valores originales
// function saveOriginalValuesPassword() {
//     inputsPassword.forEach(input => {
//         originalValues[input.id] = input.value;
//     });
// }

// Restaurar valores originales
function restoreValuesPassword() {
    inputsPassword.forEach(input => {
        input.value == "";
    })
}

// Mantener el botón de guardado en disable
savePassBtn.disabled = true;

// CLICK EDITAR / CANCELAR
editPassBtn.addEventListener("click", () => {
    editMode = !editMode;

    if (editMode) {
        // saveOriginalValuesPassword();
        toggleInputsPassword(true);
        savePassBtn.disabled = false;
        editPassBtn.innerHTML = '<i class="fa-solid fa-xmark"></i> Cancelar edición';
    } else {
        restoreValuesPassword();
        toggleInputsPassword(false);
        savePassBtn.disabled = true;
        editPassBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';
    }
});

// GUARDAR CAMBIOS
formPass.addEventListener("submit", (e) => {
    e.preventDefault();

    // Aquí luego iría el fetch al backend
    console.log("Datos enviados:");

    // Validaciones
    if (!password.value || !repassword.value) {
        showModal("error", "Acción no válida", "Todos los campos son obligatorios");
        return;
    }

    if (password.value !== repassword.value) {
        showModal("error", "Acción no válida", "Los campos no coinciden");
        return;
    }
    // Pasamos todo al PHP
    editar_contrasena_usuario();

    inputs.forEach(input => {
        console.log(`${input.id}: ${input.value}`);
    });

    toggleInputsPassword(false);
    savePassBtn.disabled = true;
    editMode = false;
    editPassBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';
});

// --- Envío al PHP ---
function editar_contrasena_usuario() {
    let formData = new FormData();

    formData.append("accion", "editar_contraseña");
    formData.append("password", password.value);
    // formData.append("dni", repassword.value);

    fetch("../php/editar_usuario_datos.php", {
        method: "POST",
        body: formData
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                showModal(data.status, data.titulo, data.message);
            } else {
                showModal(data.status, data.titulo, data.message);
            }
        });
}