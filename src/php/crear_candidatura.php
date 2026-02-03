<?php
session_start();
require_once "conexion.php";
header('Content-Type: application/json; charset=utf-8');

function respuesta_error($msg)
{
    echo json_encode(["status" => "error", "message" => $msg]);
    exit;
}

function limpiar($s)
{
    return trim((string)$s);
}

/* ====== POST ====== */
$modo             = limpiar($_POST["modo"] ?? ""); // "panel" | "publico"

$nombre_apellidos = limpiar($_POST["nombre_apellidos"] ?? "");
$dni              = strtoupper(limpiar($_POST["dni"] ?? ""));
$num_expediente   = strtoupper(limpiar($_POST["num_expediente"] ?? ""));
$email            = limpiar($_POST["email"] ?? "");
$pass             = (string)($_POST["pass"] ?? "");
$pass2            = (string)($_POST["pass2"] ?? "");

$anio_graduacion  = limpiar($_POST["anio_graduacion"] ?? "");
$categoria_manual = limpiar($_POST["categoria_manual"] ?? "");

$titulo           = limpiar($_POST["titulo"] ?? "");
$sinopsis         = limpiar($_POST["sinopsis"] ?? "");

/* =========================================================
   Helpers archivos (cartel + vídeo)
========================================================= */
function validar_archivos()
{
    // Devuelve array con metadatos ya listos o lanza respuesta_error
    // Usa variables globales para llamar a respuesta_error
    if (!isset($_FILES["cartel"]) || $_FILES["cartel"]["error"] !== UPLOAD_ERR_OK) {
        respuesta_error("Cartel no recibido o con error");
    }
    if (!isset($_FILES["corto"]) || $_FILES["corto"]["error"] !== UPLOAD_ERR_OK) {
        respuesta_error("Vídeo no recibido o con error");
    }

    /* ====== Validación cartel ====== */
    $cartelTmp  = $_FILES["cartel"]["tmp_name"];
    $cartelName = $_FILES["cartel"]["name"];
    $cartelSize = (int)$_FILES["cartel"]["size"];
    $cartelType = (string)$_FILES["cartel"]["type"];

    $maxCartel = 2 * 1024 * 1024; // 2MB
    if ($cartelSize <= 0 || $cartelSize > $maxCartel) {
        respuesta_error("El cartel supera 2MB o es inválido");
    }
    if ($cartelType !== "image/jpeg" && $cartelType !== "image/png") {
        respuesta_error("Formato de cartel inválido (solo JPG/PNG)");
    }
    $extCartel = strtolower(pathinfo($cartelName, PATHINFO_EXTENSION));
    if ($extCartel !== "jpg" && $extCartel !== "jpeg" && $extCartel !== "png") {
        respuesta_error("Extensión de cartel inválida");
    }

    /* ====== Validación vídeo ====== */
    $cortoTmp  = $_FILES["corto"]["tmp_name"];
    $cortoName = $_FILES["corto"]["name"];
    $cortoSize = (int)$_FILES["corto"]["size"];
    $cortoType = (string)$_FILES["corto"]["type"];

    $maxVideo = 2 * 1024 * 1024 * 1024; // 2GB
    if ($cortoSize <= 0 || $cortoSize > $maxVideo) {
        respuesta_error("El vídeo es demasiado grande (máx. 2GB)");
    }
    if ($cortoType !== "video/mp4" && $cortoType !== "video/quicktime") {
        respuesta_error("Formato de vídeo inválido (solo MP4 o MOV)");
    }
    $extCorto = strtolower(pathinfo($cortoName, PATHINFO_EXTENSION));
    if ($extCorto !== "mp4" && $extCorto !== "mov") {
        respuesta_error("Extensión de vídeo inválida");
    }

    return [
        "cartelTmp" => $cartelTmp,
        "extCartel" => $extCartel,
        "cortoTmp"  => $cortoTmp,
        "extCorto"  => $extCorto
    ];
}

/* =========================================================
   Obtener gala activa
========================================================= */
function obtener_gala_activa_id($conexion)
{
    $sqlGala = "SELECT id FROM gala WHERE activa = 1 LIMIT 1";
    $resGala = $conexion->query($sqlGala);
    if (!$resGala || $resGala->num_rows !== 1) {
        respuesta_error("No hay una gala activa en este momento");
    }
    $galaRow = $resGala->fetch_assoc();
    return (int)$galaRow["id"];
}

/* =========================================================
   Calcular categoría en modo público (según tu lógica original)
========================================================= */
function calcular_categoria_publico($anio_graduacion, $categoria_manual)
{
    $anioActual = (int)date("Y");
    $categoria = "ALUMNO";

    if ($anio_graduacion !== "" && ctype_digit($anio_graduacion) && (int)$anio_graduacion === ($anioActual - 1)) {
        if ($categoria_manual !== "ALUMNO" && $categoria_manual !== "ALUMNI") {
            respuesta_error("Debes seleccionar Alumno o Alumni para graduación del año pasado");
        }
        $categoria = $categoria_manual;
    } else {
        if ($anio_graduacion === "CURSO" || $anio_graduacion === "FUTURO") {
            $categoria = "ALUMNO";
        } else {
            $y = (int)$anio_graduacion;
            if ($y <= ($anioActual - 2)) $categoria = "ALUMNI";
            else $categoria = "ALUMNO";
        }
    }

    return $categoria;
}

/* =========================================================
   Calcular categoría en modo panel (según año real en BBDD)
========================================================= */
function calcular_categoria_panel($anioUser, $categoria_manual)
{
    $anioActual = (int)date("Y");

    if ($anioUser === ($anioActual - 1)) {
        if ($categoria_manual !== "ALUMNO" && $categoria_manual !== "ALUMNI") {
            respuesta_error("Debes seleccionar Alumno o Alumni (graduación del año pasado)");
        }
        return $categoria_manual;
    }

    if ($anioUser <= ($anioActual - 2)) return "ALUMNI";
    return "ALUMNO";
}

/* =========================================================
   MODO PANEL (usuario logueado) -> NO crear usuario
========================================================= */
if ($modo === "panel") {
    if (!isset($_SESSION["id"], $_SESSION["rol"]) || $_SESSION["rol"] !== "usuario") {
        respuesta_error("No autorizado (sesión requerida)");
    }

    $id_usuario = (int)$_SESSION["id"];
    if ($id_usuario <= 0) respuesta_error("Sesión inválida");

    if ($titulo === "" || $sinopsis === "") {
        respuesta_error("Faltan datos del cortometraje");
    }

    // Validar archivos
    $files = validar_archivos();

    // Traer anio_graduacion real del usuario desde BBDD
    $stmtY = $conexion->prepare("SELECT anio_graduacion FROM usuario WHERE id = ? LIMIT 1");
    if (!$stmtY) respuesta_error("Error preparando consulta de usuario");
    $stmtY->bind_param("i", $id_usuario);
    $stmtY->execute();
    $resY = $stmtY->get_result();
    $rowY = $resY->fetch_assoc();
    $stmtY->close();

    if (!$rowY) respuesta_error("Usuario no encontrado");

    $anioUser = (int)$rowY["anio_graduacion"];
    $categoria = calcular_categoria_panel($anioUser, $categoria_manual);

    $id_gala = obtener_gala_activa_id($conexion);

    $conexion->begin_transaction();

    try {
        // Insert candidatura
        $estado = "PENDIENTE";
        $comentarios = null;
        $cartel_url = null;
        $corto_url = ""; // se actualiza luego

        $sqlInsCand = "INSERT INTO candidatura (id_usuario, id_gala, estado, categoria, comentarios, titulo, sinopsis, cartel_url, corto_url)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmtC = $conexion->prepare($sqlInsCand);
        if (!$stmtC) {
            throw new Exception("Error preparando inserción candidatura");
        }

        $stmtC->bind_param(
            "iisssssss",
            $id_usuario,
            $id_gala,
            $estado,
            $categoria,
            $comentarios,
            $titulo,
            $sinopsis,
            $cartel_url,
            $corto_url
        );

        if (!$stmtC->execute()) {
            throw new Exception("No se pudo crear la candidatura");
        }

        $id_candidatura = (int)$stmtC->insert_id;
        $stmtC->close();

        if ($id_candidatura <= 0) {
            throw new Exception("ID de candidatura inválido");
        }

        // Crear carpetas y mover archivos
        $baseDir = __DIR__ . "/../uploads/candidaturas";
        $dirUser = $baseDir . "/" . $id_usuario;
        $dirCand = $dirUser . "/" . $id_candidatura;

        if (!is_dir($baseDir) && !mkdir($baseDir, 0755, true)) {
            throw new Exception("No se pudo crear carpeta base de uploads");
        }
        if (!is_dir($dirUser) && !mkdir($dirUser, 0755, true)) {
            throw new Exception("No se pudo crear carpeta de usuario");
        }
        if (!is_dir($dirCand) && !mkdir($dirCand, 0755, true)) {
            throw new Exception("No se pudo crear carpeta de candidatura");
        }

        $extCartel = $files["extCartel"];
        $extCorto  = $files["extCorto"];

        $nombreCartelFinal = "cartel." . ($extCartel === "jpeg" ? "jpg" : $extCartel);
        $nombreCortoFinal  = "corto." . $extCorto;

        $pathCartel = $dirCand . "/" . $nombreCartelFinal;
        $pathCorto  = $dirCand . "/" . $nombreCortoFinal;

        if (!move_uploaded_file($files["cartelTmp"], $pathCartel)) {
            throw new Exception("No se pudo guardar el cartel");
        }
        if (!move_uploaded_file($files["cortoTmp"], $pathCorto)) {
            throw new Exception("No se pudo guardar el vídeo");
        }

        $cartelUrlDB = "uploads/candidaturas/" . $id_usuario . "/" . $id_candidatura . "/" . $nombreCartelFinal;
        $cortoUrlDB  = "uploads/candidaturas/" . $id_usuario . "/" . $id_candidatura . "/" . $nombreCortoFinal;

        // Update candidatura con URLs
        $sqlUpd = "UPDATE candidatura
                   SET cartel_url = ?, corto_url = ?
                   WHERE id = ?";
        $stmtU = $conexion->prepare($sqlUpd);
        if (!$stmtU) {
            throw new Exception("Error preparando actualización de candidatura");
        }
        $stmtU->bind_param("ssi", $cartelUrlDB, $cortoUrlDB, $id_candidatura);

        if (!$stmtU->execute()) {
            throw new Exception("No se pudo actualizar la candidatura con las rutas");
        }
        $stmtU->close();

        $conexion->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Candidatura creada correctamente",
            "id_candidatura" => $id_candidatura
        ]);
        exit;
    } catch (Exception $e) {
        $conexion->rollback();
        respuesta_error($e->getMessage());
    }
}

/* =========================================================
   MODO PÚBLICO (tu flujo original): crea usuario + candidatura
========================================================= */

/* ====== Validaciones básicas ====== */
if ($nombre_apellidos === "" || $dni === "" || $num_expediente === "" || $email === "" || $pass === "" || $pass2 === "") {
    respuesta_error("Faltan datos personales obligatorios");
}
if ($titulo === "" || $sinopsis === "") {
    respuesta_error("Faltan datos del cortometraje");
}

/* ====== Validación EMAIL ====== */
$emailRegex = '/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/';
if (!preg_match($emailRegex, $email)) {
    respuesta_error("Email inválido. Formato esperado: letras/números@letras/números.letras");
}

/* ====== Validación DNI/NIE ====== */
$dniRegex = '/^[A-Z0-9][0-9]{7}[A-Z]$/';
if (!preg_match($dniRegex, $dni)) {
    respuesta_error("DNI/NIE inválido. Formato: 1 letra o número + 7 dígitos + 1 letra (9 caracteres).");
}

/* ====== Validación EXPEDIENTE ====== */
$expRegex = '/^[A-Z0-9]{8}$/';
if (!preg_match($expRegex, $num_expediente)) {
    respuesta_error("Expediente inválido. Debe tener 8 caracteres (letras o números).");
}

/* ====== Contraseñas ====== */
if ($pass !== $pass2) {
    respuesta_error("Las contraseñas no coinciden");
}
if (strlen($pass) < 6) {
    respuesta_error("Contraseña demasiado corta (mín. 6 caracteres)");
}

/* ====== Archivos ====== */
$files = validar_archivos();

/* ====== Calcular anio_graduacion INT para usuario ====== */
$anioActual = (int)date("Y");

if ($anio_graduacion === "CURSO") {
    $anioGuardar = $anioActual;
} elseif ($anio_graduacion === "FUTURO") {
    $anioGuardar = $anioActual + 2;
} else {
    if (!ctype_digit($anio_graduacion)) {
        respuesta_error("Año de graduación inválido");
    }
    $anioGuardar = (int)$anio_graduacion;
}

/* ====== Calcular categoría candidatura (tu lógica) ====== */
$categoria = calcular_categoria_publico($anio_graduacion, $categoria_manual);

/* ====== Obtener gala activa ====== */
$id_gala = obtener_gala_activa_id($conexion);

/* ====== Transaction ====== */
$conexion->begin_transaction();

try {
    /* ====== 1) Comprobar duplicados (email/dni/expediente) ====== */
    $sqlCheck = "SELECT id, email, dni, num_expediente
                 FROM usuario
                 WHERE email = ? OR dni = ? OR num_expediente = ?
                 LIMIT 1";
    $stmtChk = $conexion->prepare($sqlCheck);
    if (!$stmtChk) {
        throw new Exception("Error preparando comprobación de usuario");
    }
    $stmtChk->bind_param("sss", $email, $dni, $num_expediente);

    if (!$stmtChk->execute()) {
        throw new Exception("Error ejecutando comprobación de usuario");
    }
    $resChk = $stmtChk->get_result();

    if ($resChk->num_rows === 1) {
        $ex = $resChk->fetch_assoc();
        $stmtChk->close();

        if ($ex["email"] === $email) throw new Exception("Este email ya está registrado. Inicia sesión.");
        if ($ex["dni"] === $dni) throw new Exception("Este DNI/NIE ya está registrado.");
        if ($ex["num_expediente"] === $num_expediente) throw new Exception("Este número de expediente ya está registrado.");
        throw new Exception("El usuario ya existe.");
    }
    $stmtChk->close();

    /* ====== 2) Crear usuario ====== */
    $hash = password_hash($pass, PASSWORD_DEFAULT);

    $sqlInsertUser = "INSERT INTO usuario (nombre_apellidos, dni, email, passwd_hash, num_expediente, anio_graduacion)
                      VALUES (?, ?, ?, ?, ?, ?)";
    $stmtIns = $conexion->prepare($sqlInsertUser);
    if (!$stmtIns) {
        throw new Exception("Error preparando inserción usuario");
    }
    $stmtIns->bind_param("sssssi", $nombre_apellidos, $dni, $email, $hash, $num_expediente, $anioGuardar);

    if (!$stmtIns->execute()) {
        throw new Exception("No se pudo crear el usuario");
    }
    $id_usuario = (int)$stmtIns->insert_id;
    $stmtIns->close();

    if ($id_usuario <= 0) {
        throw new Exception("No se pudo crear el usuario");
    }

    /* ====== 3) Insert candidatura ====== */
    $estado = "PENDIENTE";
    $comentarios = null;
    $cartel_url = null;
    $corto_url = ""; // se actualiza luego

    $sqlInsCand = "INSERT INTO candidatura (id_usuario, id_gala, estado, categoria, comentarios, titulo, sinopsis, cartel_url, corto_url)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmtC = $conexion->prepare($sqlInsCand);
    if (!$stmtC) {
        throw new Exception("Error preparando inserción candidatura");
    }

    $stmtC->bind_param(
        "iisssssss",
        $id_usuario,
        $id_gala,
        $estado,
        $categoria,
        $comentarios,
        $titulo,
        $sinopsis,
        $cartel_url,
        $corto_url
    );

    if (!$stmtC->execute()) {
        throw new Exception("No se pudo crear la candidatura");
    }

    $id_candidatura = (int)$stmtC->insert_id;
    $stmtC->close();

    if ($id_candidatura <= 0) {
        throw new Exception("ID de candidatura inválido");
    }

    /* ====== 4) Crear carpetas y mover archivos ====== */
    $baseDir = __DIR__ . "/../uploads/candidaturas";
    $dirUser = $baseDir . "/" . $id_usuario;
    $dirCand = $dirUser . "/" . $id_candidatura;

    if (!is_dir($baseDir) && !mkdir($baseDir, 0755, true)) {
        throw new Exception("No se pudo crear carpeta base de uploads");
    }
    if (!is_dir($dirUser) && !mkdir($dirUser, 0755, true)) {
        throw new Exception("No se pudo crear carpeta de usuario");
    }
    if (!is_dir($dirCand) && !mkdir($dirCand, 0755, true)) {
        throw new Exception("No se pudo crear carpeta de candidatura");
    }

    $extCartel = $files["extCartel"];
    $extCorto  = $files["extCorto"];

    $nombreCartelFinal = "cartel." . ($extCartel === "jpeg" ? "jpg" : $extCartel);
    $nombreCortoFinal  = "corto." . $extCorto;

    $pathCartel = $dirCand . "/" . $nombreCartelFinal;
    $pathCorto  = $dirCand . "/" . $nombreCortoFinal;

    if (!move_uploaded_file($files["cartelTmp"], $pathCartel)) {
        throw new Exception("No se pudo guardar el cartel");
    }
    if (!move_uploaded_file($files["cortoTmp"], $pathCorto)) {
        throw new Exception("No se pudo guardar el vídeo");
    }

    $cartelUrlDB = "uploads/candidaturas/" . $id_usuario . "/" . $id_candidatura . "/" . $nombreCartelFinal;
    $cortoUrlDB  = "uploads/candidaturas/" . $id_usuario . "/" . $id_candidatura . "/" . $nombreCortoFinal;

    /* ====== 5) Update candidatura con URLs ====== */
    $sqlUpd = "UPDATE candidatura
               SET cartel_url = ?, corto_url = ?
               WHERE id = ?";
    $stmtU = $conexion->prepare($sqlUpd);
    if (!$stmtU) {
        throw new Exception("Error preparando actualización de candidatura");
    }
    $stmtU->bind_param("ssi", $cartelUrlDB, $cortoUrlDB, $id_candidatura);

    if (!$stmtU->execute()) {
        throw new Exception("No se pudo actualizar la candidatura con las rutas");
    }
    $stmtU->close();

    /* ====== 6) Setear sesión como login usuario ====== */
    $_SESSION["rol"] = "usuario";
    $_SESSION["id"] = $id_usuario;
    $_SESSION["email"] = $email;
    $_SESSION["nombre_apellidos"] = $nombre_apellidos;
    $_SESSION["anio_graduacion"] = $anioGuardar; // guardamos INT real

    $conexion->commit();

    echo json_encode([
        "status" => "success",
        "message" => "Candidatura creada correctamente",
        "id_candidatura" => $id_candidatura
    ]);
    exit;

} catch (Exception $e) {
    $conexion->rollback();
    respuesta_error($e->getMessage());
}
