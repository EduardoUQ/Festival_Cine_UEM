<?php
session_start();
include("conexion.php");
header("Content-Type: application/json; charset=utf-8");

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

$id = $_POST["id"] ?? null;

if (!$id) {
    echo json_encode(["status" => "error", "message" => "ID no recibido"]);
    exit;
}

// Obtener ruta
$sql = "SELECT media_url FROM gala_media WHERE id = ?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
    echo json_encode(["status" => "error", "message" => "Imagen no encontrada"]);
    exit;
}

$ruta = $row["media_url"];

// Borrar archivo
if (file_exists($ruta)) {
    unlink($ruta);
}

// Borrar BD
$sql_del = "DELETE FROM gala_media WHERE id = ?";
$stmt_del = $conexion->prepare($sql_del);
$stmt_del->bind_param("i", $id);
$stmt_del->execute();

echo json_encode(["status" => "success"]);
exit;
