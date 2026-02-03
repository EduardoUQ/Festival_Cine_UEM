<?php
ini_set('display_errors', '0');
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

if (ob_get_length()) {
    ob_clean();
}

$isLogged = isset($_SESSION['id'], $_SESSION['email'], $_SESSION['rol']);

if (!$isLogged) {
    echo json_encode(['logged' => false]);
    exit;
}

echo json_encode([
    'logged' => true,
    'rol' => $_SESSION['rol'],
    'id' => (int)$_SESSION['id'],
    'email' => $_SESSION['email'],
    'nombre' => $_SESSION['nombre_apellidos'] ?? $_SESSION['email'],
    'anio_graduacion' => isset($_SESSION['anio_graduacion']) ? (int)$_SESSION['anio_graduacion'] : null,
    'super_admin' => !empty($_SESSION['super_admin'])
]);
