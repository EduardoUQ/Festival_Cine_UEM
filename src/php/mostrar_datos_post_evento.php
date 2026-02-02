<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (
    !isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin"
) {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

// Función para validar
function validarFila($fila)
{
    if (!$fila) {
        echo json_encode(["status" => "error", "message" => "Datos no encontrados"]);
        exit;
    }
}

// Obtener gala activa + año
$sql_gala = "SELECT id, anio FROM gala WHERE activa = 1";
$stmt = $conexion->prepare($sql_gala);
$stmt->execute();
$res = $stmt->get_result();
$gala = $res->fetch_assoc();
validarFila($gala);

$id_gala = $gala['id'];
$year = $gala['anio'];

// Total de cortos
$sql_cortos = "SELECT COUNT(id) AS total_cortos FROM candidatura ";

$stmt_cortos = $conexion->prepare($sql_cortos);
$stmt_cortos->execute();
$res_cortos = $stmt_cortos->get_result();
$row_cortos = $res_cortos->fetch_assoc();

validarFila($row_cortos);

$total_cortos = $row_cortos['total_cortos'];

// Total de premios
$sql_premios = "SELECT COUNT(id) AS total_premios FROM premio WHERE activa = TRUE";

$stmt_premios = $conexion->prepare($sql_premios);
$stmt_premios->execute();
$res_premios = $stmt_premios->get_result();
$row_premios = $res_premios->fetch_assoc();

validarFila($row_premios);

$total_premios = $row_premios['total_premios'];


// Total de ganadores
$sql_ganadores = "SELECT 
    (SELECT COUNT(*) FROM ganador_corto WHERE id_gala=$id_gala) +
    (SELECT COUNT(*) FROM ganador_honorifico WHERE id_gala=$id_gala)
    AS total_ganadores";

$stmt_ganadores = $conexion->prepare($sql_ganadores);
$stmt_ganadores->execute();
$res_ganadores = $stmt_ganadores->get_result();
$row_ganadores = $res_ganadores->fetch_assoc();

validarFila($row_ganadores);

$total_ganadores = $row_ganadores['total_ganadores'];


echo json_encode([
    "status" => "success",
    "year" => $year,
    "total_cortos" => $total_cortos,
    "total_premios" => $total_premios,
    "total_ganadores" => $total_ganadores
]);
exit;
