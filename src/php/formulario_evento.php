<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

//Recogemos el id del admin de la sesión
$id = isset($_POST["id"]) ? (int)$_POST["id"] : 0;

//llamado a la función para procesar los datos
if (isset($_POST['funcion'])) {

    if ($_POST['funcion'] === "publicar_evento") {
        //Obtenemos los datos del formulario
        $titulo = $_POST['titulo'];
        $descripcion = $_POST['descripcion'];
        $fecha  = $_POST['fecha'];
        $location = $_POST['localizacion'];
        $hora = $_POST["hora"];

        //Validacione
        if ($titulo === '' || $descripcion === '' || $fecha === '' || $location === '' || $hora === '') {
            echo json_encode([
                "status"  => "error",
                "message" => "Todos los campos son obligatorios"
            ]);
            exit;
        }

        //Validar rango de fechas
        $hoy = date("Y-m-d");
        $fecha_maxima = "2026-12-21";

        if ($fecha < $hoy) {
            echo json_encode([
                "status"  => "error",
                "message" => "La fecha no puede ser anterior a hoy"
            ]);
            exit;
        }

        if ($fecha > $fecha_maxima) {
            echo json_encode([
                "status"  => "error",
                "message" => "La fecha no puede ser posterior al 21/12/2026"
            ]);
            exit;
        }

        //Insertar en BD
        $sql_insertar = "INSERT INTO evento (titulo, descripcion, localizacion, fecha, hora, id_admin) VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conexion->prepare($sql_insertar);
        $stmt->bind_param("sssssi", $titulo, $descripcion, $location,  $fecha, $hora, $id_admin);
        $stmt->execute();

        echo json_encode([
            "status"  => "success",
            "message" => "Evento publicado correctamente"
        ]);
        exit;
    } elseif ($_POST['funcion'] === 'listar_eventos') {
        $sql = "SELECT id, titulo, descripcion, fecha, hora, localizacion 
        FROM evento
        ORDER BY fecha ASC, hora ASC";

        $stmt = $conexion->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();

        $eventos = [];
        while ($fila = $result->fetch_assoc()) {
            $eventos[] = $fila;
        }

        echo json_encode([
            "status" => "success",
            "eventos" => $eventos
        ]);
        exit;
    } elseif ($_POST['funcion'] === "borrar_evento") {
        $id = (int)$_POST["id"];

        if ($id <= 0) {
            echo json_encode([
                "status" => "error",
                "message" => "Id de evento no válido"
            ]);
            exit;
        }

        $sql = "DELETE FROM evento WHERE id = ?";
        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();

        echo json_encode([
            "status" => "success",
            "message" => "Evento borrado correctamente"
        ]);
        exit;
    } elseif ($_POST['funcion'] === "obtener_evento") {
        $id = (int)$_POST['id'];

        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "Id no válido"]);
            exit;
        }

        $sql = "SELECT id, titulo, descripcion, fecha, hora, localizacion
            FROM evento
            WHERE id = ?";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "Evento no encontrado"]);
            exit;
        }

        $evento = $result->fetch_assoc();

        echo json_encode([
            "status" => "success",
            "evento" => $evento
        ]);
        exit;
    } elseif ($_POST['funcion'] === 'editar_evento') {
        $id = (int)$_POST['id'];

        $titulo = $_POST['titulo'];
        $descripcion = $_POST['descripcion'];
        $fecha = $_POST['fecha'];
        $location = $_POST['localizacion'];
        $hora = $_POST['hora'];

        if ($id <= 0 || $titulo === '' || $descripcion === '' || $fecha === '' || $location === '' || $hora === '') {
            echo json_encode(["status" => "error", "message" => "Todos los campos son obligatorios"]);
            exit;
        }

        $sql = "UPDATE evento
            SET titulo = ?, descripcion = ?, localizacion = ?, fecha = ?, hora = ?
            WHERE id = ?";

        $stmt = $conexion->prepare($sql);
        $stmt->bind_param("sssssi", $titulo, $descripcion, $location, $fecha, $hora, $id);
        $stmt->execute();

        echo json_encode([
            "status" => "success",
            "message" => "Evento actualizado correctamente"
        ]);
        exit;
    } elseif ($_POST['funcion'] === 'comprobar_evento') {

        $fecha = $_POST['fecha'];
        $hora = $_POST['hora'];
        $location = $_POST['localizacion'];
        $modo = isset($_POST['modo']) ? $_POST['modo'] : "completo";
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

        //Comprobacion exacta
        if ($id > 0) {
            $sqlExacto = "SELECT id FROM evento WHERE fecha = ? AND hora = ? AND localizacion = ? AND id <> ? LIMIT 1";
            $stmt = $conexion->prepare($sqlExacto);
            $stmt->bind_param("sssi", $fecha, $hora, $location, $id);
        } else {
            $sqlExacto = "SELECT id FROM evento WHERE fecha = ? AND hora = ? AND localizacion = ? LIMIT 1";
            $stmt = $conexion->prepare($sqlExacto);
            $stmt->bind_param("sss", $fecha, $hora, $location);
        }

        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows > 0) {
            echo json_encode([
                "status" => "error",
                "tipo" => "exacto",
                "message" => "Ya existe un evento programado en esa fecha, hora y localización"
            ]);
            exit;
        }

        //Si solo queremos exacto, salimos aquí
        if ($modo === "exacto") {
            echo json_encode([
                "status" => "success",
                "tipo" => "ok"
            ]);
            exit;
        }

        //Comprobación MISMA FECHA (lista de eventos de ese día)
        if ($id > 0) {
            $sqlFecha = "SELECT titulo, hora, localizacion FROM evento WHERE fecha = ? AND id <> ? ORDER BY hora ASC";
            $stmt2 = $conexion->prepare($sqlFecha);
            $stmt2->bind_param("si", $fecha, $id);
        } else {
            $sqlFecha = "SELECT titulo, hora, localizacion FROM evento WHERE fecha = ? ORDER BY hora ASC";
            $stmt2 = $conexion->prepare($sqlFecha);
            $stmt2->bind_param("s", $fecha);
        }

        $stmt2->execute();
        $res2 = $stmt2->get_result();

        $eventos = [];
        while ($fila = $res2->fetch_assoc()) {
            $eventos[] = $fila;
        }

        if (count($eventos) > 0) {
            echo json_encode([
                "status" => "warning",
                "tipo" => "fecha",
                "eventos" => $eventos
            ]);
            exit;
        }

        echo json_encode([
            "status" => "success",
            "tipo" => "ok"
        ]);
        exit;
    }
}

$conexion->close();
