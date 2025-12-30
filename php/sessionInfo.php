<?php
session_start();

$isLogged = isset($_SESSION['id'], $_SESSION['email'], $_SESSION['rol']);
$isAdmin  = $isLogged && $_SESSION['rol'] === 'admin';
$nombre   = $isLogged ? ($_SESSION['nombre_apellidos'] ?? $_SESSION['email']) : null;
?>