<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/* =========================
   SEGURIDAD BÁSICA
========================= */
if (!isset($_SESSION['id'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Sesión no válida"
    ]);
    exit;
}

$id_admin = (int) $_SESSION['id'];

/* =========================
   DATOS COMUNES
========================= */
$accion    = $_POST['accion'] ?? null;
$titulo    = trim($_POST['titulo'] ?? "");
$contenido = trim($_POST['contenido'] ?? "");
$fecha     = $_POST['fecha'] ?? "";
$id        = isset($_POST['id']) ? (int) $_POST['id'] : null;

/* =========================
   VALIDACIONES GENERALES
========================= */
if (!$accion || $titulo === "" || $contenido === "" || $fecha === "") {
    echo json_encode([
        "status" => "error",
        "message" => "Todos los campos son obligatorios"
    ]);
    exit;
}

/* =========================
   CONFIG IMÁGENES
========================= */
$tiposPermitidos = ["image/jpeg", "image/png"];
$maxSize = 2 * 1024 * 1024;

// rutas
$rutaFisica = __DIR__ . "/../uploads/noticias/";
$rutaWeb    = "/Festival_Cine_UEM/Festival_Cine_UEM/src/uploads/noticias/";

// crear carpeta si no existe
if (!is_dir($rutaFisica)) {
    mkdir($rutaFisica, 0777, true);
}

/* =========================
   FUNCIÓN SUBIR IMAGEN
========================= */
function subirImagen($file, $tiposPermitidos, $maxSize, $rutaFisica, $rutaWeb)
{
    if (!in_array($file['type'], $tiposPermitidos)) {
        return ["error" => "Formato de imagen no permitido"];
    }

    if ($file['size'] > $maxSize) {
        return ["error" => "La imagen supera los 2MB"];
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $nombre = uniqid("noticia_") . "." . $ext;

    if (!move_uploaded_file($file['tmp_name'], $rutaFisica . $nombre)) {
        return ["error" => "Error al subir la imagen"];
    }

    return ["ok" => $rutaWeb . $nombre];
}

/* =========================
   CREAR NOTICIA
========================= */
if ($accion === "crear") {

    if (!isset($_FILES['imagen'])) {
        echo json_encode([
            "status" => "error",
            "message" => "La imagen es obligatoria"
        ]);
        exit;
    }

    $resultado = subirImagen(
        $_FILES['imagen'],
        $tiposPermitidos,
        $maxSize,
        $rutaFisica,
        $rutaWeb
    );

    if (isset($resultado['error'])) {
        echo json_encode([
            "status" => "error",
            "message" => $resultado['error']
        ]);
        exit;
    }

    $sql = "INSERT INTO noticia (titulo, contenido, imagen_url, fecha, id_admin)
            VALUES (?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
        "ssssi",
        $titulo,
        $contenido,
        $resultado['ok'],
        $fecha,
        $id_admin
    );

    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "message" => "Noticia creada correctamente"
    ]);
    exit;
}

/* =========================
   EDITAR NOTICIA
========================= */
if ($accion === "editar") {

    if (!$id) {
        echo json_encode([
            "status" => "error",
            "message" => "ID inválido"
        ]);
        exit;
    }

    // Obtener imagen actual
    $stmt = $conexion->prepare("SELECT imagen_url FROM noticia WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    $noticia = $res->fetch_assoc();

    if (!$noticia) {
        echo json_encode([
            "status" => "error",
            "message" => "Noticia no encontrada"
        ]);
        exit;
    }

    $imagenFinal = $noticia['imagen_url'];

    // Si se sube nueva imagen
    if (isset($_FILES['imagen'])) {

        $resultado = subirImagen(
            $_FILES['imagen'],
            $tiposPermitidos,
            $maxSize,
            $rutaFisica,
            $rutaWeb
        );

        if (isset($resultado['error'])) {
            echo json_encode([
                "status" => "error",
                "message" => $resultado['error']
            ]);
            exit;
        }

        // Borrar imagen anterior
        $rutaAntigua = $_SERVER['DOCUMENT_ROOT'] . $imagenFinal;
        if (file_exists($rutaAntigua)) {
            unlink($rutaAntigua);
        }

        $imagenFinal = $resultado['ok'];
    }

    $sql = "UPDATE noticia 
            SET titulo = ?, contenido = ?, imagen_url = ?, fecha = ?
            WHERE id = ?";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
        "ssssi",
        $titulo,
        $contenido,
        $imagenFinal,
        $fecha,
        $id
    );

    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "message" => "Noticia actualizada correctamente"
    ]);
    exit;
}

/* =========================
   ACCIÓN NO VÁLIDA
========================= */
echo json_encode([
    "status" => "error",
    "message" => "Acción no válida"
]);
