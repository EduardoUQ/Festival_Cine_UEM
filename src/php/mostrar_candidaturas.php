<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo usuarios
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Recogemos el id del usuario logueado
$id_admi = (int) $_SESSION['id'];

// Hacemos la consulta de la información de la candidatura del usuario
$sql = "SELECT * FROM candidatura";
$result = $conexion->query($sql);

// Lo enviamos con un array al JS
$candidaturas = [];
while ($row = $result->fetch_assoc()) {
    $candidaturas[] = $row;
}

echo json_encode($candidaturas);
