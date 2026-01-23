document.addEventListener("DOMContentLoaded", () => {
    const form_login = document.getElementById("formLogin");
    const inputEmail = document.getElementById("email");
    const inputPass = document.getElementById("pass");
    const mensaje = document.getElementById("mensaje");
    const mensaje_mail = document.getElementById("mensaje_mail");
    const mensaje_pass = document.getElementById("mensaje_contrasena");

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