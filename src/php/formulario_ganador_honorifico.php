<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

if (!isset($_SESSION['id'])) {
  echo json_encode(["status" => "error", "message" => "Sesión no válida"]);
  exit;
}
if (isset($_SESSION["rol"]) && $_SESSION["rol"] !== "admin") {
  echo json_encode(["status" => "error", "message" => "No autorizado"]);
  exit;
}

function json_error($msg) {
  echo json_encode(["status" => "error", "message" => $msg]);
  exit;
}
function json_success($msg) {
  echo json_encode(["status" => "success", "message" => $msg]);
  exit;
}

// Gala activa
$res = $conexion->query("SELECT id FROM gala WHERE activa = TRUE LIMIT 1");
if (!$res || $res->num_rows === 0) json_error("No hay gala activa");
$row = $res->fetch_assoc();
$idGala = (int)$row["id"];

// Datos
$idPremio = isset($_POST["id_premio"]) ? (int)$_POST["id_premio"] : 0;
$nombre = isset($_POST["nombre"]) ? trim($_POST["nombre"]) : "";
$correo = isset($_POST["correo"]) ? trim($_POST["correo"]) : "";
$numero = isset($_POST["numero"]) ? trim($_POST["numero"]) : "";

if ($idPremio <= 0 || $nombre === "" || $correo === "" || $numero === "") {
  json_error("Faltan datos del formulario");
}

if (!isset($_FILES["video"]) || $_FILES["video"]["error"] !== UPLOAD_ERR_OK) {
  json_error("No se ha subido ningún vídeo válido");
}

// No permitir duplicar el honorífico para ese premio en gala activa
$stmt = $conexion->prepare("SELECT 1 FROM ganador_honorifico WHERE id_gala = ? AND id_premio = ? LIMIT 1");
if (!$stmt) json_error("Error preparando comprobación");
$stmt->bind_param("ii", $idGala, $idPremio);
$stmt->execute();
$existe = $stmt->get_result()->fetch_assoc();
$stmt->close();

if ($existe) {
  json_error("Ya existe un ganador honorífico asignado para este premio en la gala activa.");
}

// Validación vídeo
$video = $_FILES["video"];
$mime = mime_content_type($video["tmp_name"]);
$permitidos = ["video/mp4", "video/quicktime"];
if (!in_array($mime, $permitidos, true)) {
  json_error("Formato de vídeo no válido (solo MP4 o MOV).");
}

$maxSize = 50 * 1024 * 1024;
if ((int)$video["size"] > $maxSize) {
  json_error("El vídeo no puede superar los 50 MB.");
}

// Destino: ganadores/{id_gala}/honorifico/
$destWebDir = "ganadores/" . $idGala . "/honorifico/";
$destFisDir = __DIR__ . "/../" . $destWebDir;

if (!is_dir($destFisDir)) {
  if (!mkdir($destFisDir, 0777, true)) {
    json_error("No se pudo crear la carpeta de subida");
  }
}

$ext = ($mime === "video/quicktime") ? "mov" : "mp4";
$nombreFich = "honorifico_" . time() . "." . $ext;

$rutaFis = $destFisDir . $nombreFich;
$rutaBd  = $destWebDir . $nombreFich;

if (!move_uploaded_file($video["tmp_name"], $rutaFis)) {
  json_error("No se pudo guardar el vídeo en el servidor");
}

// Insert
$stmt = $conexion->prepare("
  INSERT INTO ganador_honorifico (id_gala, id_premio, nombre_apellidos, email, telefono, video_url)
  VALUES (?, ?, ?, ?, ?, ?)
");
if (!$stmt) {
  if (file_exists($rutaFis)) @unlink($rutaFis);
  json_error("Error preparando inserción");
}
$stmt->bind_param("iissss", $idGala, $idPremio, $nombre, $correo, $numero, $rutaBd);

if (!$stmt->execute()) {
  $stmt->close();
  if (file_exists($rutaFis)) @unlink($rutaFis);
  json_error("Error insertando en base de datos");
}
$stmt->close();

json_success("Honorífico guardado correctamente");
