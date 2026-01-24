<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/* =========================
   SEGURIDAD BÁSICA
========================= */
if (!isset($_SESSION['id'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Sesión no válida"
    ]);
    exit;
}

$id_usuario = (int) $_SESSION['id'];

/* =========================
   DATOS COMUNES
========================= */
$accion = $_POST['accion'] ?? null;

/* =========================
   EDITAR DATOS PERSONALES
========================= */
if ($accion === "editar_datos") {

    //    DATOS COMUNES

    $nombre = trim($_POST['nombre'] ?? "");
    $dni = trim($_POST['dni'] ?? "");
    $expediente = $_POST['expediente'] ?? "";
    $email = trim($_POST['email']) ?? "";

    //    VALIDACIONES GENERALES

    if (!$accion || $nombre === "" || $dni === "" || $expediente === "" || $email === "") {
        echo json_encode([
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Todos los campos son obligatorios"
        ]);
        exit;
    }


    $sql = "UPDATE usuario SET nombre_apellidos = ?, dni = ?, email = ?, num_expediente = ? WHERE id = ?";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
        "ssssi",
        $nombre,
        $dni,
        $email,
        $expediente,
        $id_usuario
    );

    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "titulo" => "Cambios guardados",
        "message" => "Datos actualizados correctamente"
    ]);
    exit;
}

/* =========================
   EDITAR CONTRASEÑA DEL USUARIO
========================= */
if ($accion === "editar_contraseña") {

    // DATOS RECOGIDO
    $password = trim($_POST['password']) ?? "";

    // Cifrar la contraseña del admin
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $sql = "UPDATE usuario SET passwd_hash = ? WHERE id = ?";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
        "si",
        $hash,
        $id_usuario
    );

    $stmt->execute();

    echo json_encode([
        "status" => "success",
        "titulo" => "Cambios guardados",
        "message" => "Contraseña actualizada correctamente"
    ]);
    exit;
}

/* =========================
   ACCIÓN NO VÁLIDA
========================= */
echo json_encode([
    "status" => "error",
    "message" => "Acción no válida"
]);
