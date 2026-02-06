<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/* =========================
   SEGURIDAD
========================= */
if (!isset($_SESSION['id'])) {
    echo json_encode(array(
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Sesión no válida"
    ));
    exit;
}

$id_usuario = (int) $_SESSION['id'];

/* =========================
   DATOS
========================= */
$id_candidatura = 0;
if (isset($_POST['id'])) {
    $id_candidatura = (int) $_POST['id'];
}

$titulo = "";
if (isset($_POST['titulo'])) {
    $titulo = trim($_POST['titulo']);
}

$sinopsis = "";
if (isset($_POST['sinopsis'])) {
    $sinopsis = trim($_POST['sinopsis']);
}

/* =========================
   VALIDACIONES
========================= */
if ($id_candidatura <= 0 || $titulo === "" || $sinopsis === "") {
    echo json_encode(array(
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Complete todos los campos"
    ));
    exit;
}

/* =========================
   COMPROBAR QUE LA CANDIDATURA ES DEL USUARIO
   + TRAER ESTADO ACTUAL
========================= */
$sqlCheck = "SELECT cartel_url, estado
             FROM candidatura
             WHERE id = ? AND id_usuario = ?
             LIMIT 1";

$stmtChk = $conexion->prepare($sqlCheck);
if (!$stmtChk) {
    echo json_encode(array(
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Error preparando consulta"
    ));
    exit;
}

$stmtChk->bind_param("ii", $id_candidatura, $id_usuario);
$stmtChk->execute();
$res = $stmtChk->get_result();

if ($res->num_rows !== 1) {
    echo json_encode(array(
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "No tienes permiso para modificar esta candidatura"
    ));
    exit;
}

$row = $res->fetch_assoc();
$cartelActual = $row['cartel_url'];
$estadoActual = $row['estado'];
$stmtChk->close();

/* =========================
   UPDATE TEXTO (SIEMPRE)
   - Si estaba en SUBSANAR, vuelve a PENDIENTE
========================= */
$sqlUpd = "UPDATE candidatura
           SET titulo = ?,
               sinopsis = ?,
               estado = IF(estado='SUBSANAR','PENDIENTE',estado)
           WHERE id = ? AND id_usuario = ?";

$stmtUpd = $conexion->prepare($sqlUpd);
if (!$stmtUpd) {
    echo json_encode(array(
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Error preparando actualización"
    ));
    exit;
}

$stmtUpd->bind_param("ssii", $titulo, $sinopsis, $id_candidatura, $id_usuario);

if (!$stmtUpd->execute()) {
    echo json_encode(array(
        "status" => "error",
        "titulo" => "Acción no válida",
        "message" => "Error al actualizar datos"
    ));
    exit;
}
$stmtUpd->close();

/* =========================
   ¿HAY CARTEL NUEVO?
========================= */
if (isset($_FILES['cartel']) && isset($_FILES['cartel']['error']) && $_FILES['cartel']['error'] === UPLOAD_ERR_OK) {

    $tmp  = $_FILES['cartel']['tmp_name'];
    $name = $_FILES['cartel']['name'];
    $size = (int) $_FILES['cartel']['size'];
    $type = $_FILES['cartel']['type'];

    // Validaciones
    $max = 2 * 1024 * 1024;
    if ($size <= 0 || $size > $max) {
        echo json_encode(array(
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "El cartel supera 2MB"
        ));
        exit;
    }

    if ($type !== "image/jpeg" && $type !== "image/png") {
        echo json_encode(array(
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Formato de cartel inválido"
        ));
        exit;
    }

    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, array('jpg', 'jpeg', 'png'))) {
        echo json_encode(array(
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Extensión inválida"
        ));
        exit;
    }

    /* ===== RUTAS ===== */
    $baseDir = __DIR__ . "/../uploads/candidaturas";
    $dir = $baseDir . "/" . $id_usuario . "/" . $id_candidatura;

    if (!is_dir($dir)) {
        echo json_encode(array(
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Directorio de candidatura no encontrado"
        ));
        exit;
    }

    // Nombre final SIN ternario
    $nombreFinal = "cartel." . $ext;
    if ($ext === "jpeg") {
        $nombreFinal = "cartel.jpg";
    }

    $pathFinal = $dir . "/" . $nombreFinal;

    // Borrar cartel anterior si existe
    if (!empty($cartelActual)) {
        $rutaCartelAntiguo = __DIR__ . "/../" . $cartelActual;
        if (file_exists($rutaCartelAntiguo)) {
            unlink($rutaCartelAntiguo);
        }
    }

    // Guardar nuevo cartel
    if (!move_uploaded_file($tmp, $pathFinal)) {
        echo json_encode(array(
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "No se pudo guardar el nuevo cartel"
        ));
        exit;
    }

    $cartelUrlDB = "uploads/candidaturas/" . $id_usuario . "/" . $id_candidatura . "/" . $nombreFinal;

    /* ===== UPDATE CARTEL ===== */
    $sqlCartel = "UPDATE candidatura
                  SET cartel_url = ?
                  WHERE id = ? AND id_usuario = ?";

    $stmtCartel = $conexion->prepare($sqlCartel);
    if (!$stmtCartel) {
        echo json_encode(array(
            "status" => "error",
            "titulo" => "Acción no válida",
            "message" => "Error preparando actualización de cartel"
        ));
        exit;
    }

    $stmtCartel->bind_param("sii", $cartelUrlDB, $id_candidatura, $id_usuario);
    $stmtCartel->execute();
    $stmtCartel->close();
}

/* =========================
   OK
========================= */
echo json_encode(array(
    "status" => "success",
    "titulo" => "Acción válida",
    "message" => "Candidatura actualizada correctamente"
));
exit;
