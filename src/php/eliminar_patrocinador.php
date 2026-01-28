<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

$id = isset($_POST["id"]) ? (int)$_POST["id"] : 0;
if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "ID inválido"]);
    exit;
}

// 1) Obtener logo_url
$stmt = $conexion->prepare("SELECT logo_url FROM patrocinador WHERE id = ?");
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando la consulta"]);
    exit;
}
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
    echo json_encode(["status" => "error", "message" => "Patrocinador no encontrado"]);
    exit;
}

$logo_url = $row["logo_url"] ?? "";

// 2) Borrar de BBDD
$stmtDel = $conexion->prepare("DELETE FROM patrocinador WHERE id = ?");
if (!$stmtDel) {
    echo json_encode(["status" => "error", "message" => "Error preparando el borrado"]);
    exit;
}
$stmtDel->bind_param("i", $id);

if (!$stmtDel->execute()) {
    echo json_encode(["status" => "error", "message" => "No se pudo borrar el patrocinador"]);
    exit;
}


// 3) Borrar archivo físico (si procede)
if ($logo_url) {

    // Normalizamos (quitamos \ y ../ inicial si existe)
    $logo_url_norm = str_replace("\\", "/", $logo_url);
    $logo_url_norm = preg_replace('#^(\.\./)+#', '', $logo_url_norm); // quita ../ al principio
    $logo_url_norm = ltrim($logo_url_norm, '/'); // quita / inicial

    // Permitimos borrar SOLO dentro de estas carpetas
    $permitidas = [
        "uploads/patrocinadores/",
        "img/"
    ];

    $esPermitida = false;
    foreach ($permitidas as $prefijo) {
        if (strpos($logo_url_norm, $prefijo) === 0) {
            $esPermitida = true;
            break;
        }
    }

    if ($esPermitida) {
        $rutaFisica = __DIR__ . "/../" . $logo_url_norm; // src/php -> src/...

        if (file_exists($rutaFisica)) {
            @unlink($rutaFisica);
        }
    }
}


echo json_encode(["status" => "success", "message" => "Patrocinador eliminado correctamente"]);
