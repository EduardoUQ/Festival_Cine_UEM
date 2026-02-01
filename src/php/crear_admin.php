<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Solo super_admin
if (!isset($_SESSION["super_admin"]) || $_SESSION["super_admin"] != true) {
    echo json_encode(["status" => "error", "message" => "No autorizado (super_admin requerido)"]);
    exit;
}

$dni = isset($_POST["dni"]) ? trim($_POST["dni"]) : "";
$email = isset($_POST["email"]) ? trim($_POST["email"]) : "";
$nombre = isset($_POST["nombre_apellidos"]) ? trim($_POST["nombre_apellidos"]) : "";
$super = isset($_POST["super_admin"]) ? (int)$_POST["super_admin"] : 0;
$super = ($super === 1) ? 1 : 0;

if ($dni === "" || $email === "" || $nombre === "") {
    echo json_encode(["status" => "error", "message" => "Faltan campos"]);
    exit;
}

// Password por defecto
$hash = password_hash("12345", PASSWORD_DEFAULT);

$sql = "INSERT INTO admin (dni, email, passwd_hash, nombre_apellidos, super_admin)
        VALUES (?, ?, ?, ?, ?)";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando inserción"]);
    exit;
}

$stmt->bind_param("ssssi", $dni, $email, $hash, $nombre, $super);

$ok = $stmt->execute();
$err = $stmt->error;

$stmt->close();
$conexion->close();

if (!$ok) {
    // Si quieres, aquí podríamos distinguir duplicados por $err, pero lo dejo simple
    echo json_encode(["status" => "error", "message" => "No se pudo crear el admin (¿dni/email duplicado?)"]);
    exit;
}

echo json_encode(["status" => "success", "message" => "Admin creado correctamente"]);
