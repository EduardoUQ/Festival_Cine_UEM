<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/* =========================
   SEGURIDAD
========================= */
if (!isset($_SESSION['id'])) {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Sesión no válida"
    ]);
    exit;
}

/* =========================
   DATOS
========================= */
$accion = $_POST['accion'] ?? null;
$id_candidatura = isset($_POST['id']) ? (int) $_POST['id'] : 0;
$comentarios = trim($_POST['comentarios'] ?? "");
$estado = null;


/* =========================
   SEGÚN CANDIDATURA
========================= */
switch ($accion) {

    case "ACEPTADA":
        $estado = "ACEPTADA";
        $comentarios = "Tu candidatura ha sido aceptada";
        break;

    case "NOMINADA":
        $estado = "NOMINADA";
        $comentarios = "Tu candidatura ha sido nominada";
        break;

    case "SUBSANAR":
        $estado = "SUBSANAR";
        break;

    case "RECHAZADA":
        $estado = "RECHAZADA";
        break;

    default:
        echo json_encode(["status" => "error", "titulo" => "Acción cancelada", "message" => "Acción no válida"]);
        exit;
}

/* =========================
   EDITAR EL ESTADO DE LA CANDIDATURA
========================= */
$sql = "UPDATE candidatura SET estado = ?, comentarios = ? WHERE id = ?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("ssi", $estado, $comentarios, $id_candidatura);

if (!$stmt->execute()) {
    echo json_encode(["status" => "error", "titulo" => "Acción incompleta", "message" => "Error al actualizar"]);
    exit;
}

echo json_encode([
    "status" => "success",
    "titulo" => "Acción válida",
    "message" => "Estado actualizado correctamente"
]);

$stmt->close();
exit;
