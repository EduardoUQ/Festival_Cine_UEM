<?php

function manejarLogin()
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }

    require_once "conexion.php";

    if (!isset($conexion) || !($conexion instanceof mysqli)) {
        return ['status' => 'error', 'message' => 'Error de conexión con la base de datos'];
    }

    if (!isset($_POST['funcion'])) {
        $conexion->close();
        return ['status' => 'error', 'message' => 'Función no especificada'];
    }

    $funcion = $_POST['funcion'];

    // =========================
    // 1) LOGIN (admin/usuario)
    // =========================
    if ($funcion === "procesarLogin") {

        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $pass  = isset($_POST['pass']) ? $_POST['pass'] : '';

        if ($email === '' || $pass === '') {
            $conexion->close();
            return ['status' => 'error', 'message' => 'Email y/o contraseña vacíos'];
        }

        // 1) ADMIN
        $sqlAdmin = "SELECT id, email, passwd_hash, nombre_apellidos, super_admin
                     FROM admin
                     WHERE email = ?
                     LIMIT 1";

        $stmt = $conexion->prepare($sqlAdmin);
        if (!$stmt) {
            $conexion->close();
            return ['status' => 'error', 'message' => 'Error interno (prepare admin)'];
        }

        $stmt->bind_param("s", $email);
        $stmt->execute();
        $res = $stmt->get_result();

        if ($res && $res->num_rows === 1) {
            $admin = $res->fetch_assoc();
            if (password_verify($pass, $admin['passwd_hash'])) {

                $_SESSION['rol'] = 'admin';
                $_SESSION['id']  = (int)$admin['id'];
                $_SESSION['email'] = $admin['email'];
                $_SESSION['nombre_apellidos'] = $admin['nombre_apellidos'];
                $_SESSION['super_admin'] = (bool)$admin['super_admin'];

                // Forzamos modal solo si el admin ha escrito literalmente 12345
                // (esto solo tiene sentido si 12345 es la contraseña temporal)
                $forceChange = ($pass === "12345");

                $stmt->close();
                $conexion->close();

                return [
                    'status' => 'success',
                    'message' => 'Login admin correcto',
                    'rol' => 'admin',
                    'force_change' => $forceChange
                ];
            }
        }

        $stmt->close();

        // 2) USUARIO
        $sqlUser = "SELECT id, email, passwd_hash, nombre_apellidos, dni, num_expediente, anio_graduacion
                    FROM usuario
                    WHERE email = ?
                    LIMIT 1";

        $stmt2 = $conexion->prepare($sqlUser);
        if (!$stmt2) {
            $conexion->close();
            return ['status' => 'error', 'message' => 'Error interno (prepare usuario)'];
        }

        $stmt2->bind_param("s", $email);
        $stmt2->execute();
        $res2 = $stmt2->get_result();

        if ($res2 && $res2->num_rows === 1) {
            $user = $res2->fetch_assoc();
            if (password_verify($pass, $user['passwd_hash'])) {

                $_SESSION['rol'] = 'usuario';
                $_SESSION['id']  = (int)$user['id'];
                $_SESSION['email'] = $user['email'];
                $_SESSION['nombre_apellidos'] = $user['nombre_apellidos'];
                $_SESSION['anio_graduacion'] = $user['anio_graduacion'];

                $stmt2->close();
                $conexion->close();

                return [
                    'status' => 'success',
                    'message' => 'Login usuario correcto',
                    'rol' => 'usuario'
                ];
            }
        }

        $stmt2->close();
        $conexion->close();

        return ['status' => 'error', 'message' => 'Email y/o contraseña incorrectos'];
    }

    // =====================================
    // 2) CAMBIAR CONTRASEÑA INICIAL DE ADMIN
    // =====================================
    if ($funcion === "cambiarPassAdmin") {

        // Debe haber sesión de admin
        if (!isset($_SESSION['rol']) || $_SESSION['rol'] !== 'admin' || !isset($_SESSION['id'])) {
            $conexion->close();
            return ['status' => 'error', 'message' => 'No autorizado'];
        }

        $newPass = isset($_POST['new_pass']) ? (string)$_POST['new_pass'] : '';

        if (trim($newPass) === '') {
            $conexion->close();
            return ['status' => 'error', 'message' => 'La nueva contraseña está vacía'];
        }

        if (mb_strlen($newPass) < 4) {
            $conexion->close();
            return ['status' => 'error', 'message' => 'La nueva contraseña debe tener mínimo 4 caracteres'];
        }

        $idAdmin = (int)$_SESSION['id'];
        $newHash = password_hash($newPass, PASSWORD_DEFAULT);

        $sql = "UPDATE admin SET passwd_hash = ? WHERE id = ? LIMIT 1";
        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            $conexion->close();
            return ['status' => 'error', 'message' => 'Error interno (prepare cambio pass)'];
        }

        $stmt->bind_param("si", $newHash, $idAdmin);

        if (!$stmt->execute()) {
            $stmt->close();
            $conexion->close();
            return ['status' => 'error', 'message' => 'No se pudo actualizar la contraseña'];
        }

        if ($stmt->affected_rows < 1) {
            // No cambió nada (id inexistente o mismo hash, etc.)
            $stmt->close();
            $conexion->close();
            return ['status' => 'error', 'message' => 'No se aplicó el cambio de contraseña'];
        }

        $stmt->close();
        $conexion->close();

        return ['status' => 'success', 'message' => 'Contraseña actualizada correctamente'];
    }

    $conexion->close();
    return ['status' => 'error', 'message' => 'Función no válida'];
}

if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    $respuesta = manejarLogin();
    echo json_encode($respuesta);
}
