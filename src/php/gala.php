<?php
require_once("./conexion.php");

header("Content-Type: application/json; charset=utf-8");

if (!isset($_POST["funcion"])) {
    echo json_encode(["status" => "error", "message" => "Función no especificada"]);
    exit;
}

if ($_POST["funcion"] === "obtener_gala_activa") {

    $sql = "SELECT id, anio, cartel_url, descripcion, fecha_evento,
                   lugar_nombre, lugar_subtitulo, direccion, capacidad, estacionamiento
            FROM gala
            WHERE activa = 1
            LIMIT 1";

    $stmt = $conexion->prepare($sql);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result && $result->num_rows > 0) {
        $gala = $result->fetch_assoc();
        echo json_encode(["status" => "success", "gala" => $gala]);
        exit;
    } else {
        echo json_encode(["status" => "success", "gala" => null]);
        exit;
    }
} elseif ($_POST["funcion"] === "obtener_programa_gala") {

    //Primero leemos la fecha_evento de la gala activa
    $sqlG = "SELECT fecha_evento
             FROM gala
             WHERE activa = 1
             LIMIT 1";

    $stmtG = $conexion->prepare($sqlG);
    $stmtG->execute();
    $resG = $stmtG->get_result();

    if (!$resG || $resG->num_rows === 0) {
        echo json_encode(["status" => "success", "eventos" => []]);
        exit;
    }

    $filaG = $resG->fetch_assoc();
    $fechaGala = $filaG["fecha_evento"];

    //Eventos que coinciden con esa fecha
    $sqlE = "SELECT id, titulo, descripcion, hora, localizacion
             FROM evento
             WHERE fecha = ?
             ORDER BY hora ASC";

    $stmtE = $conexion->prepare($sqlE);
    $stmtE->bind_param("s", $fechaGala);
    $stmtE->execute();
    $resE = $stmtE->get_result();

    $eventos = [];
    while ($fila = $resE->fetch_assoc()) {
        $eventos[] = $fila;
    }

    echo json_encode([
        "status" => "success",
        "fecha_evento" => $fechaGala,
        "eventos" => $eventos
    ]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Función no reconocida"]);
exit;
