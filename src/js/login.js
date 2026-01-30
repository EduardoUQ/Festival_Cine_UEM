document.addEventListener("DOMContentLoaded", () => {
    const form_login = document.getElementById("formLogin");
    const inputEmail = document.getElementById("email");
    const inputPass = document.getElementById("pass");
    const mensaje = document.getElementById("mensaje");
    const mensaje_mail = document.getElementById("mensaje_mail");
    const mensaje_pass = document.getElementById("mensaje_contrasena");

    // Modal
    const modal = document.getElementById("modalCambioPass");
    const overlay = document.getElementById("modalOverlay");
    const newPass = document.getElementById("new_pass");
    const newPass2 = document.getElementById("new_pass2");
    const modalMsg = document.getElementById("modal_msg");
    const btnGuardar = document.getElementById("btnGuardarPass");
    const btnCerrar = document.getElementById("btnCerrarModal");

    // Toggle ojo (opcional, ya que lo tienes en el HTML)
    const eye = document.getElementById("eye");
    if (eye) {
        eye.addEventListener("click", () => {
            inputPass.type = (inputPass.type === "password") ? "text" : "password";
            eye.classList.toggle("fa-eye");
            eye.classList.toggle("fa-eye-slash");
        });
    }

    function validarVacioEmail() {
        const email = inputEmail.value.trim();
        if (email === "") {
            mensaje_mail.textContent = "*Escribe tu correo";
            return false;
        }
        mensaje_mail.textContent = "";
        return true;
    }

    function validarVacioPass() {
        const pass = inputPass.value.trim();
        if (pass === "") {
            mensaje_pass.textContent = "*Escribe tu contraseña";
            return false;
        }
        mensaje_pass.textContent = "";
        return true;
    }

    inputEmail.addEventListener("blur", validarVacioEmail);
    inputPass.addEventListener("blur", validarVacioPass);

    inputEmail.addEventListener("input", () => {
        mensaje_mail.textContent = "";
        mensaje.textContent = "";
    });

    inputPass.addEventListener("input", () => {
        mensaje_pass.textContent = "";
        mensaje.textContent = "";
    });

    function abrirModalCambio() {
        modalMsg.textContent = "";
        newPass.value = "";
        newPass2.value = "";

        overlay.classList.add("show");
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");

        // Evita cerrar tocando fuera si quieres forzarlo:
        // overlay.style.pointerEvents = "none";

        setTimeout(() => newPass.focus(), 50);
    }

    function cerrarModalCambio() {
        overlay.classList.remove("show");
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        modalMsg.textContent = "";
    }

    function validarCambioPassLocal() {
        const p1 = newPass.value;
        const p2 = newPass2.value;

        if (p1.length < 4) {
            modalMsg.textContent = "La nueva contraseña debe tener mínimo 4 caracteres.";
            return false;
        }
        if (p1 !== p2) {
            modalMsg.textContent = "Las contraseñas no coinciden.";
            return false;
        }
        modalMsg.textContent = "";
        return true;
    }

    btnCerrar.addEventListener("click", () => {
        // Si prefieres obligar a cambiarla, quita este botón o no permitas cerrar
        cerrarModalCambio();
        mensaje.textContent = "Debes cambiar la contraseña inicial para continuar.";
    });

    overlay.addEventListener("click", () => {
        // opcional: cerrar al hacer click fuera
        cerrarModalCambio();
        mensaje.textContent = "Debes cambiar la contraseña inicial para continuar.";
    });

    btnGuardar.addEventListener("click", () => {
        if (!validarCambioPassLocal()) return;

        let formData = new FormData();
        formData.append("funcion", "cambiarPassAdmin");
        formData.append("new_pass", newPass.value);

        fetch("../php/login.php", {
            method: "POST",
            body: formData
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === "success") {
                    cerrarModalCambio();
                    window.location.href = "../html/panel_noticias.html";
                } else {
                    modalMsg.textContent = data.message || "No se pudo cambiar la contraseña.";
                }
            })
            .catch(err => {
                console.error(err);
                modalMsg.textContent = "Error al conectar con el servidor.";
            });
    });

    // Enter dentro del modal
    [newPass, newPass2].forEach(inp => {
        inp.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                btnGuardar.click();
            }
        });
    });

    if (form_login) {
        form_login.addEventListener("submit", function (event) {
            event.preventDefault();

            const okEmail = validarVacioEmail();
            const okPass = validarVacioPass();

            if (!okEmail || !okPass) {
                mensaje.textContent = "Por favor completa todos los campos";
                return;
            }

            const email = inputEmail.value.trim();
            const pass = inputPass.value;

            procesarLogin(email, pass);
        });
    }

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
                    // Si entra con 12345 => modal
                    if (data.force_change === true) {
                        abrirModalCambio();
                        return;
                    }
                    window.location.href = "../html/panel_noticias.html";
                } else if (data.status === "success" && data.rol === 'usuario') {
                    window.location.href = "../html/panel_usuario_candidatura.html";
                } else {
                    mensaje.textContent = data.message;
                }
            })
            .catch(error => {
                console.error("Error:", error);
                mensaje.textContent = "Error al conectar con el servidor.";
            });
    }
});
