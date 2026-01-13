<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

// Comprueba que exista sesión válida (usuario o admin)
if (!isset($_SESSION['id'], $_SESSION['email'], $_SESSION['rol'])) {
    http_response_code(401);
    echo json_encode([
        'status' => 'error',
        'message' => 'No autenticado'
    ]);
    exit;
}
?>