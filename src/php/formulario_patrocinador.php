<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/* =========================
   SEGURIDAD BÁSICA
========================= */
if (!isset($_SESSION['id']) || !isset($_SESSION['rol']) || $_SESSION['rol'] !== "admin") {
    echo json_encode([
        "status" => "error",
        "message" => "No autorizado"
    ]);
    exit;
}

$id_admin = (int) $_SESSION['id'];

/* =========================
   DATOS COMUNES
========================= */
$accion   = $_POST['accion'] ?? null;
$nombre   = trim($_POST['nombre'] ?? "");
$id       = isset($_POST['id']) ? (int) $_POST['id'] : null;

// NUEVOS CAMPOS
$color_hex = strtoupper(trim($_POST['color_hex'] ?? "")); // sin #
$web_url   = trim($_POST['web_url'] ?? "");

/* =========================
   VALIDACIONES GENERALES
========================= */
if (!$accion || $nombre === "") {
    echo json_encode([
        "status" => "error",
        "message" => "El nombre y la acción son obligatorios"
    ]);
    exit;
}

// Color REQUIRED
if ($color_hex === "") {
    echo json_encode([
        "status" => "error",
        "message" => "El color es obligatorio"
    ]);
    exit;
}

if (!preg_match('/^[0-9A-F]{6}$/', $color_hex)) {
    echo json_encode([
        "status" => "error",
        "message" => "El color debe tener exactamente 6 caracteres hexadecimales (sin #). Ej: FFAACC"
    ]);
    exit;
}

// Web opcional
if ($web_url !== "") {
    // Si no tiene esquema, se lo ponemos
    if (!preg_match('/^https?:\/\//i', $web_url)) {
        $web_url = "https://" . $web_url;
    }

    if (!filter_var($web_url, FILTER_VALIDATE_URL)) {
        echo json_encode([
            "status" => "error",
            "message" => "La URL del patrocinador no tiene un formato válido"
        ]);
        exit;
    }
} else {
    $web_url = null; // NULL en BBDD
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

    $sql = "INSERT INTO patrocinador (nombre, logo_url, color_hex, web_url, id_admin)
            VALUES (?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Error preparando la consulta"]);
        exit;
    }

    $stmt->bind_param(
        "ssssi",
        $nombre,
        $resultado['ok'],
        $color_hex,
        $web_url,
        $id_admin
    );

    if (!$stmt->execute()) {
        echo json_encode(["status" => "error", "message" => "Error guardando el patrocinador"]);
        exit;
    }

    echo json_encode([
        "status" => "success",
        "message" => "Patrocinador agregado correctamente"
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
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Error preparando la consulta"]);
        exit;
    }

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

    $logoActual = $patrocinador['logo_url'];
    $imagenFinal = $logoActual;

    $nombreArchivoActual = basename($logoActual);
    $ext = pathinfo($nombreArchivoActual, PATHINFO_EXTENSION);

    $nuevoNombreArchivo = "patrocinador_" . $nombre . "." . $ext;
    $nuevaRutaWeb = $rutaWeb . $nuevoNombreArchivo;
    $nuevaRutaFisica = $rutaFisica . $nuevoNombreArchivo;

    // CASO 1: NO hay imagen nueva, pero el nombre cambia => renombrar archivo
    if (!isset($_FILES['imagen'])) {

        $rutaFisicaActual = $rutaFisica . basename($imagenFinal);

        if (file_exists($rutaFisicaActual)) {
            if ($imagenFinal !== $nuevaRutaWeb) {
                rename($rutaFisicaActual, $nuevaRutaFisica);
                $imagenFinal = $nuevaRutaWeb;
            }
        }
    }

    // CASO 2: Si se sube nueva imagen
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

        // Borrar imagen anterior (si existiera)
        $rutaAntigua = __DIR__ . "/../" . $imagenFinal;
        if (file_exists($rutaAntigua)) {
            unlink($rutaAntigua);
        }

        $imagenFinal = $resultado['ok'];
    }

    $sql = "UPDATE patrocinador 
            SET nombre = ?, logo_url = ?, color_hex = ?, web_url = ?
            WHERE id = ?";

    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Error preparando la consulta"]);
        exit;
    }

    $stmt->bind_param(
        "ssssi",
        $nombre,
        $imagenFinal,
        $color_hex,
        $web_url,
        $id
    );

    if (!$stmt->execute()) {
        echo json_encode(["status" => "error", "message" => "Error actualizando el patrocinador"]);
        exit;
    }

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
