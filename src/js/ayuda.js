document.addEventListener("DOMContentLoaded", () => {
  const adminBox = document.getElementById("ayudaAdmin");
  const userBox = document.getElementById("ayudaUser");

  // --- Acordeón: solo uno abierto a la vez ---
  const acordeon = () => {
    const accs = document.querySelectorAll(".help-acc");
    if (!accs.length) return;

    accs.forEach(acc => {
      acc.addEventListener("toggle", () => {
        if (!acc.open) return;
        accs.forEach(other => {
          if (other !== acc) other.open = false;
        });
      });
    });
  };

  // Por defecto mostramos usuario (por si el fetch hace la gracia)
  const showUser = () => {
    if (adminBox) adminBox.style.display = "none";
    if (userBox) userBox.style.display = "block";
    // Re-inicializamos (por si cambia el DOM visible)
    acordeon();
  };

  const showAdmin = () => {
    if (userBox) userBox.style.display = "none";
    if (adminBox) adminBox.style.display = "block";
    acordeon();
  };

  showUser();

  fetch("../php/session_info.php", { method: "GET", credentials: "include" })
    .then(r => r.json())
    .then(data => {
      if (data.logged === true && data.rol === "admin") {
        showAdmin();
      } else {
        showUser();
      }
    })
    .catch(() => {
      showUser();
    });
});
