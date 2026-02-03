document.addEventListener("DOMContentLoaded", () => {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');

    console.log("JS cargado, imágenes encontradas:", galleryItems.length);
    // Abrir
    galleryItems.forEach(img => {

        img.addEventListener('click', () => {
            console.log("Click en imagen:", img.src);
            lightboxImg.src = img.src;
            lightbox.style.display = 'flex';
        });
    });

    // Cerrar
    lightbox.addEventListener('click', () => {
        lightbox.style.display = 'none';
    });
});