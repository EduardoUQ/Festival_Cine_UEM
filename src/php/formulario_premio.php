<?php
session_start();
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Necesitamos el id del admin en sesión
if (!isset($_SESSION["id"])) {
    echo json_encode(["status" => "error", "message" => "No se encontró id del admin en la sesión"]);
    exit;
}
$id_admin = (int)$_SESSION["id"];

// Comprobar función
$funcion = isset($_POST["funcion"]) ? $_POST["funcion"] : "";
if ($funcion !== "crearPremio" && $funcion !== "editarPremio") {
    echo json_encode(["status" => "error", "message" => "Función no válida"]);
    exit;
}

// Recoger campos
$categoria    = isset($_POST["categoria"]) ? trim($_POST["categoria"]) : "";
$puestoRaw    = isset($_POST["puesto"]) ? trim($_POST["puesto"]) : "";
$descripcion  = isset($_POST["descripcion"]) ? trim($_POST["descripcion"]) : "";
$dotacionRaw  = isset($_POST["dotacion"]) ? trim($_POST["dotacion"]) : "";
$activaRaw    = isset($_POST["activa"]) ? trim($_POST["activa"]) : "";

// Validaciones server-side
if ($categoria === "" || mb_strlen($categoria) > 30) {
    echo json_encode(["status" => "error", "message" => "Categoría obligatoria (máx. 30 caracteres)"]);
    exit;
}

if ($puestoRaw === "" || !ctype_digit($puestoRaw)) {
    echo json_encode(["status" => "error", "message" => "Puesto inválido (debe ser un número entero >= 0)"]);
    exit;
}
$puesto = (int)$puestoRaw;

if ($descripcion === "") {
    echo json_encode(["status" => "error", "message" => "Descripción obligatoria"]);
    exit;
}

if ($activaRaw !== "0" && $activaRaw !== "1") {
    echo json_encode(["status" => "error", "message" => "Estado inválido"]);
    exit;
}
$activa = (int)$activaRaw;

// Dotación puede ser NULL
$dotacion = null;
if ($dotacionRaw !== "") {
    if (!is_numeric($dotacionRaw) || (float)$dotacionRaw < 0) {
        echo json_encode(["status" => "error", "message" => "Dotación inválida (número >= 0)"]);
        exit;
    }
    $dotacion = number_format((float)$dotacionRaw, 2, '.', '');
}

//Modo edición
if ($funcion === "editarPremio") {

    if (!isset($_POST["id"])) {
        echo json_encode(["status" => "error", "message" => "Falta el id del premio"]);
        exit;
    }

    $id = (int)$_POST["id"];
    if ($id <= 0) {
        echo json_encode(["status" => "error", "message" => "ID inválido"]);
        exit;
    }

    $sql = "UPDATE premio
            SET categoria = ?, puesto = ?, descripcion = ?, dotacion = ?, activa = ?, id_admin = ?
            WHERE id = ?";

    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        echo json_encode(["status" => "error", "message" => "Error preparando consulta", "error" => $conexion->error]);
        exit;
    }

    // categoria(s), puesto(i), descripcion(s), dotacion(s), activa(i), id_admin(i), id(i)
    $stmt->bind_param("sissiii", $categoria, $puesto, $descripcion, $dotacion, $activa, $id_admin, $id);

    if ($stmt->execute()) {
        // Si no existía ese id, affected_rows puede ser 0 aunque no haya error.
        // Aun así lo damos por OK.
        echo json_encode([
            "status" => "success",
            "message" => "Premio actualizado",
            "id" => $id
        ]);
        exit;
    }

    // Duplicado UNIQUE(categoria, puesto)
    if ($stmt->errno === 1062) {
        echo json_encode([
            "status" => "error",
            "message" => "Ya existe un premio con esa categoría y ese puesto (categoría + puesto deben ser únicos)."
        ]);
        exit;
    }

    echo json_encode([
        "status" => "error",
        "message" => "No se pudo actualizar el premio",
        "error" => $stmt->error
    ]);
    exit;
}

//MOdo crear

$sql = "INSERT INTO premio (categoria, puesto, descripcion, dotacion, activa, id_admin)
        VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando consulta", "error" => $conexion->error]);
    exit;
}

// categoria(s), puesto(i), descripcion(s), dotacion(s), activa(i), id_admin(i)
$stmt->bind_param("sissii", $categoria, $puesto, $descripcion, $dotacion, $activa, $id_admin);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "Premio creado",
        "id" => $stmt->insert_id
    ]);
    exit;
}

// Duplicado UNIQUE(categoria, puesto)
if ($stmt->errno === 1062) {
    echo json_encode([
        "status" => "error",
        "message" => "Ya existe un premio con esa categoría y ese puesto (categoría + puesto deben ser únicos)."
    ]);
    exit;
}

echo json_encode([
    "status" => "error",
    "message" => "No se pudo crear el premio",
    "error" => $stmt->error
]);
