<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

$sql = "SELECT DISTINCT categoria FROM premio WHERE puesto > 0 ORDER BY categoria ASC";
$result = $conexion->query($sql);

if (!$result) {
    echo json_encode(["status" => "error", "message" => "Error consultando categorías"]);
    exit;
}

$categorias = [];
while ($row = $result->fetch_assoc()) {
    $categorias[] = $row["categoria"];
}

echo json_encode(["status" => "success", "categorias" => $categorias]);
