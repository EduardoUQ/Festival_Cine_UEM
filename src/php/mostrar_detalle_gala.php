<?php
require_once "conexion.php";
header("Content-Type: application/json; charset=utf-8");

$id_gala = $_GET["id"] ?? null;

if (!$id_gala || !ctype_digit($id_gala)) {
    echo json_encode(["status" => "error", "message" => "ID inválido"]);
    exit;
}

/* ============================
   1. Datos generales de la gala
   ============================ */
$sql_gala = "SELECT id, anio, fecha_evento, lugar_nombre, lugar_subtitulo, direccion, total_participantes
             FROM gala
             WHERE id = ?";
$stmt = $conexion->prepare($sql_gala);
$stmt->bind_param("i", $id_gala);
$stmt->execute();
$gala = $stmt->get_result()->fetch_assoc();

if (!$gala) {
    echo json_encode(["status" => "error", "message" => "Gala no encontrada"]);
    exit;
}

/* ============================
   2. Ganadores (corto + honorífico)
   ============================ */
$sql_ganadores = "
    SELECT 
        p.categoria,
        p.puesto,
        p.descripcion,
        p.dotacion,
        gc.nombre AS participante,
        gc.titulo AS titulo,
        gc.sinopsis AS sinopsis,
        gc.corto_url AS corto_url,
        gh.nombre_apellidos AS honorifico
    FROM premio p
    LEFT JOIN ganador_corto gc ON gc.id_premio = p.id AND gc.id_gala = ?
    LEFT JOIN ganador_honorifico gh ON gh.id_premio = p.id AND gh.id_gala = ?
    WHERE p.activa = FALSE
    ORDER BY p.categoria, p.puesto
";

$stmt_g = $conexion->prepare($sql_ganadores);
$stmt_g->bind_param("ii", $id_gala, $id_gala);
$stmt_g->execute();
$res_g = $stmt_g->get_result();

$ganadores = [];
while ($row = $res_g->fetch_assoc()) {
    $ganadores[] = $row;
}

/* ============================
   3. Galería de imágenes
   ============================ */
$sql_gallery = "SELECT media_url FROM gala_media WHERE id_gala = ?";
$stmt_img = $conexion->prepare($sql_gallery);
$stmt_img->bind_param("i", $id_gala);
$stmt_img->execute();
$res_img = $stmt_img->get_result();

$imagenes = [];
while ($row = $res_img->fetch_assoc()) {
    $imagenes[] = $row["media_url"];
}

echo json_encode([
    "status" => "success",
    "gala" => $gala,
    "ganadores" => $ganadores,
    "imagenes" => $imagenes
]);
exit;
