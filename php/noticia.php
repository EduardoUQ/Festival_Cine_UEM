<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Recogemos el id del admin de la sesión
$id_admi = 1;


// Verificamos que se haya llamado a la función para procesar los datos
if (isset($_POST['funcion'])) {
    // Obtenemos los datos del formulario
    $titulo = $_POST['titulo'];
    $contenido = $_POST['contenido'];
    $imagen = $_FILES['imagen'];
    $fecha = $_POST['fecha'];

    // Validaciones básicas
    if ($titulo === '' || $contenido === '' || $fecha === '' || !$imagen) {
        echo json_encode([
            "status" => "error",
            "message" => "Todos los campos son obligatorios"
        ]);
        exit;
    }
    // Validar imagen
    $tiposPermitidos = ['image/jpeg', 'image/png'];
    $maxSize = 2 * 1024 * 1024;

    if (!in_array($imagen['type'], $tiposPermitidos)) {
        echo json_encode([
            "status" => "error",
            "message" => "Formato de imagen no permitido"
        ]);
        exit;
    }

    if ($imagen['size'] > $maxSize) {
        echo json_encode([
            "status" => "error",
            "message" => "La imagen supera los 2MB"
        ]);
        exit;
    }

    // Crear nombre único
    $extension = pathinfo($imagen['name'], PATHINFO_EXTENSION);
    $nombre_imagen = uniqid("noticia_") . "." . $extension;
    $ruta_destino = "../uploads/noticias/" . $nombre_imagen;

    // Mover imagen
    if (!move_uploaded_file($imagen['tmp_name'], $ruta_destino)) {
        echo json_encode([
            "status" => "error",
            "message" => "Error al subir la imagen"
        ]);
        exit;
    }

    // Insertar en BD
    $sql_insertar = "INSERT INTO noticia (titulo, contenido, imagen_url, fecha, id_admin) VALUES (?, ?, ?, ?, ?)";
    $stmt = $conexion->prepare($sql_insertar);
    $stmt->bind_param("ssssi", $titulo, $contenido, $ruta_destino, $fecha, $id_admi);
    $stmt->execute();
    echo json_encode([
        "status" => "success",
        "message" => "Noticia publicada correctamente"
    ]);
}

$conexion->close();
