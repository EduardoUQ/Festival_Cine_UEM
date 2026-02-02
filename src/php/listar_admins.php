<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin" || !isset($_SESSION["id"])) {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Solo super_admin
if (!isset($_SESSION["super_admin"]) || $_SESSION["super_admin"] != true) {
    echo json_encode(["status" => "error", "message" => "No autorizado (super_admin requerido)"]);
    exit;
}

$miId = (int)$_SESSION["id"];

$sql = "SELECT id, dni, email, nombre_apellidos, super_admin
        FROM admin
        WHERE id <> ?
        ORDER BY id DESC";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando consulta"]);
    exit;
}

$stmt->bind_param("i", $miId);
$stmt->execute();
$res = $stmt->get_result();

$admins = [];
while ($row = $res->fetch_assoc()) {
    $row["id"] = (int)$row["id"];
    $row["super_admin"] = (bool)$row["super_admin"];
    $admins[] = $row;
}

$stmt->close();
$conexion->close();

echo json_encode(["status" => "success", "admins" => $admins]);
