<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/* =========================
   SEGURIDAD
========================= */
if (!isset($_SESSION['id'])) {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Sesión no válida"
    ]);
    exit;
}

$id_usuario = (int) $_SESSION['id'];

/* =========================
   DATOS
========================= */
$id_candidatura = isset($_POST['id']) ? (int) $_POST['id'] : 0;
$titulo    = trim($_POST['titulo'] ?? "");
$sinopsis  = trim($_POST['sinopsis'] ?? "");

/* =========================
   VALIDACIONES
========================= */
if ($id_candidatura <= 0 || $titulo === "" || $sinopsis === "") {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Complete todos los campos"
    ]);
    exit;
}

/* =========================
   COMPROBAR QUE LA CANDIDATURA ES DEL USUARIO
========================= */
$sqlCheck = "SELECT cartel_url 
             FROM candidatura 
             WHERE id = ? AND id_usuario = ?
             LIMIT 1";

$stmtChk = $conexion->prepare($sqlCheck);
$stmtChk->bind_param("ii", $id_candidatura, $id_usuario);
$stmtChk->execute();
$res = $stmtChk->get_result();

if ($res->num_rows !== 1) {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "No tienes permiso para modificar esta candidatura"
    ]);
    exit;
}

$row = $res->fetch_assoc();
$cartelActual = $row['cartel_url'];
$stmtChk->close();

/* =========================
   UPDATE TEXTO (SIEMPRE)
========================= */
$sqlUpd = "UPDATE candidatura 
           SET titulo = ?, sinopsis = ?
           WHERE id = ? AND id_usuario = ?";

$stmtUpd = $conexion->prepare($sqlUpd);
$stmtUpd->bind_param("ssii", $titulo, $sinopsis, $id_candidatura, $id_usuario);

if (!$stmtUpd->execute()) {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Error al actualizar datos"
    ]);
    exit;
}
$stmtUpd->close();

/* =========================
   ¿HAY CARTEL NUEVO?
========================= */
if (isset($_FILES['cartel']) && $_FILES['cartel']['error'] === UPLOAD_ERR_OK) {

    $tmp  = $_FILES['cartel']['tmp_name'];
    $name = $_FILES['cartel']['name'];
    $size = (int) $_FILES['cartel']['size'];
    $type = $_FILES['cartel']['type'];

    // Validaciones
    $max = 2 * 1024 * 1024;
    if ($size <= 0 || $size > $max) {
        echo json_encode([
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "El cartel supera 2MB"
        ]);
        exit;
    }

    if ($type !== "image/jpeg" && $type !== "image/png") {
        echo json_encode([
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Formato de cartel inválido"
        ]);
        exit;
    }

    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, ['jpg', 'jpeg', 'png'])) {
        echo json_encode([
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Extensión inválida"
        ]);
        exit;
    }

    /* ===== RUTAS ===== */
    $baseDir = __DIR__ . "/../uploads/candidaturas";
    $dir = $baseDir . "/" . $id_usuario . "/" . $id_candidatura;

    if (!is_dir($dir)) {
        echo json_encode([
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Directorio de candidatura no encontrado"
        ]);
        exit;
    }

    $nombreFinal = "cartel." . ($ext === "jpeg" ? "jpg" : $ext);
    $pathFinal = $dir . "/" . $nombreFinal;

    if ($cartelActual && file_exists(__DIR__ . "/../" . $cartelActual)) {
        unlink(__DIR__ . "/../" . $cartelActual);
    }

    // Guardar nuevo cartel
    if (!move_uploaded_file($tmp, $pathFinal)) {
        echo json_encode([
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "No se pudo guardar el nuevo cartel"
        ]);
        exit;
    }

    $cartelUrlDB = "uploads/candidaturas/$id_usuario/$id_candidatura/$nombreFinal";

    /* ===== UPDATE CARTEL ===== */
    $sqlCartel = "UPDATE candidatura SET cartel_url = ? WHERE id = ?";
    $stmtCartel = $conexion->prepare($sqlCartel);
    $stmtCartel->bind_param("si", $cartelUrlDB, $id_candidatura);
    $stmtCartel->execute();
    $stmtCartel->close();
}

/* =========================
   OK
========================= */
echo json_encode([
    "status" => "success",
    "titulo" => "Acción válida",
    "message" => "Candidatura actualizada correctamente"
]);
exit;
