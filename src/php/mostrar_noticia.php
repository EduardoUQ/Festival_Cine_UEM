<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Hacemos la consulta de la información de la noticia
$sql = "SELECT id, titulo , fecha FROM noticia";
$result = $conexion->query($sql);

// Lo enviamos con un array al JS
$noticias = [];
while ($row = $result->fetch_assoc()) {
    $noticias[] = $row;
}

echo json_encode($noticias);
