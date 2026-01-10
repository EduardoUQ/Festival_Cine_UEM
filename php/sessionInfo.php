<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

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
    'nombre' => $_SESSION['nombre_apellidos'] ?? $_SESSION['email']
]);
?>