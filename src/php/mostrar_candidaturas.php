<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

$estado = isset($_GET["estado"]) ? trim($_GET["estado"]) : "PENDIENTE";
$categoria = isset($_GET["categoria"]) ? trim($_GET["categoria"]) : "";
$textoBusqueda = isset($_GET["busqueda"]) ? trim($_GET["busqueda"]) : "";

$page = isset($_GET["page"]) ? (int)$_GET["page"] : 1;
$per_page = isset($_GET["per_page"]) ? (int)$_GET["per_page"] : 8;

if ($page < 1) $page = 1;
if ($per_page < 1) $per_page = 8;
if ($per_page > 50) $per_page = 50;

$offset = ($page - 1) * $per_page;

// =========================
// WHERE dinámico
// =========================
$where = " WHERE c.estado = ? ";
$types = "s";
$params = [$estado];

if ($categoria !== "") {
    $where .= " AND c.categoria = ? ";
    $types .= "s";
    $params[] = $categoria;
}

if ($textoBusqueda !== "") {
    $where .= " AND LOWER(c.titulo) LIKE ? ";
    $types .= "s";
    $params[] = "%" . mb_strtolower($textoBusqueda, "UTF-8") . "%";
}

// =========================
// 1) COUNT total
// =========================
$sqlCount = "
    SELECT COUNT(*) AS total
    FROM candidatura c
    JOIN usuario u ON c.id_usuario = u.id
    $where
";

$stmtCount = $conexion->prepare($sqlCount);
if (!$stmtCount) {
    echo json_encode(["status" => "error", "message" => "Error preparando count"]);
    exit;
}

$stmtCount->bind_param($types, ...$params);
$stmtCount->execute();
$resCount = $stmtCount->get_result();
$rowCount = $resCount->fetch_assoc();
$total = (int)$rowCount["total"];

if ($total === 0) {
    echo json_encode([
        "status" => "success",
        "total" => 0,
        "page" => $page,
        "per_page" => $per_page,
        "from" => 0,
        "to" => 0,
        "candidaturas" => []
    ]);
    exit;
}

// Ajustar página si se pasa
$maxPage = (int)ceil($total / $per_page);
if ($page > $maxPage) {
    $page = $maxPage;
    $offset = ($page - 1) * $per_page;
}

// =========================
// 2) Datos paginados
// =========================
$sql = "
    SELECT 
        c.id,
        c.titulo,
        c.categoria,
        c.estado,
        u.nombre_apellidos AS participante
    FROM candidatura c
    JOIN usuario u ON c.id_usuario = u.id
    $where
    ORDER BY c.id DESC
    LIMIT ? OFFSET ?
";

$stmt = $conexion->prepare($sql);
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Error preparando consulta"]);
    exit;
}

$types2 = $types . "ii";
$params2 = array_merge($params, [$per_page, $offset]);

$stmt->bind_param($types2, ...$params2);
$stmt->execute();

$result = $stmt->get_result();
$candidaturas = [];
while ($row = $result->fetch_assoc()) {
    $candidaturas[] = $row;
}

$from = $offset + 1;
$to = $offset + count($candidaturas);

echo json_encode([
    "status" => "success",
    "total" => $total,
    "page" => $page,
    "per_page" => $per_page,
    "from" => $from,
    "to" => $to,
    "candidaturas" => $candidaturas
]);
