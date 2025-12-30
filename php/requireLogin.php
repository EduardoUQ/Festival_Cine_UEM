<?php
session_start();

if (!isset($_SESSION['id'], $_SESSION['email'], $_SESSION['rol'])) {
    header("Location: ../html/login.php");
    exit;
}
?>