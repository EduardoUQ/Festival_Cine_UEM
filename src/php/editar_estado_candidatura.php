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

// Solo admin
if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin") {
    echo json_encode([
        "status" => "error",
        "titulo" => "No autorizado",
        "message" => "No tienes permisos para esta acción"
    ]);
    exit;
}

/* =========================
   DATOS
========================= */
$accion = $_POST['accion'] ?? null;
$id_candidatura = isset($_POST['id']) ? (int) $_POST['id'] : 0;
$comentarios = trim($_POST['comentarios'] ?? "");
$estado = null;

if ($id_candidatura <= 0) {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción cancelada",
        "message" => "ID inválido"
    ]);
    exit;
}

/* =========================
   SEGÚN CANDIDATURA
========================= */
switch ($accion) {

    case "ACEPTADA":
        $estado = "ACEPTADA";
        $comentarios = "Tu candidatura ha sido aceptada";
        break;

    case "NOMINADA":
        $estado = "NOMINADA";
        $comentarios = "Tu candidatura ha sido nominada";
        break;

    case "SUBSANAR":
        $estado = "SUBSANAR";
        break;

    case "RECHAZADA":
        $estado = "RECHAZADA";
        break;

    default:
        echo json_encode([
            "status" => "error",
            "titulo" => "Acción cancelada",
            "message" => "Acción no válida"
        ]);
        exit;
}

/* =========================
   EDITAR EL ESTADO
========================= */
$sql = "UPDATE candidatura SET estado = ?, comentarios = ? WHERE id = ?";
$stmt = $conexion->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción incompleta",
        "message" => "Error preparando la actualización"
    ]);
    exit;
}

$stmt->bind_param("ssi", $estado, $comentarios, $id_candidatura);

if (!$stmt->execute()) {
    echo json_encode([
        "status" => "error",
        "titulo" => "Acción incompleta",
        "message" => "Error al actualizar"
    ]);
    exit;
}
$stmt->close();

/* =========================
   NOTIFICACIÓN POR EMAIL
========================= */

// Log file propio (siempre funciona)
$logFile = __DIR__ . "/email.log";

// Obtener datos (subconsultas)
$sqlInfo = "
    SELECT 
        (SELECT email FROM usuario WHERE id = (SELECT id_usuario FROM candidatura WHERE id = ?)) AS email,
        (SELECT nombre_apellidos FROM usuario WHERE id = (SELECT id_usuario FROM candidatura WHERE id = ?)) AS nombre,
        (SELECT titulo FROM candidatura WHERE id = ?) AS titulo
";
$stmtInfo = $conexion->prepare($sqlInfo);

$emailEnvioOk = null;
$emailDestino = "";
$nombreDestino = "";
$tituloCorto = "";

if ($stmtInfo) {
    $stmtInfo->bind_param("iii", $id_candidatura, $id_candidatura, $id_candidatura);

    if ($stmtInfo->execute()) {
        $resInfo = $stmtInfo->get_result();
        $info = $resInfo->fetch_assoc();

        $emailDestino = trim($info["email"] ?? "");
        $nombreDestino = trim($info["nombre"] ?? "");
        $tituloCorto = trim($info["titulo"] ?? "");

        if ($emailDestino !== "") {

            $asunto = "[Festival Cortos UEM] Estado: $estado - " . ($tituloCorto ?: "Tu candidatura");
            $fecha = date("d/m/Y H:i");
            $saludo = $nombreDestino ? "Hola $nombreDestino," : "Hola,";

            $mensaje = $saludo . "\n\n" .
                "El estado de tu candidatura ha cambiado.\n\n" .
                "Título: " . ($tituloCorto ?: "(sin título)") . "\n" .
                "Nuevo estado: $estado\n" .
                "Fecha: $fecha\n\n" .
                ($comentarios ? "Mensaje del equipo:\n$comentarios\n\n" : "") .
                "Festival de Cortos UEM";

            $headers = "From: Festival Cortos UEM <no-reply@festivalcortos-uem.local>\r\n";
            $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

            // Envío (no bloqueante)
            $emailEnvioOk = @mail($emailDestino, $asunto, $mensaje, $headers);

            // LOG DEL INTENTO (CLAVE PARA LOCAL)
            error_log(
                "[" . date("Y-m-d H:i:s") . "] EMAIL | destino={$emailDestino} | estado={$estado} | resultado=" . ($emailEnvioOk ? "OK" : "FALLO") . PHP_EOL,
                3,
                $logFile
            );
        } else {
            error_log(
                "[" . date("Y-m-d H:i:s") . "] EMAIL | sin destinatario | candidatura={$id_candidatura}" . PHP_EOL,
                3,
                $logFile
            );
        }
    }
    $stmtInfo->close();
}

/* =========================
   RESPUESTA
========================= */
echo json_encode([
    "status" => "success",
    "titulo" => "Acción válida",
    "message" => "Estado actualizado correctamente",
    "email_notificado" => ($emailDestino !== ""),
    "email_envio_ok" => $emailEnvioOk,
    "email_destino" => $emailDestino
]);

exit;
