<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

/* =========================
   SEGURIDAD BÁSICA
========================= */
if (!isset($_SESSION['id'])) {
    echo json_encode([
        "status" => "error",
        "message" => "Sesión no válida"
    ]);
    exit;
}

$id_admin = (int) $_SESSION['id'];

/* =========================
   DATOS COMUNES
========================= */
// $accion    = $_POST['accion'] ?? null;
$nombre    = trim($_POST['nombre'] ?? "");
$correo = trim($_POST['correo'] ?? "");
$numero     = $_POST['numero'] ?? "";
// $id        = isset($_POST['id']) ? (int) $_POST['id'] : null;s

/* =========================
   VALIDACIONES GENERALES
========================= */
if ($nombre === "" || $correo === "" || $numero === "") {
    echo json_encode([
        "status" => "error",
        "message" => "Todos los campos son obligatorios"
    ]);
    exit;
}

/* =========================
   CONFIG IMÁGENES
========================= */
$tiposPermitidos = ["video/mp4", "video/omv"];
$maxSize = 50 * 1024 * 1024;

// rutas
$rutaFisica = __DIR__ . "/../uploads/ganador_honorifico/";
$rutaWeb    = "uploads/ganador_honorifico/";

// crear carpeta si no existe
if (!is_dir($rutaFisica)) {
    mkdir($rutaFisica, 0777, true);
}

/* =========================
   FUNCIÓN SUBIR VIDEO
========================= */
function subir_video($file, $tiposPermitidos, $maxSize, $rutaFisica, $rutaWeb)
{
    if (!in_array($file['type'], $tiposPermitidos)) {
        return ["error" => "Formato de video no permitido"];
    }

    if ($file['size'] > $maxSize) {
        return ["error" => "La imagen supera los 50MB"];
    }

    $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
    $nombre = uniqid("video_") . "." . $ext;

    if (!move_uploaded_file($file['tmp_name'], $rutaFisica . $nombre)) {
        return ["error" => "Error al subir el video"];
    }

    return ["ok" => $rutaWeb . $nombre];
}

/* =========================
   CREAR NOTICIA
========================= */
// if ($accion === "crear") {

if (!isset($_FILES['video'])) {
    echo json_encode([
        "status" => "error",
        "message" => "El video es obligatorio"
    ]);
    exit;
}

$resultado = subir_video(
    $_FILES['video'],
    $tiposPermitidos,
    $maxSize,
    $rutaFisica,
    $rutaWeb
);

if (isset($resultado['error'])) {
    echo json_encode([
        "status" => "error",
        "message" => $resultado['error']
    ]);
    exit;
}
$var1 = 1;
$var2 = 6;
$sql = "INSERT INTO ganador_honorifico (id_gala, id_premio, nombre_apellidos, email, telefono, video_url)
            VALUES (?, ?, ?, ?, ?, ?)";

$stmt = $conexion->prepare($sql);
$stmt->bind_param(
    "iissss",
    $var1,
    $var2,
    $nombre,
    $correo,
    $numero,
    $resultado['ok'],
);

$stmt->execute();

echo json_encode([
    "status" => "success",
    "message" => "Ganador asignado correctamente"
]);
exit;
// }

/* =========================
   EDITAR NOTICIA
========================= */
// if ($accion === "editar") {

//     if (!$id) {
//         echo json_encode([
//             "status" => "error",
//             "message" => "ID inválido"
//         ]);
//         exit;
//     }

//     // Obtener imagen actual
//     $stmt = $conexion->prepare("SELECT imagen_url FROM noticia WHERE id = ?");
//     $stmt->bind_param("i", $id);
//     $stmt->execute();
//     $res = $stmt->get_result();
//     $noticia = $res->fetch_assoc();

//     if (!$noticia) {
//         echo json_encode([
//             "status" => "error",
//             "message" => "Noticia no encontrada"
//         ]);
//         exit;
//     }

//     $imagenFinal = $noticia['imagen_url'];

//     // Si se sube nueva imagen
//     if (isset($_FILES['imagen'])) {

//         $resultado = subir_video(
//             $_FILES['imagen'],
//             $tiposPermitidos,
//             $maxSize,
//             $rutaFisica,
//             $rutaWeb
//         );

//         if (isset($resultado['error'])) {
//             echo json_encode([
//                 "status" => "error",
//                 "message" => $resultado['error']
//             ]);
//             exit;
//         }

//         // Borrar imagen anterior
//         $rutaAntigua = $_SERVER['DOCUMENT_ROOT'] . $imagenFinal;
//         if (file_exists($rutaAntigua)) {
//             unlink($rutaAntigua);
//         }

//         $imagenFinal = $resultado['ok'];
//     }

//     $sql = "UPDATE noticia 
//             SET nombre = ?, correo = ?, imagen_url = ?, numero = ?
//             WHERE id = ?";

//     $stmt = $conexion->prepare($sql);
//     $stmt->bind_param(
//         "ssssi",
//         $nombre,
//         $correo,
//         $imagenFinal,
//         $numero,
//         $id
//     );

//     $stmt->execute();

//     echo json_encode([
//         "status" => "success",
//         "message" => "Noticia actualizada correctamente"
//     ]);
//     exit;
// }

/* =========================
   ACCIÓN NO VÁLIDA
========================= */
echo json_encode([
    "status" => "error",
    "message" => "Acción no válida"
]);
