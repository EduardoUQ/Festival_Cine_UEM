<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Obtener gala activa
$sql_gala = "SELECT id FROM gala WHERE activa = 1";
$stmt = $conexion->prepare($sql_gala);
$stmt->execute();
$res = $stmt->get_result();
$gala = $res->fetch_assoc();

if (!$gala) {
    echo json_encode(["status" => "error", "message" => "No hay gala activa"]);
    exit;
}

$id_gala = $gala["id"];

// Obtener todos los premios activos
$sql_premios = "SELECT id, categoria, puesto, dotacion FROM premio WHERE activa = TRUE ORDER BY categoria, puesto";
$stmt_premios = $conexion->prepare($sql_premios);
$stmt_premios->execute();
$res_premios = $stmt_premios->get_result();

$categorias = [];

while ($premio = $res_premios->fetch_assoc()) {

    $id_premio = $premio["id"];
    $categoria = $premio["categoria"];

    // Inicializar categoría si no existe
    if (!isset($categorias[$categoria])) {
        $categorias[$categoria] = [];
    }

    // Buscar ganador en ganador_corto
    $sql_corto = "SELECT nombre, titulo FROM ganador_corto WHERE id_gala = ? AND id_premio = ?";
    $stmt_corto = $conexion->prepare($sql_corto);
    $stmt_corto->bind_param("ii", $id_gala, $id_premio);
    $stmt_corto->execute();
    $res_corto = $stmt_corto->get_result();
    $ganador_corto = $res_corto->fetch_assoc();

    if ($ganador_corto) {
        $categorias[$categoria][] = [
            "puesto" => $premio["puesto"],
            "titulo" => $ganador_corto["titulo"],
            "participante" => $ganador_corto["nombre"],
            "dotacion" => $premio["dotacion"]
        ];
        continue;
    }

    // Buscar ganador honorífico
    $sql_h = "SELECT nombre_apellidos FROM ganador_honorifico WHERE id_gala = ? AND id_premio = ?";
    $stmt_h = $conexion->prepare($sql_h);
    $stmt_h->bind_param("ii", $id_gala, $id_premio);
    $stmt_h->execute();
    $res_h = $stmt_h->get_result();
    $ganador_h = $res_h->fetch_assoc();

    if ($ganador_h) {
        $categorias[$categoria][] = [
            "puesto" => $premio["puesto"],
            "nombre" => $ganador_h["nombre_apellidos"]
        ];
    }
}

echo json_encode([
    "status" => "success",
    "categorias" => $categorias
]);
exit;
