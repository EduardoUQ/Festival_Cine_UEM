document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    document.body.innerHTML =
      "<p style='color:white;padding:20px'>Falta el id de la noticia.</p>";
    return;
  }

  fetch("../php/detalle_noticia_publico.php?id=" + encodeURIComponent(id))
    .then((r) => r.json())
    .then((resp) => {
      if (!resp || resp.status !== "ok") {
        document.body.innerHTML =
          "<p style='color:white;padding:20px'>Noticia no encontrada.</p>";
        return;
      }

      const n = resp.data;

      const elTitulo = document.getElementById("noticia_titulo");
      const elFecha = document.getElementById("noticia_fecha");
      const elImg = document.getElementById("noticia_img");
      const elCont = document.getElementById("noticia_contenido");

      if (elTitulo) elTitulo.textContent = n.titulo || "";
      if (elFecha) elFecha.textContent = n.fecha || "";

      if (elImg) {
        const urlImg = (n.imagen_url || "").trim();
        elImg.src = urlImg ? "../" + urlImg : "../img/noticia1.png";
        elImg.alt = n.titulo || "Noticia";
      }

      if (elCont) elCont.textContent = n.contenido || "";
    })
    .catch((e) => {
      console.error(e);
      document.body.innerHTML =
        "<p style='color:white;padding:20px'>Error cargando noticia.</p>";
    });
});
