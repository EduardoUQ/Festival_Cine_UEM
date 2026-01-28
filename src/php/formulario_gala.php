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

    $sql = "SELECT id, anio, cartel_url, descripcion, fecha_evento,
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
========================= */
elseif ($funcion === "crear_gala") {

    $anio = isset($_POST["anio"]) ? (int)$_POST["anio"] : 0;
    $descripcion = isset($_POST["descripcion"]) ? trim($_POST["descripcion"]) : "";
    $fecha_evento = isset($_POST["fecha_evento"]) ? $_POST["fecha_evento"] : "";

    $lugar_nombre = isset($_POST["lugar_nombre"]) ? trim($_POST["lugar_nombre"]) : "";
    $lugar_subtitulo = isset($_POST["lugar_subtitulo"]) ? trim($_POST["lugar_subtitulo"]) : "";
    $direccion = isset($_POST["direccion"]) ? trim($_POST["direccion"]) : "";
    $capacidad = isset($_POST["capacidad"]) && $_POST["capacidad"] !== "" ? (int)$_POST["capacidad"] : null;
    $estacionamiento = isset($_POST["estacionamiento"]) ? trim($_POST["estacionamiento"]) : "";

    $activa = isset($_POST["activa"]) ? (int)$_POST["activa"] : 0;

    if ($anio <= 0 || $descripcion === "" || $fecha_evento === "" || $lugar_nombre === "") {
        echo json_encode(["status" => "error", "message" => "Completa los campos obligatorios"]);
        exit;
    }

    // Si esta gala será activa, desactivamos la anterior activa
    if ($activa === 1) {
        $sqlOff = "UPDATE gala SET activa = 0 WHERE activa = 1";
        $stmtOff = $conexion->prepare($sqlOff);
        $stmtOff->execute();
    }

    // Cartel (opcional)
    $cartel_url = null;
    if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {
        $tmpName = $_FILES["image"]["tmp_name"];
        $fileName = basename($_FILES["image"]["name"]);

        $carpeta = "../uploads/carteles/";
        if (!is_dir($carpeta)) {
            mkdir($carpeta, 0777, true);
        }

        $destino = $carpeta . time() . "_" . $fileName;
        if (move_uploaded_file($tmpName, $destino)) {
            $cartel_url = "uploads/carteles/" . basename($destino);
        }
    }

    $sql = "INSERT INTO gala (anio, cartel_url, descripcion, fecha_evento,
                              lugar_nombre, lugar_subtitulo, direccion, capacidad, estacionamiento,
                              activa)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conexion->prepare($sql);

    // capacidad puede ser null => bind_param no admite null con "i" fácilmente si no lo manejamos.
    //si es null, pasamos NULL y cambiamos la query para aceptar NULL.
    $capacidadBind = ($capacidad === null) ? 0 : $capacidad;

    $stmt->bind_param(
        "issssssisi",
        $anio,
        $cartel_url,
        $descripcion,
        $fecha_evento,
        $lugar_nombre,
        $lugar_subtitulo,
        $direccion,
        $capacidadBind,
        $estacionamiento,
        $activa
    );

    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Gala creada correctamente"]);
    exit;
}

/* =========================
   ACTUALIZAR GALA
========================= */
elseif ($funcion === "actualizar_gala") {

    $id = isset($_POST["id"]) ? (int)$_POST["id"] : 0;

    $anio = isset($_POST["anio"]) ? (int)$_POST["anio"] : 0;
    $descripcion = isset($_POST["descripcion"]) ? trim($_POST["descripcion"]) : "";
    $fecha_evento = isset($_POST["fecha_evento"]) ? $_POST["fecha_evento"] : "";

    $lugar_nombre = isset($_POST["lugar_nombre"]) ? trim($_POST["lugar_nombre"]) : "";
    $lugar_subtitulo = isset($_POST["lugar_subtitulo"]) ? trim($_POST["lugar_subtitulo"]) : "";
    $direccion = isset($_POST["direccion"]) ? trim($_POST["direccion"]) : "";
    $capacidad = isset($_POST["capacidad"]) && $_POST["capacidad"] !== "" ? (int)$_POST["capacidad"] : null;
    $estacionamiento = isset($_POST["estacionamiento"]) ? trim($_POST["estacionamiento"]) : "";

    $activa = isset($_POST["activa"]) ? (int)$_POST["activa"] : 0;

    if ($id <= 0 || $anio <= 0 || $descripcion === "" || $fecha_evento === "" || $lugar_nombre === "") {
        echo json_encode(["status" => "error", "message" => "Completa los campos obligatorios"]);
        exit;
    }

    //Si activa, apagamos el resto
    if ($activa === 1) {
        $sqlOff = "UPDATE gala SET activa = 0 WHERE activa = 1";
        $stmtOff = $conexion->prepare($sqlOff);
        $stmtOff->execute();
    }

    $capacidadBind = ($capacidad === null) ? 0 : $capacidad;

    //Imagen opcional
    $cartel_url = null;
    $hayImagen = false;

    if (isset($_FILES["image"]) && $_FILES["image"]["error"] === UPLOAD_ERR_OK) {
        $tmpName = $_FILES["image"]["tmp_name"];
        $fileName = basename($_FILES["image"]["name"]);

        $carpeta = "../uploads/carteles/";
        if (!is_dir($carpeta)) {
            mkdir($carpeta, 0777, true);
        }

        $destino = $carpeta . time() . "_" . $fileName;
        if (move_uploaded_file($tmpName, $destino)) {
            $cartel_url = "uploads/carteles/" . basename($destino);
            $hayImagen = true;
        }
    }

    if ($hayImagen) {
        $sql = "UPDATE gala
                SET anio = ?, descripcion = ?, fecha_evento = ?,
                    lugar_nombre = ?, lugar_subtitulo = ?, direccion = ?, capacidad = ?, estacionamiento = ?,
                    activa = ?, cartel_url = ?
                WHERE id = ?";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param(
            "isssssisisi",
            $anio,
            $descripcion,
            $fecha_evento,
            $lugar_nombre,
            $lugar_subtitulo,
            $direccion,
            $capacidadBind,
            $estacionamiento,
            $activa,
            $cartel_url,
            $id
        );
    } else {
        $sql = "UPDATE gala
                SET anio = ?, descripcion = ?, fecha_evento = ?,
                    lugar_nombre = ?, lugar_subtitulo = ?, direccion = ?, capacidad = ?, estacionamiento = ?,
                    activa = ?
                WHERE id = ?";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param(
            "isssssisii", 
            $anio,
            $descripcion,
            $fecha_evento,
            $lugar_nombre,
            $lugar_subtitulo,
            $direccion,
            $capacidadBind,
            $estacionamiento,
            $activa,
            $id
        );
    }

    $stmt->execute();

    echo json_encode(["status" => "success", "message" => "Gala actualizada correctamente"]);
    exit;
}

echo json_encode(["status" => "error", "message" => "Función no reconocida"]);
exit;
