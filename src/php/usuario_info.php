<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require_once "conexion.php";

function out($arr) {
    echo json_encode($arr);
    exit;
}

if (!isset($_SESSION["id"], $_SESSION["rol"]) || $_SESSION["rol"] !== "usuario") {
    out(["status" => "error", "message" => "No autorizado"]);
}

$id = (int)$_SESSION["id"];
if ($id <= 0) out(["status" => "error", "message" => "Sesión inválida"]);

$stmt = $conexion->prepare("SELECT id, nombre_apellidos, email, anio_graduacion FROM usuario WHERE id = ? LIMIT 1");
if (!$stmt) out(["status" => "error", "message" => "Error preparando consulta"]);

$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();
$stmt->close();

if (!$row) out(["status" => "error", "message" => "Usuario no encontrado"]);

out([
    "status" => "success",
    "id" => (int)$row["id"],
    "nombre_apellidos" => $row["nombre_apellidos"],
    "email" => $row["email"],
    "anio_graduacion" => (int)$row["anio_graduacion"]
]);
