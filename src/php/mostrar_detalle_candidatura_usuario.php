<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo usuarios


if (
    !isset($_SESSION["rol"]) ||
    ($_SESSION["rol"] !== "usuario" && $_SESSION["rol"] !== "admin")
) {

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

$sql = "SELECT *
        FROM candidatura
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
    echo json_encode(["status" => "error", "message" => "Candidatura no encontrada"]);
    exit;
}

echo json_encode(["status" => "success", "candidatura" => $row]);
