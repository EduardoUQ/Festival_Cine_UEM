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

/* =========================
   HELPERS
========================= */
function json_error($msg)
{
    echo json_encode(["status" => "error", "message" => $msg]);
    exit;
}

function getGalaActivaId($conexion)
{
    $res = $conexion->query("SELECT id FROM gala WHERE activa = TRUE LIMIT 1");
    if (!$res || $res->num_rows === 0) return null;
    $row = $res->fetch_assoc();
    return (int) $row["id"];
}

/* =========================
   DATOS COMUNES
========================= */
$nombre = trim($_POST['nombre'] ?? "");
$correo = trim($_POST['correo'] ?? "");
$numero = trim($_POST['numero'] ?? "");
$id_premio = (int) ($_POST['id_premio'] ?? 0);

/* =========================
   VALIDACIONES GENERALES
========================= */
if ($id_premio <= 0) {
    json_error("Premio honorífico inválido");
}

if ($nombre === "" || $correo === "" || $numero === "") {
    json_error("Todos los campos son obligatorios");
}

$id_gala = getGalaActivaId($conexion);
if (!$id_gala) {
    json_error("No hay gala activa");
}

// Validar que el premio es honorífico (puesto=0) y activo
$stmtP = $conexion->prepare("SELECT 1 FROM premio WHERE id = ? AND activa = TRUE AND puesto = 0 LIMIT 1");
$stmtP->bind_param("i", $id_premio);
$stmtP->execute();
$resP = $stmtP->get_result();
if (!$resP || $resP->num_rows === 0) {
    json_error("El premio no es honorífico o no está activo");
}

// Validar que no existe ya (id_gala,id_premio)
$stmtChk = $conexion->prepare("SELECT 1 FROM ganador_honorifico WHERE id_gala = ? AND id_premio = ? LIMIT 1");
$stmtChk->bind_param("ii", $id_gala, $id_premio);
$stmtChk->execute();
$resChk = $stmtChk->get_result();
if ($resChk && $resChk->num_rows > 0) {
    json_error("Este premio honorífico ya tiene un ganador asignado.");
}

/* =========================
   CONFIG VÍDEO
========================= */
$tiposPermitidos = ["video/mp4", "video/quicktime"];
$maxSize = 50 * 1024 * 1024;

// rutas
$rutaFisica = __DIR__ . "/../uploads/ganador_honorifico/";
$rutaWeb    = "uploads/ganador_honorifico/";

// crear carpeta si no existe
if (!is_dir($rutaFisica)) {
    mkdir($rutaFisica, 0777, true);
}

/* =========================
   FUNCIÓN SUBIR VIDEO
========================= */
function subir_video($file, $tiposPermitidos, $maxSize, $rutaFisica, $rutaWeb)
{
    if (!in_array($file['type'], $tiposPermitidos)) {
        return ["error" => "Formato de vídeo no permitido (solo MP4 o MOV)"];
    }

    if ($file['size'] > $maxSize) {
        return ["error" => "El vídeo supera los 50MB"];
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $nombre = uniqid("video_") . "." . ($ext ? $ext : "mp4");

    if (!move_uploaded_file($file['tmp_name'], $rutaFisica . $nombre)) {
        return ["error" => "Error al subir el vídeo"];
    }

    return ["ok" => $rutaWeb . $nombre];
}

/* =========================
   CREAR GANADOR HONORÍFICO
========================= */
if (!isset($_FILES['video'])) {
    json_error("El vídeo es obligatorio");
}

$resultado = subir_video(
    $_FILES['video'],
    $tiposPermitidos,
    $maxSize,
    $rutaFisica,
    $rutaWeb
);

if (isset($resultado['error'])) {
    json_error($resultado['error']);
}

$sql = "INSERT INTO ganador_honorifico (id_gala, id_premio, nombre_apellidos, email, telefono, video_url)
        VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conexion->prepare($sql);
$stmt->bind_param(
    "iissss",
    $id_gala,
    $id_premio,
    $nombre,
    $correo,
    $numero,
    $resultado['ok']
);

if (!$stmt->execute()) {
    json_error("Error guardando el ganador honorífico");
}

echo json_encode([
    "status" => "success",
    "message" => "Ganador honorífico asignado correctamente"
]);
exit;
