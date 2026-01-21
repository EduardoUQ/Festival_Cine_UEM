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
$nombre    = trim($_POST['nombre'] ?? "");
$id        = isset($_POST['id']) ? (int) $_POST['id'] : null;

/* =========================
   VALIDACIONES GENERALES
========================= */
if (!$accion || $nombre === "") {
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
$rutaFisica = __DIR__ . "/../uploads/patrocinadores/";
$rutaWeb    = "uploads/patrocinadores/";

// crear carpeta si no existe
if (!is_dir($rutaFisica)) {
    mkdir($rutaFisica, 0777, true);
}

/* =========================
   FUNCIÓN SUBIR IMAGEN
========================= */
function subirImagen($file, $tiposPermitidos, $maxSize, $rutaFisica, $rutaWeb, $nombre)
{
    if (!in_array($file['type'], $tiposPermitidos)) {
        return ["error" => "Formato de imagen no permitido"];
    }

    if ($file['size'] > $maxSize) {
        return ["error" => "La imagen supera los 2MB"];
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $nombre = "patrocinador_" . $nombre . "." . $ext;

    if (!move_uploaded_file($file['tmp_name'], $rutaFisica . $nombre)) {
        return ["error" => "Error al subir la imagen"];
    }

    return ["ok" => $rutaWeb . $nombre];
}

/* =========================
   CREAR PATROCINADOR
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
        $rutaWeb,
        $nombre
    );

    if (isset($resultado['error'])) {
        echo json_encode([
            "status" => "error",
            "message" => $resultado['error']
        ]);
        exit;
    }

    $sql = "INSERT INTO patrocinador (nombre, logo_url, id_admin)
            VALUES (?, ?, ?)";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
        "ssi",
        $nombre,
        $resultado['ok'],
        $id_admin
    );

    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "message" => "Patrocinador agragado correctamente"
    ]);
    exit;
}

/* =========================
   EDITAR PATROCINADOR
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
    $stmt = $conexion->prepare("SELECT logo_url FROM patrocinador WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $res = $stmt->get_result();
    $patrocinador = $res->fetch_assoc();

    if (!$patrocinador) {
        echo json_encode([
            "status" => "error",
            "message" => "Patrocinador no encontrado"
        ]);
        exit;
    }

    // Pasos para obtener el nombre y comparar si se cambia el nombre pero no se sube imagen
    $logoActual = $patrocinador['logo_url'];
    $imagenFinal = $logoActual;

    $nombreArchivoActual = basename($logoActual);
    $ext = pathinfo($nombreArchivoActual, PATHINFO_EXTENSION);

    $nuevoNombreArchivo = "patrocinador_" . $nombre . "." . $ext;
    $nuevaRutaWeb = $rutaWeb . $nuevoNombreArchivo;
    $nuevaRutaFisica = $rutaFisica . $nuevoNombreArchivo;

    $imagenFinal = $patrocinador['logo_url'];

    // CASO 1: NO hay imagen nueva, pero el nombre cambia
    if (!isset($_FILES['imagen'])) {

        $rutaFisicaActual = $rutaFisica . basename($imagenFinal);

        if (file_exists($rutaFisicaActual)) {

            // Solo renombrar si el nombre realmente cambia
            if ($imagenFinal !== $nuevaRutaWeb) {

                rename($rutaFisicaActual, $nuevaRutaFisica);
                $imagenFinal = $nuevaRutaWeb;
            }
        }
    }

    // Si se sube nueva imagen
    if (isset($_FILES['imagen'])) {

        $resultado = subirImagen(
            $_FILES['imagen'],
            $tiposPermitidos,
            $maxSize,
            $rutaFisica,
            $rutaWeb,
            $nombre
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

    $sql = "UPDATE patrocinador 
            SET nombre = ?, logo_url = ?
            WHERE id = ?";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
        "ssi",
        $nombre,
        $imagenFinal,
        $id
    );

    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "message" => "Patrocinador actualizado correctamente"
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
