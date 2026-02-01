<?php
// Evitar que warnings/notices rompan el JSON en producción
ini_set('display_errors', '0');
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json; charset=utf-8');

// Si hubiera cualquier salida previa (BOM/espacios), la limpiamos
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
    'super_admin' => !empty($_SESSION['super_admin']) // true si existe y es truthy
]);
