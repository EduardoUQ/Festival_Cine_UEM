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
    $sqlAdmin = "SELECT id, email, passwd_hash, nombre_apellidos, super_admin
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
            $_SESSION['super_admin'] = (bool)$admin['super_admin'];


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
   2B) CAMBIAR PASSWORD ADMIN DESDE PANEL (pide pass actual)
========================================================= */
if ($funcion === "cambiarPassAdminPanel") {

    if (!isset($_SESSION["rol"]) || $_SESSION["rol"] !== "admin" || !isset($_SESSION["id"])) {
        echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
        $conexion->close();
        exit;
    }

    $currentPass = isset($_POST["current_pass"]) ? $_POST["current_pass"] : "";
    $newPass     = isset($_POST["new_pass"]) ? $_POST["new_pass"] : "";
    $confirmPass = isset($_POST["confirm_pass"]) ? $_POST["confirm_pass"] : "";

    if ($currentPass === "" || $newPass === "" || $confirmPass === "") {
        echo json_encode(['status' => 'error', 'message' => 'Faltan campos']);
        $conexion->close();
        exit;
    }

    if (strlen($newPass) < 4) {
        echo json_encode(['status' => 'error', 'message' => 'La nueva contraseña debe tener mínimo 4 caracteres']);
        $conexion->close();
        exit;
    }

    if ($newPass !== $confirmPass) {
        echo json_encode(['status' => 'error', 'message' => 'Las contraseñas no coinciden']);
        $conexion->close();
        exit;
    }

    $adminId = (int)$_SESSION["id"];

    // 1) Leer hash actual del admin
    $stmt0 = $conexion->prepare("SELECT passwd_hash FROM admin WHERE id = ? LIMIT 1");
    if (!$stmt0) {
        echo json_encode(['status' => 'error', 'message' => 'Error interno (prepare select)']);
        $conexion->close();
        exit;
    }

    $stmt0->bind_param("i", $adminId);
    $stmt0->execute();
    $res0 = $stmt0->get_result();
    $row0 = $res0->fetch_assoc();
    $stmt0->close();

    if (!$row0) {
        echo json_encode(['status' => 'error', 'message' => 'Admin no encontrado']);
        $conexion->close();
        exit;
    }

    // 2) Verificar contraseña actual
    if (!password_verify($currentPass, $row0["passwd_hash"])) {
        echo json_encode(['status' => 'error', 'message' => 'La contraseña actual no es correcta']);
        $conexion->close();
        exit;
    }

    // 3) Actualizar
    $hash = password_hash($newPass, PASSWORD_DEFAULT);

    $stmt = $conexion->prepare("UPDATE admin SET passwd_hash = ? WHERE id = ? LIMIT 1");
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
