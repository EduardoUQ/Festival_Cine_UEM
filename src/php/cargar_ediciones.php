<?php
include("conexion.php");
header("Content-Type: application/json; charset=utf-8");

// Obtener todas las galas archivadas
$sql = "
    SELECT 
        id, anio, total_participantes,
        (SELECT COUNT(*) FROM ganador_corto WHERE id_gala = gala.id) AS total_ganadores,
        (SELECT COUNT(*) FROM candidatura WHERE id_gala = gala.id) AS total_cortos
    FROM gala
    WHERE activa = FALSE
    ORDER BY anio DESC
";

$res = $conexion->query($sql);

$ediciones = [];
while ($row = $res->fetch_assoc()) {
    $ediciones[] = $row;
}

echo json_encode([
    "status" => "success",
    "ediciones" => $ediciones
]);
exit;
