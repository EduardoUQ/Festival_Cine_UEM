<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";


 /* Devuelve las 4 noticias más recientestitulo, contenido, imagen_url, fecha, id_admin*/

$sql = "SELECT id, titulo, contenido, imagen_url, fecha
        FROM noticia
        ORDER BY fecha DESC, id DESC
        LIMIT 4";

$res = $conexion->query($sql);

if (!$res) {
  echo json_encode([]);
  exit;
}

$salida = [];
while ($row = $res->fetch_assoc()) {
  $salida[] = $row;
}

echo json_encode($salida);
