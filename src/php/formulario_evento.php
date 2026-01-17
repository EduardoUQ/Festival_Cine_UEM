<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

//Recogemos el id del admin de la sesión
$id_admin = (int)$_SESSION['id'];

//llamado a la función para procesar los datos
if (isset($_POST['funcion'])) {

    if ($_POST['funcion'] === "publicar_evento") {
        //Obtenemos los datos del formulario
        $titulo = $_POST['titulo'];
        $fecha  = $_POST['fecha'];
        $location = $_POST['localizacion'];
        $hora = $_POST["hora"];

        //Validacione
        if ($titulo === '' || $fecha === '' || $location === '' || $hora === '') {
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
        $sql_insertar = "INSERT INTO evento (titulo, localizacion, fecha, hora, id_admin) VALUES (?, ?, ?, ?, ?)";
        $stmt = $conexion->prepare($sql_insertar);
        $stmt->bind_param("ssssi", $titulo, $location,  $fecha, $hora, $id_admin);
        $stmt->execute();

        echo json_encode([
            "status"  => "success",
            "message" => "Evento publicado correctamente"
        ]);
        exit;
    } elseif ($_POST['funcion'] === 'listar_eventos') {
        $sql = "SELECT id, titulo, fecha, hora, localizacion 
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
    }
}

$conexion->close();
