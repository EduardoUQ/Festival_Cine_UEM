<?php
session_start();
include("conexion.php");
header("Content-Type: application/json; charset=utf-8");

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

// Obtener imágenes
$sql_img = "SELECT id, media_url FROM gala_media WHERE id_gala = ?";
$stmt_img = $conexion->prepare($sql_img);
$stmt_img->bind_param("i", $id_gala);
$stmt_img->execute();
$res_img = $stmt_img->get_result();

$imagenes = [];
while ($row = $res_img->fetch_assoc()) {
    $imagenes[] = $row;
}

echo json_encode([
    "status" => "success",
    "imagenes" => $imagenes
]);
exit;
