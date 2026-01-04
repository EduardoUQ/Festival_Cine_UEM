<?php
session_start();
header('Content-Type: application/json; charset=utf-8');

require_once "conexion.php";
if (isset($_POST['funcion'])) {
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $pass  = isset($_POST['pass']) ? $_POST['pass'] : '';

    if ($email === '' || $pass === '') {
        echo json_encode(['status' => 'error', 'message' => 'Email y/o contraseña vacíos']);
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
        exit;
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows == 1) {
        $admin = $res->fetch_assoc();
        if (password_verify($pass, $admin['passwd_hash'])) {
            // Login admin correcto
            $_SESSION['rol'] = 'admin';
            $_SESSION['id']  = (int)$admin['id'];
            $_SESSION['email'] = $admin['email'];
            $_SESSION['nombre_apellidos'] = $admin['nombre_apellidos'];

            echo json_encode([
                'status' => 'success',
                'message' => 'Login admin correcto',
                'rol' => 'admin'
            ]);

            $stmt->close();
            $conexion->close();
            exit;
        }
    }
    // cerrar statement admin antes de seguir
    $stmt->close();


    /* ========= 2) PROBAR USUARIO ========= */
    $sqlUser = "SELECT id, email, passwd_hash, nombre_apellidos, dni, num_expediente, anio_graduacion
            FROM usuario
            WHERE email = ?
            LIMIT 1";

    $stmt2 = $conexion->prepare($sqlUser);
    if (!$stmt2) {
        echo json_encode(['status' => 'error', 'message' => 'Error interno (prepare usuario)']);
        exit;
    }

    $stmt2->bind_param("s", $email);
    $stmt2->execute();
    $res2 = $stmt2->get_result();

    if ($res2->num_rows == 1) {
        $user = $res2->fetch_assoc();
        // if (password_verify($pass, $user['passwd_hash'])) {
        // Login usuario correcto
        $_SESSION['rol'] = 'usuario';
        $_SESSION['id']  = (int)$user['id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['nombre_apellidos'] = $user['nombre_apellidos'];


        echo json_encode([
            'status' => 'success',
            'message' => 'Login usuario correcto',
            'rol' => 'usuario'
        ]);

        $stmt2->close();
        $conexion->close();
        exit;
        // }
    }

    echo json_encode(['status' => 'error', 'message' => 'Email y/o contraseña incorrectos']);

    $stmt2->close();
}
$conexion->close();
