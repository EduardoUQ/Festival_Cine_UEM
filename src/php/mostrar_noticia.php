<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php"; // aquí se crea $conexion (mysqli)

$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$per_page = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 8;

if ($page < 1) $page = 1;
if ($per_page < 1) $per_page = 8;
if ($per_page > 50) $per_page = 50;

$offset = ($page - 1) * $per_page;

// 1) Total de noticias
$sqlCount = "SELECT COUNT(*) AS total FROM noticia";
$resCount = $conexion->query($sqlCount);

if (!$resCount) {
  echo json_encode(["status" => "error", "message" => "Error al contar noticias"]);
  exit;
}

$rowCount = $resCount->fetch_assoc();
$total = (int)$rowCount["total"];

// Si no hay noticias
if ($total === 0) {
  echo json_encode([
    "status" => "success",
    "total" => 0,
    "page" => $page,
    "per_page" => $per_page,
    "from" => 0,
    "to" => 0,
    "noticias" => []
  ]);
  exit;
}

// Ajustar página si se pasa del máximo
$maxPage = (int)ceil($total / $per_page);
if ($page > $maxPage) {
  $page = $maxPage;
  $offset = ($page - 1) * $per_page;
}

// 2) Noticias paginadas (más nuevas primero)
$sql = "
  SELECT id, titulo, DATE_FORMAT(fecha, '%d/%m/%y') AS fecha
  FROM noticia
  ORDER BY fecha DESC
  LIMIT ? OFFSET ?
";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
  echo json_encode(["status" => "error", "message" => "Error preparando consulta"]);
  exit;
}

$stmt->bind_param("ii", $per_page, $offset);
$stmt->execute();
$result = $stmt->get_result();

$noticias = [];
while ($fila = $result->fetch_assoc()) {
  $noticias[] = $fila;
}

$from = $offset + 1;
$to = $offset + count($noticias);

echo json_encode([
  "status" => "success",
  "total" => $total,
  "page" => $page,
  "per_page" => $per_page,
  "from" => $from,
  "to" => $to,
  "noticias" => $noticias
]);
