<?php
session_start();
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

// (Opcional pero recomendado) Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Filtro por activa: "", "1" o "0"
$activa = isset($_GET["activa"]) ? trim($_GET["activa"]) : "";

// Query base
$sql = "SELECT id, categoria, puesto, dotacion, descripcion, activa
        FROM premio";

$params = [];
$types = "";

// Si viene filtro "activa"
if ($activa === "0" || $activa === "1") {
    $sql .= " WHERE activa = ?";
    $params[] = (int)$activa;
    $types .= "i";
}

// Añadimos a la query el orden para que quede bonito en el pintado
$sql .= " ORDER BY categoria ASC, puesto ASC";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Error preparando consulta"]);
    exit;
}

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$premios = [];
while ($row = $result->fetch_assoc()) {
    $premios[] = $row;
}

echo json_encode($premios);
