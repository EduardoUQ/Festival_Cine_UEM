// Variables del formulario
const form_login = document.getElementById("formLogin");
const inputEmail = document.getElementById("email");
const inputPass = document.getElementById("pass");
const mensaje = document.getElementById("mensaje");

// Verificamos cuando se envíe
if (form_login) {
    form_login.addEventListener("submit", function (event) {
        event.preventDefault();

        const email = inputEmail.value.trim();
        const pass = inputPass.value;

        // Validaciones
        if (!email || !pass) {
            mensaje.textContent = "Por favor completa todos los campos";
            return;
        }

        // Pasamos todo al PHP
        procesarLogin(email, pass);
    });
}

// --- Envío al PHP ---
function procesarLogin(email, pass) {
    let formData = new FormData();
    formData.append("funcion", "procesarLogin");
    formData.append("email", email);
    formData.append("pass", pass);

    fetch("../php/login.php", {
        method: "POST",
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === "success" && data.rol === 'admin') {
                window.location.href = "../html/panel_candidaturas.html";
            } else if (data.status === "success" && data.rol === 'usuario') {
                window.location.href = "../html/panel_candidaturas.html";
            } else {
                mensaje.textContent = data.message;
            }
        })
        .catch(error => {
            console.error("Error:", error);
            mensaje.textContent = "Error al conectar con el servidor.";
        });
}