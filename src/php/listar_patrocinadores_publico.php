<?php
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

$sql = "SELECT nombre, logo_url, color_hex, web_url
        FROM patrocinador
        ORDER BY id ASC";

$result = $conexion->query($sql);

$patrocinadores = [];
while ($row = $result->fetch_assoc()) {
    $patrocinadores[] = $row;
}

echo json_encode($patrocinadores);
