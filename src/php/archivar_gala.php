<?php
session_start();
include("conexion.php");
header("Content-Type: application/json; charset=utf-8");

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode(["status" => "error", "message" => "No autorizado"]);
    exit;
}

/* ============================================================
   1. Guardar total participantes y cerrar gala
   ============================================================ */
$sqlCount = "SELECT COUNT(*) AS total FROM candidatura WHERE id_gala = ?";
$stmtCount = $conexion->prepare($sqlCount);
$stmtCount->bind_param("i", $id_gala);
$stmtCount->execute();
$total = $stmtCount->get_result()->fetch_assoc()["total"];

$sqlUpdate = "UPDATE gala SET total_participantes = ?, activa = FALSE WHERE id = ?";
$stmtUpdate = $conexion->prepare($sqlUpdate);
$stmtUpdate->bind_param("ii", $total, $id_gala);
$stmtUpdate->execute();


/* ============================================================
   2. Obtener todas las candidaturas de la gala activa
   ============================================================ */
$sqlCand = "SELECT id, id_usuario FROM candidatura WHERE id_gala = ?";
$stmtCand = $conexion->prepare($sqlCand);
$stmtCand->bind_param("i", $id_gala);
$stmtCand->execute();
$resCand = $stmtCand->get_result();

$candidaturas = [];
while ($row = $resCand->fetch_assoc()) {
    $candidaturas[] = $row;
}

/* ============================================================
   3. Borrar carpetas físicas de cada candidatura
   ============================================================ */
foreach ($candidaturas as $cand) {

    $id_usuario = $cand["id_usuario"];
    $id_candidatura = $cand["id"];

    // Carpeta: uploads/candidaturas/{id_usuario}/{id_candidatura}
    $dirCand = __DIR__ . "/../uploads/candidaturas/$id_usuario/$id_candidatura";

    if (is_dir($dirCand)) {

        // Borrar todos los archivos dentro
        $files = glob($dirCand . "/*");
        foreach ($files as $f) {
            if (is_file($f)) unlink($f);
        }

        // Borrar carpeta candidatura
        rmdir($dirCand);
    }

    // Intentar borrar carpeta del usuario si está vacía
    $dirUser = __DIR__ . "/../uploads/candidaturas/$id_usuario";
    if (is_dir($dirUser)) {
        $resto = glob($dirUser . "/*");
        if (count($resto) === 0) {
            rmdir($dirUser);
        }
    }
}

/* ============================================================
   4. Borrar candidaturas de la BD
   ============================================================ */
$sqlDelete = "DELETE FROM candidatura WHERE id_gala = ?";
$stmtDelete = $conexion->prepare($sqlDelete);
$stmtDelete->bind_param("i", $id_gala);
$stmtDelete->execute();

/* ============================================================
   5. Crear nueva gala vacía
   ============================================================ */
$sqlNew = "INSERT INTO gala (anio, fecha_evento, lugar_nombre, lugar_subtitulo, direccion, capacidad, estacionamiento, activa)
           VALUES (YEAR(CURDATE()) + 1, CURDATE(), '', '', '', 0, '', TRUE)";
$stmtNew = $conexion->prepare($sqlNew);
$stmtNew->execute();

/* ============================================================
   6. Respuesta final
   ============================================================ */
echo json_encode([
    "status" => "success",
    "message" => "Gala archivada correctamente",
    "redirect" => "../formulario_gala.html"
]);
exit;
