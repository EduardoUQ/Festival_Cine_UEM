<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/*Devuelve premios activos*/

$sql = "SELECT id, categoria, puesto, descripcion, dotacion
        FROM premio
        WHERE activa = 1
        ORDER BY categoria ASC, puesto ASC";

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
