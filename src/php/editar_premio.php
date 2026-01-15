<?php
session_start();
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

if (!isset($_GET["id"])) {
    echo json_encode(["status" => "error", "message" => "Falta el id"]);
    exit;
}

$id = (int)$_GET["id"];
if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "ID inválido"]);
    exit;
}

$sql = "SELECT id, categoria, puesto, descripcion, dotacion, activa
        FROM premio
        WHERE id = ?";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando consulta"]);
    exit;
}

$stmt->bind_param("i", $id);

if (!$stmt->execute()) {
    echo json_encode(["status" => "error", "message" => "Error ejecutando consulta"]);
    exit;
}

$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
    echo json_encode(["status" => "error", "message" => "Premio no encontrado"]);
    exit;
}

echo json_encode(["status" => "success", "premio" => $row]);
