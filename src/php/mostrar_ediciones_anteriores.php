<?php
include("conexion.php");
header("Content-Type: application/json; charset=utf-8");

// Obtener todas las galas archivadas
$sql = "
    SELECT 
        id, anio, total_participantes,
        (SELECT COUNT(*) FROM ganador_corto WHERE id_gala = gala.id) AS total_ganadores,
        (SELECT COUNT(*) FROM candidatura WHERE id_gala = gala.id) AS total_cortos,
        (SELECT media_url FROM gala_media WHERE id_gala = gala.id LIMIT 1) AS media_url
    FROM gala
    WHERE activa = FALSE
    ORDER BY anio DESC
    LIMIT 2;
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
