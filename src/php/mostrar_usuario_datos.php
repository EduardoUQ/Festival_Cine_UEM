<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo usuarios
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "usuario") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Recogemos el id del usuario logueado
$id_usuario = (int) $_SESSION['id'];

// Hacemos la consulta de la información de los datos del usuario
$sql = "SELECT * FROM usuario WHERE id = ?";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando consulta"]);
    exit;
}

$stmt->bind_param("i", $id_usuario);

if (!$stmt->execute()) {
    echo json_encode(["status" => "error", "message" => "Error ejecutando consulta"]);
    exit;
}

$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
    echo json_encode(["status" => "error", "message" => "Datos no encontrados"]);
    exit;
}

echo json_encode(["status" => "success", "datos" => $row]);
