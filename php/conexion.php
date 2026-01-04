<?php
$servidor = "localhost";
$usuario  = "root";
$password = "";
$database = "festival_cine_uem";

$conexion = new mysqli($servidor, $usuario, $password);

if ($conexion->connect_error) {
    
    echo json_encode([
        'status' => 'error',
        'message' => 'Error de conexión con la base de datos'
    ]);
    exit;
}

$sql = "SHOW DATABASES LIKE '$database'";
$result = $conexion->query($sql);

if ($result->num_rows === 0) {
    require_once "BBDD.php";
    exit;
}

$conexion->select_db($database);
$conexion->set_charset("utf8mb4");
