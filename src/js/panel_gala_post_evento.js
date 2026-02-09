// Varibales del resumen de la gala
const yearEdicion = document.getElementById("yearEdicion")
const totalCortos = document.getElementById("totalCortos")
const totalPremios = document.getElementById("totalPremios")
const totalGanadores = document.getElementById("totalGanadores")

// Pintamos los cards del resumen
fetch("../php/mostrar_datos_post_evento.php")
    .then(r => r.json())
    .then(data => {
        yearEdicion.textContent = data.year || "—";
        totalCortos.textContent = data.total_cortos || "—";
        totalPremios.textContent = data.total_premios || "—";
        totalGanadores.textContent = data.total_ganadores || "—";
    })
    .catch(err => console.error("Error cargando resumen:", err));


// Mostramos los ganadores de cada categoría
const winnersSection = document.getElementById("winnersSection");

fetch("../php/mostrar_ganadores.php")
    .then(r => r.json())
    .then(data => {

        if (data.status !== "success") return;

        const categorias = data.categorias;

        Object.keys(categorias).forEach(nombreCategoria => {

            const box = document.createElement("div");
            box.classList.add("category-box");

            const h3 = document.createElement("h3");
            h3.textContent = nombreCategoria;
            box.appendChild(h3);

            const tabla = document.createElement("table");

            // Cabecera según tipo
            let thead = "<thead><tr>";

            if (nombreCategoria === "ESPECIAL") {
                thead += `
                    <th>Puesto</th>
                    <th>Nombre y apellidos</th>
                `;
            } else {
                thead += `
                    <th>Puesto</th>
                    <th>Título del cortometraje</th>
                    <th>Participante</th>
                    <th>Dotación</th>
                `;
            }

            thead += "</tr></thead>";
            tabla.innerHTML = thead;

            const tbody = document.createElement("tbody");

            categorias[nombreCategoria].forEach(g => {

                const tr = document.createElement("tr");

                if (nombreCategoria === "ESPECIAL") {
                    tr.innerHTML = `
                        <td>${g.puesto}</td>
                        <td>${g.nombre}</td>
                    `;
                } else {
                    tr.innerHTML = `
                        <td>${g.puesto}</td>
                        <td>${g.titulo}</td>
                        <td>${g.participante}</td>
                        <td>${g.dotacion}</td>
                    `;
                }

                tbody.appendChild(tr);
            });

            tabla.appendChild(tbody);
            box.appendChild(tabla);
            winnersSection.appendChild(box);
        });
    })
    .catch(err => console.error("Error cargando ganadores:", err));

// Mostrando la galería de la gala

const galleryInput = document.getElementById('galleryInput');
const galleryGrid = document.getElementById('galleryGrid');
const galleryAdd = document.getElementById('galleryAdd');

// Cargar imágenes al entrar
fetch("../php/cargar_galeria.php")
    .then(r => r.json())
    .then(data => {
        if (data.status !== "success") return;

        data.imagenes.forEach(img => {
            agregarImagen(img.id, img.media_url);
        });
    });

// Subir imagen
galleryInput.addEventListener('change', () => {
    const file = galleryInput.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("imagen", file);

    fetch("../php/subir_galeria.php", {
        method: "POST",
        body: formData
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                agregarImagen(data.id, data.url);
            }
        });

    galleryInput.value = "";
});

// Crear elemento visual
function agregarImagen(id, url) {
    const div = document.createElement("div");
    div.className = "gallery-item";

    div.innerHTML = `
        <img src="${url}">
        <button class="delete-btn" data-id="${id}">✕</button>
    `;

    galleryGrid.insertBefore(div, galleryAdd);

    div.querySelector(".delete-btn").addEventListener("click", borrarImagen);
}

// Borrar imagen
function borrarImagen(e) {
    const id = e.target.dataset.id;

    fetch("../php/borrar_galeria.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "id=" + id
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                e.target.parentElement.remove();
            }
        });
}

galleryAdd.addEventListener("click", () => galleryInput.click());

/* ============================
   DRAG & DROP PARA GALERÍA
   ============================ */

// Evitar que el navegador abra la imagen
["dragenter", "dragover", "dragleave", "drop"].forEach(eventName => {
    galleryGrid.addEventListener(eventName, e => e.preventDefault());
    galleryGrid.addEventListener(eventName, e => e.stopPropagation());
});

// Visual feedback
galleryGrid.addEventListener("dragover", () => {
    galleryGrid.classList.add("dragover");
});

galleryGrid.addEventListener("dragleave", () => {
    galleryGrid.classList.remove("dragover");
});

galleryGrid.addEventListener("drop", e => {
    galleryGrid.classList.remove("dragover");

    const files = Array.from(e.dataTransfer.files);

    files.forEach(file => {
        if (!file.type.startsWith("image/")) return;

        const formData = new FormData();
        formData.append("imagen", file);

        fetch("../php/subir_galeria.php", {
            method: "POST",
            body: formData
        })
            .then(r => r.json())
            .then(data => {
                if (data.status === "success") {
                    agregarImagen(data.id, data.url);
                }
            });
    });
});


// Archivar una edición 
const archivarBtn = document.getElementById("archivar");
const confirmacion = document.getElementById("confirmacion");

archivarBtn.disabled = true;

// Escuchar cambios del checkbox
confirmacion.addEventListener("change", () => {
    archivarBtn.disabled = !confirmacion.checked;
});

archivarBtn.addEventListener("click", () => {

    fetch("../php/archivar_gala.php", {
        method: "POST"
    })
        .then(r => r.json())
        .then(data => {
            if (data.status === "success") {
                alert("La gala ha sido archivada correctamente.");
                window.location.href = data.redirect;
            } else {
                alert("Error: " + data.message);
            }
        })
        .catch(err => console.error("Error archivando gala:", err));
});