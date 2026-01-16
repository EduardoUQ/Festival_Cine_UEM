<?php
session_start();
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// ID por POST
if (!isset($_POST["id"])) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Falta el id"]);
    exit;
}

$id = (int)$_POST["id"];
if ($id <= 0) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "ID inválido"]);
    exit;
}

$sql = "DELETE FROM premio WHERE id = ?";
$stmt = $conexion->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Error preparando la consulta"]);
    exit;
}

$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(["status" => "success", "message" => "Premio eliminado"]);
    } else {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Premio no encontrado"]);
    }
} else {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Error al eliminar",
        "error" => $stmt->error
    ]);
}
