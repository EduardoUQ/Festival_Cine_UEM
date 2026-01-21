<?php
session_start();
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
  echo json_encode(["status" => "error", "message" => "No autorizado"]);
  exit;
}

$sql = "SELECT DISTINCT categoria
        FROM premio
        ORDER BY categoria ASC";

$res = $conexion->query($sql);
if (!$res) {
  echo json_encode(["status" => "error", "message" => "Error consultando categorías"]);
  exit;
}

$cats = [];
while ($row = $res->fetch_assoc()) {
  $cats[] = $row["categoria"];
}

echo json_encode(["status" => "success", "categorias" => $cats]);
