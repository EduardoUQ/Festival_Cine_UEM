<?php
session_start();
include("conexion.php");
header("Content-Type: application/json; charset=utf-8");

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Obtener gala activa
$sql = "SELECT id FROM gala WHERE activa = 1";
$stmt = $conexion->prepare($sql);
$stmt->execute();
$res = $stmt->get_result();
$gala = $res->fetch_assoc();

if (!$gala) {
    echo json_encode(["status" => "error", "message" => "No hay gala activa"]);
    exit;
}

$id_gala = $gala["id"];

// Validar archivo
if (!isset($_FILES["imagen"])) {
    echo json_encode(["status" => "error", "message" => "No se recibió archivo"]);
    exit;
}

$file = $_FILES["imagen"];
$nombre = time() . "_" . basename($file["name"]);
$ruta = "../uploads/galeria/" . $nombre;

// Crear carpeta si no existe
if (!is_dir("../uploads/galeria")) {
    mkdir("../uploads/galeria", 0777, true);
}

// Mover archivo
if (!move_uploaded_file($file["tmp_name"], $ruta)) {
    echo json_encode(["status" => "error", "message" => "Error al guardar archivo"]);
    exit;
}

// Guardar en BD
$sql_insert = "INSERT INTO gala_media (id_gala, media_url) VALUES (?, ?)";
$stmt_insert = $conexion->prepare($sql_insert);
$stmt_insert->bind_param("is", $id_gala, $ruta);
$stmt_insert->execute();

echo json_encode([
    "status" => "success",
    "id" => $conexion->insert_id,
    "url" => $ruta
]);
exit;
