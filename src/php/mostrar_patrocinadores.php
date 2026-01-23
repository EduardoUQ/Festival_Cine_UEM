<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Hacemos la consulta de la información del patrocinador
$sql = "SELECT id, nombre, logo_url, color_hex, web_url FROM patrocinador";
$result = $conexion->query($sql);

// Lo enviamos con un array al JS
$patrocinadores = [];
while ($row = $result->fetch_assoc()) {
    $patrocinadores[] = $row;
}

echo json_encode($patrocinadores);
