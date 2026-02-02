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
$id = isset($_POST["id"]) ? (int)$_POST["id"] : 0;

if ($id <= 0) {
    echo json_encode(["status" => "error", "message" => "ID inválido"]);
    exit;
}

if ($id === $miId) {
    echo json_encode(["status" => "error", "message" => "No puedes borrarte a ti mismo"]);
    exit;
}

/* =========================
   COMPROBAR SI EL OBJETIVO ES SUPER_ADMIN
   Regla:
   - Si objetivo NO es super_admin => se puede borrar
   - Si objetivo SÍ es super_admin => solo se puede borrar si miId < idObjetivo
========================= */
$stmtCheck = $conexion->prepare("SELECT super_admin FROM admin WHERE id = ? LIMIT 1");
if (!$stmtCheck) {
    echo json_encode(["status" => "error", "message" => "Error preparando comprobación"]);
    exit;
}
$stmtCheck->bind_param("i", $id);
$stmtCheck->execute();
$res = $stmtCheck->get_result();
$row = $res->fetch_assoc();
$stmtCheck->close();

if (!$row) {
    $conexion->close();
    echo json_encode(["status" => "error", "message" => "Admin no encontrado"]);
    exit;
}

$objetivoSuper = ((int)$row["super_admin"] === 1);

if ($objetivoSuper && !($miId < $id)) {
    $conexion->close();
    echo json_encode([
        "status" => "error",
        "message" => "No puedes borrar a un super_admin más antiguo o de igual antigüedad"
    ]);
    exit;
}

/* =========================
   BORRADO
========================= */
$stmt = $conexion->prepare("DELETE FROM admin WHERE id = ? LIMIT 1");
if (!$stmt) {
    $conexion->close();
    echo json_encode(["status" => "error", "message" => "Error preparando borrado"]);
    exit;
}
$stmt->bind_param("i", $id);

$ok = $stmt->execute();
$affected = $stmt->affected_rows;

$stmt->close();
$conexion->close();

if (!$ok || $affected === 0) {
    echo json_encode(["status" => "error", "message" => "No se pudo borrar (¿existe el admin?)"]);
    exit;
}

echo json_encode(["status" => "success", "message" => "Admin eliminado"]);
