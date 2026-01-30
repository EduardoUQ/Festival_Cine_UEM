<?php
session_start();
header('Content-Type: application/json; charset=utf-8');
require_once "conexion.php";

if (!isset($_POST['funcion'])) {
    echo json_encode(['status' => 'error', 'message' => 'Función no especificada']);
    $conexion->close();
    exit;
}

$funcion = $_POST['funcion'];

/* =========================================================
   1) PROCESAR LOGIN
========================================================= */
if ($funcion === "procesarLogin") {

    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $pass  = isset($_POST['pass']) ? $_POST['pass'] : '';

    if ($email === '' || $pass === '') {
        echo json_encode(['status' => 'error', 'message' => 'Email y/o contraseña vacíos']);
        $conexion->close();
        exit;
    }

    /* ========= 1) PROBAR ADMIN ========= */
    $sqlAdmin = "SELECT id, email, passwd_hash, nombre_apellidos
                 FROM admin
                 WHERE email = ?
                 LIMIT 1";

    $stmt = $conexion->prepare($sqlAdmin);
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Error interno (prepare admin)']);
        $conexion->close();
        exit;
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res && $res->num_rows == 1) {
        $admin = $res->fetch_assoc();
        if (password_verify($pass, $admin['passwd_hash'])) {

            // Login admin correcto
            $_SESSION['rol'] = 'admin';
            $_SESSION['id']  = (int)$admin['id'];
            $_SESSION['email'] = $admin['email'];
            $_SESSION['nombre_apellidos'] = $admin['nombre_apellidos'];

            // Si ha escrito 12345 => forzar cambio
            $forceChange = ($pass === "12345");

            echo json_encode([
                'status' => 'success',
                'message' => 'Login admin correcto',
                'rol' => 'admin',
                'force_change' => $forceChange
            ]);

            $stmt->close();
            $conexion->close();
            exit;
        }
    }
    $stmt->close();


    /* ========= 2) PROBAR USUARIO ========= */
    $sqlUser = "SELECT id, email, passwd_hash, nombre_apellidos, dni, num_expediente, anio_graduacion
                FROM usuario
                WHERE email = ?
                LIMIT 1";

    $stmt2 = $conexion->prepare($sqlUser);
    if (!$stmt2) {
        echo json_encode(['status' => 'error', 'message' => 'Error interno (prepare usuario)']);
        $conexion->close();
        exit;
    }

    $stmt2->bind_param("s", $email);
    $stmt2->execute();
    $res2 = $stmt2->get_result();

    if ($res2 && $res2->num_rows == 1) {
        $user = $res2->fetch_assoc();
        if (password_verify($pass, $user['passwd_hash'])) {

            // Login usuario correcto
            $_SESSION['rol'] = 'usuario';
            $_SESSION['id']  = (int)$user['id'];
            $_SESSION['email'] = $user['email'];
            $_SESSION['nombre_apellidos'] = $user['nombre_apellidos'];
            $_SESSION['anio_graduacion'] = $user['anio_graduacion'];

            echo json_encode([
                'status' => 'success',
                'message' => 'Login usuario correcto',
                'rol' => 'usuario'
            ]);

            $stmt2->close();
            $conexion->close();
            exit;
        }
    }

    $stmt2->close();
    echo json_encode(['status' => 'error', 'message' => 'Email y/o contraseña incorrectos']);
    $conexion->close();
    exit;
}


/* =========================================================
   2) CAMBIAR PASSWORD ADMIN (requiere sesión admin)
========================================================= */
if ($funcion === "cambiarPassAdmin") {

    if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin" || !isset($_SESSION["id"])) {
        echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
        $conexion->close();
        exit;
    }

    $newPass = isset($_POST["new_pass"]) ? $_POST["new_pass"] : "";

    if (strlen($newPass) < 4) {
        echo json_encode(['status' => 'error', 'message' => 'La nueva contraseña debe tener mínimo 4 caracteres']);
        $conexion->close();
        exit;
    }

    $hash = password_hash($newPass, PASSWORD_DEFAULT);
    $adminId = (int)$_SESSION["id"];

    $sql = "UPDATE admin SET passwd_hash = ? WHERE id = ? LIMIT 1";
    $stmt = $conexion->prepare($sql);
    if (!$stmt) {
        echo json_encode(['status' => 'error', 'message' => 'Error interno (prepare update)']);
        $conexion->close();
        exit;
    }

    $stmt->bind_param("si", $hash, $adminId);
    $ok = $stmt->execute();

    $stmt->close();
    $conexion->close();

    if (!$ok) {
        echo json_encode(['status' => 'error', 'message' => 'No se pudo actualizar la contraseña']);
        exit;
    }

    echo json_encode(['status' => 'success', 'message' => 'Contraseña actualizada']);
    exit;
}


/* =========================================================
   FUNCIÓN NO VÁLIDA
========================================================= */
echo json_encode(['status' => 'error', 'message' => 'Función no válida']);
$conexion->close();
exit;
