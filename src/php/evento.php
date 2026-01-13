<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

//Recogemos el id del admin de la sesión
$id_admi = (int)$_SESSION['id'];

//llamado a la función para procesar los datos
if (isset($_POST['funcion'])) {

    //Obtenemos los datos del formulario
    $titulo = $_POST['titulo'];
    $fecha  = $_POST['fecha'];

    //Validacione
    if ($titulo === '' || $fecha === '') {
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
    $sql_insertar = "INSERT INTO evento (titulo, fecha, id_admin) VALUES (?, ?, ?)";
    $stmt = $conexion->prepare($sql_insertar);
    $stmt->bind_param("ssi", $titulo, $fecha, $id_admi);
    $stmt->execute();

    echo json_encode([
        "status"  => "success",
        "message" => "Evento publicado correctamente"
    ]);
}

$conexion->close();
