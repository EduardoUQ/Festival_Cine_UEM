<?php
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

//paginacion
$page = isset($_GET["page"]) ? max(1, (int)$_GET["page"]) : 1;
$search = trim($_GET["search"] ?? "");

$perPage = 6;
$offset = ($page - 1) * $perPage;

$where = "";
$params = [];
$types = "";

//buscador
if ($search !== "") {
    $where = "WHERE titulo LIKE ? OR contenido LIKE ?";
    $like = "%" . $search . "%";
    $params = [$like, $like];
    $types = "ss";
}

// TOTAL
$sqlTotal = "SELECT COUNT(*) total FROM noticia $where";
$stmt = $conexion->prepare($sqlTotal);
if ($where) $stmt->bind_param($types, ...$params);
$stmt->execute();
$total = $stmt->get_result()->fetch_assoc()["total"];
$totalPages = ceil($total / $perPage);

// DATOS
$sql = "
    SELECT id, titulo, contenido, imagen_url, fecha
    FROM noticia
    $where
    ORDER BY fecha DESC, id DESC
    LIMIT $perPage OFFSET $offset
";

$stmt = $conexion->prepare($sql);
if ($where) $stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$noticias = [];
while ($row = $res->fetch_assoc()) {
    $row["contenido"] = mb_substr(
        preg_replace('/\s+/', ' ', strip_tags($row["contenido"])),
        0,
        140
    ) . "…";
    $noticias[] = $row;
}

echo json_encode([
    "noticias" => $noticias,
    "total_pages" => $totalPages
]);
