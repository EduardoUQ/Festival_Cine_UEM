<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

$sql = "
    SELECT 
        c.id,
        c.titulo,
        c.categoria,
        c.estado,
        u.nombre_apellidos AS participante
    FROM candidatura c
    JOIN usuario u ON c.id_usuario = u.id
";

$result = $conexion->query($sql);

$candidaturas = [];
while ($row = $result->fetch_assoc()) {
    $candidaturas[] = $row;
}

echo json_encode($candidaturas);
