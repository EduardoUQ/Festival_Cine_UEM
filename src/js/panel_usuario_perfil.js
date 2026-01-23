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

const modalOverlay = document.getElementById("modalOverlay");
const modalIcon = document.getElementById("modalIcon");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");

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

    // fetch("/api/usuario/actualizar", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(Object.fromEntries(new FormData(form)))
    // });
    inputs.forEach(input => {
        console.log(`${input.id}: ${input.value}`);
    });

    toggleInputs(false);
    saveBtn.disabled = true;
    editMode = false;
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';

    showModal(
        "success",
        "Cambios guardados",
        "Tus datos se han actualizado correctamente."
    );
});


// CAMBIAR CONTRASEÑA
// Activar / desactivar inputs
function toggleInputsPassword(enable) {
    inputsPassword.forEach(input => {
        input.disabled = !enable;
    });
}

// Guardar valores originales
function saveOriginalValuesPassword() {
    inputsPassword.forEach(input => {
        originalValues[input.id] = input.value;
    });
}

// Restaurar valores originales
function restoreValuesPassword() {
    inputsPassword.forEach(input => {
        if (originalValues[input.id] !== undefined) {
            input.value = originalValues[input.id];
        }
    });
}

// CLICK EDITAR / CANCELAR
editPassBtn.addEventListener("click", () => {
    editMode = !editMode;

    if (editMode) {
        saveOriginalValuesPassword();
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

    // fetch("/api/usuario/actualizar", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(Object.fromEntries(new FormData(form)))
    // });
    inputs.forEach(input => {
        console.log(`${input.id}: ${input.value}`);
    });

    toggleInputsPassword(false);
    savePassBtn.disabled = true;
    editMode = false;
    editPassBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Editar datos';

    alert("Cambios guardados correctamente (simulado)");
});
