<?php
session_start();
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// ID por POST
if (!isset($_POST["id"])) {
    echo json_encode(["status" => "error", "message" => "Falta el id"]);
    exit;
}

$id = (int)$_POST["id"];
if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "ID inválido"]);
    exit;
}

$sql = "DELETE FROM patrocinador WHERE id = ?";
$stmt = $conexion->prepare($sql);

if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando la consulta"]);
    exit;
}

$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(["status" => "success", "message" => "Patrocinador eliminado"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Patrocinador no encontrado"]);
    }
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Error al eliminar",
        "error" => $stmt->error
    ]);
}
