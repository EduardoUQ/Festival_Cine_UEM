<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/*
  Devuelve 1 noticia por id (público)
  GET: id
*/

$id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;
if ($id <= 0) {
  echo json_encode(["status" => "error", "message" => "ID inválido"]);
  exit;
}

$stmt = $conexion->prepare("SELECT id, titulo, contenido, imagen_url, fecha FROM noticia WHERE id = ? LIMIT 1");
if (!$stmt) {
  echo json_encode(["status" => "error", "message" => "Error preparando consulta"]);
  exit;
}

$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if (!$row) {
  echo json_encode(["status" => "error", "message" => "Noticia no encontrada"]);
  exit;
}

echo json_encode(["status" => "ok", "data" => $row]);
