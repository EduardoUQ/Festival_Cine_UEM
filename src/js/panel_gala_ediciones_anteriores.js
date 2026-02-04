const previousSection = document.querySelector(".previous-editions");

fetch("../php/cargar_ediciones.php")
    .then(r => r.json())
    .then(data => {
        if (data.status !== "success") return;

        data.ediciones.forEach(ed => {
            const card = document.createElement("div");
            card.classList.add("edition-card");

            card.innerHTML = `
                <div class="edition-year">${ed.anio}</div>

                <div class="edition-stats">
                    <div class="stat">
                        <i class="fa-solid fa-users"></i>
                        <span>${ed.total_participantes}</span>
                        <p>participantes</p>
                    </div>

                    <div class="stat">
                        <i class="fa-solid fa-award"></i>
                        <span>${ed.total_ganadores}</span>
                        <p>premios</p>
                    </div>
                </div>

                <a href="edicion_anterior.html?id=${ed.id}" class="btn-details">
                    <i class="fa-solid fa-eye"></i>
                    Ver<br>detalles
                </a>
            `;

            previousSection.appendChild(card);
        });
    });
