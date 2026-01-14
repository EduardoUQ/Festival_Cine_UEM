<?php
include("conexion.php");
// Si no se recibe el id se manda un mensaje de error
if (!isset($_GET['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'ID no recibido']);
    exit;
}

$id = intval($_GET['id']);

// Luego eliminar la reserva
if ($conexion->query("DELETE FROM noticia WHERE id = $id")) {
    echo json_encode(['status' => 'success', 'message' => 'Noticia eliminada correctamente']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Error al eliminar la noticia']);
}

$conexion->close();
