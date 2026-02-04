<?php
require_once("./conexion.php");
header("Content-Type: application/json; charset=utf-8");

if (!isset($_POST["funcion"])) {
    echo json_encode(["status" => "error", "message" => "Función no especificada"]);
    exit;
}

$funcion = $_POST["funcion"];

/* =========================
   OBTENER GALA ACTIVA (PANEL)
========================= */
if ($funcion === "obtener_gala_activa") {

    $sql = "SELECT id, anio, descripcion, fecha_evento,
                   lugar_nombre, lugar_subtitulo, direccion, capacidad, estacionamiento,
                   activa
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
}

/* =========================
   CREAR GALA
========================= */ elseif ($funcion === "crear_gala") {

    $anio = isset($_POST["anio"]) ? (int)$_POST["anio"] : 0;
    $descripcion = isset($_POST["descripcion"]) ? trim($_POST["descripcion"]) : "";
    $fecha_evento = isset($_POST["fecha_evento"]) ? $_POST["fecha_evento"] : "";

    $lugar_nombre = isset($_POST["lugar_nombre"]) ? trim($_POST["lugar_nombre"]) : "";
    $lugar_subtitulo = isset($_POST["lugar_subtitulo"]) ? trim($_POST["lugar_subtitulo"]) : "";
    $direccion = isset($_POST["direccion"]) ? trim($_POST["direccion"]) : "";
    $capacidad = isset($_POST["capacidad"]) && $_POST["capacidad"] !== "" ? (int)$_POST["capacidad"] : null;
    $estacionamiento = isset($_POST["estacionamiento"]) ? trim($_POST["estacionamiento"]) : "";


    if ($anio <= 0 || $descripcion === "" || $fecha_evento === "" || $lugar_nombre === "") {
        echo json_encode(["status" => "error", "message" => "Completa los campos obligatorios"]);
        exit;
    }




    $sql = "INSERT INTO gala (anio, descripcion, fecha_evento,
                              lugar_nombre, lugar_subtitulo, direccion, capacidad, estacionamiento)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, )";

    $stmt = $conexion->prepare($sql);

    // capacidad puede ser null => bind_param no admite null con "i" fácilmente si no lo manejamos.
    //si es null, pasamos NULL y cambiamos la query para aceptar NULL.
    $capacidadBind = ($capacidad === null) ? 0 : $capacidad;

    $stmt->bind_param(
        "isssssii",
        $anio,
        $descripcion,
        $fecha_evento,
        $lugar_nombre,
        $lugar_subtitulo,
        $direccion,
        $capacidadBind,
        $estacionamiento
    );

    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Gala creada correctamente"]);
    exit;
}

/* =========================
   ACTUALIZAR GALA
========================= */ elseif ($funcion === "actualizar_gala") {

    $id = isset($_POST["id"]) ? (int)$_POST["id"] : 0;

    $anio = isset($_POST["anio"]) ? (int)$_POST["anio"] : 0;
    $descripcion = isset($_POST["descripcion"]) ? trim($_POST["descripcion"]) : "";
    $fecha_evento = isset($_POST["fecha_evento"]) ? $_POST["fecha_evento"] : "";

    $lugar_nombre = isset($_POST["lugar_nombre"]) ? trim($_POST["lugar_nombre"]) : "";
    $lugar_subtitulo = isset($_POST["lugar_subtitulo"]) ? trim($_POST["lugar_subtitulo"]) : "";
    $direccion = isset($_POST["direccion"]) ? trim($_POST["direccion"]) : "";
    $capacidad = isset($_POST["capacidad"]) && $_POST["capacidad"] !== "" ? (int)$_POST["capacidad"] : null;
    $estacionamiento = isset($_POST["estacionamiento"]) ? trim($_POST["estacionamiento"]) : "";

    if ($id <= 0 || $anio <= 0 || $descripcion === "" || $fecha_evento === "" || $lugar_nombre === "") {
        echo json_encode(["status" => "error", "message" => "Completa los campos obligatorios"]);
        exit;
    }

    $capacidadBind = ($capacidad === null) ? 0 : $capacidad;



    $sql = "UPDATE gala
                SET anio = ?, descripcion = ?, fecha_evento = ?,
                    lugar_nombre = ?, lugar_subtitulo = ?, direccion = ?, capacidad = ?, estacionamiento = ?
                WHERE id = ?";

    $stmt = $conexion->prepare($sql);
    $stmt->bind_param(
        "isssssiii",
        $anio,
        $descripcion,
        $fecha_evento,
        $lugar_nombre,
        $lugar_subtitulo,
        $direccion,
        $capacidadBind,
        $estacionamiento,
        $id
    );


    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Gala actualizada correctamente"]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Función no reconocida"]);
exit;
