<?php
session_start();
include("conexion.php");
header('Content-Type: application/json; charset=utf-8');

//Recogemos el id del admin de la sesión (si lo tienes guardado así)
$id_admin = isset($_SESSION["id_admin"]) ? (int)$_SESSION["id_admin"] : 0;

//llamado a la función para procesar los datos
if (isset($_POST['funcion'])) {

    if ($_POST['funcion'] === "publicar_evento") {
        //Obtenemos los datos del formulario
        $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : "";
        $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : "";
        $fecha  = isset($_POST['fecha']) ? trim($_POST['fecha']) : "";
        $location = isset($_POST['localizacion']) ? trim($_POST['localizacion']) : "";
        $hora = isset($_POST["hora"]) ? trim($_POST["hora"]) : "";

        //Validaciones
        if ($titulo === '' || $descripcion === '' || $fecha === '' || $location === '' || $hora === '') {
            echo json_encode([
                "status"  => "error",
                "message" => "Todos los campos son obligatorios"
            ]);
            exit;
        }

        //Validar rango de fechas
        $hoy = date("Y-m-d");
        $fecha_maxima = "2026-12-21";

        if ($fecha < $hoy) {
            echo json_encode([
                "status"  => "error",
                "message" => "La fecha no puede ser anterior a hoy"
            ]);
            exit;
        }

        if ($fecha > $fecha_maxima) {
            echo json_encode([
                "status"  => "error",
                "message" => "La fecha no puede ser posterior al 21/12/2026"
            ]);
            exit;
        }

        //Insertar en BD
        $sql_insertar = "INSERT INTO evento (titulo, descripcion, localizacion, fecha, hora, id_admin)
                         VALUES (?, ?, ?, ?, ?, ?)";
        $stmt = $conexion->prepare($sql_insertar);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Error preparando el INSERT"]);
            exit;
        }

        $stmt->bind_param("sssssi", $titulo, $descripcion, $location,  $fecha, $hora, $id_admin);
        $stmt->execute();

        echo json_encode([
            "status"  => "success",
            "message" => "Evento publicado correctamente"
        ]);
        exit;
    } elseif ($_POST['funcion'] === 'listar_eventos') {

        $page = isset($_POST["page"]) ? (int)$_POST["page"] : 1;
        $per_page = isset($_POST["per_page"]) ? (int)$_POST["per_page"] : 8;
        $filtro = isset($_POST["filtro"]) ? $_POST["filtro"] : "todos";

        if ($page < 1) $page = 1;
        if ($per_page < 1) $per_page = 8;
        if ($per_page > 50) $per_page = 50;

        $offset = ($page - 1) * $per_page;

        // Fecha de la gala activa (si existe)
        $fechaGala = null;
        $resGala = $conexion->query("SELECT fecha_evento FROM gala WHERE activa = 1 LIMIT 1");
        if ($resGala && $resGala->num_rows > 0) {
            $fechaGala = $resGala->fetch_assoc()["fecha_evento"];
        }

        // WHERE dinámico según filtro
        $where = "";
        $params = [];
        $types = "";

        if ($filtro === "gala" && $fechaGala) {
            $where = "WHERE fecha = ?";
            $params[] = $fechaGala;
            $types .= "s";
        } elseif ($filtro === "otros" && $fechaGala) {
            $where = "WHERE fecha <> ?";
            $params[] = $fechaGala;
            $types .= "s";
        }
        // si no hay gala activa, "gala" y "otros" se comportan como "todos"

        // COUNT total
        $sqlCount = "SELECT COUNT(*) AS total FROM evento $where";
        $stmtCount = $conexion->prepare($sqlCount);
        if (!$stmtCount) {
            echo json_encode(["status" => "error", "message" => "Error preparando COUNT"]);
            exit;
        }

        if ($types !== "") {
            $stmtCount->bind_param($types, ...$params);
        }
        $stmtCount->execute();
        $resCount = $stmtCount->get_result();
        $rowCount = $resCount->fetch_assoc();
        $total = (int)$rowCount["total"];

        if ($total === 0) {
            echo json_encode([
                "status" => "success",
                "total" => 0,
                "page" => $page,
                "per_page" => $per_page,
                "from" => 0,
                "to" => 0,
                "eventos" => []
            ]);
            exit;
        }

        // Ajustar página si se pasa del máximo
        $maxPage = (int)ceil($total / $per_page);
        if ($page > $maxPage) {
            $page = $maxPage;
            $offset = ($page - 1) * $per_page;
        }

        // Datos paginados
        $sql = "
            SELECT id, titulo, descripcion, fecha, hora, localizacion
            FROM evento
            $where
            ORDER BY fecha ASC, hora ASC
            LIMIT ? OFFSET ?
        ";

        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Error preparando SELECT"]);
            exit;
        }

        $types2 = $types . "ii";
        $params2 = array_merge($params, [$per_page, $offset]);
        $stmt->bind_param($types2, ...$params2);

        $stmt->execute();
        $result = $stmt->get_result();

        $eventos = [];
        while ($fila = $result->fetch_assoc()) {
            $eventos[] = $fila;
        }

        echo json_encode([
            "status" => "success",
            "total" => $total,
            "page" => $page,
            "per_page" => $per_page,
            "from" => $offset + 1,
            "to" => $offset + count($eventos),
            "eventos" => $eventos,
            "fecha_gala" => $fechaGala // por si luego quieres mostrarla en el panel
        ]);
        exit;
    } elseif ($_POST['funcion'] === "borrar_evento") {
        $id = isset($_POST["id"]) ? (int)$_POST["id"] : 0;

        if ($id <= 0) {
            echo json_encode([
                "status" => "error",
                "message" => "Id de evento no válido"
            ]);
            exit;
        }

        $sql = "DELETE FROM evento WHERE id = ?";
        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Error preparando DELETE"]);
            exit;
        }

        $stmt->bind_param("i", $id);
        $stmt->execute();

        echo json_encode([
            "status" => "success",
            "message" => "Evento borrado correctamente"
        ]);
        exit;
    } elseif ($_POST['funcion'] === "obtener_evento") {
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

        if ($id <= 0) {
            echo json_encode(["status" => "error", "message" => "Id no válido"]);
            exit;
        }

        $sql = "SELECT id, titulo, descripcion, fecha, hora, localizacion
                FROM evento
                WHERE id = ?";

        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Error preparando SELECT"]);
            exit;
        }

        $stmt->bind_param("i", $id);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["status" => "error", "message" => "Evento no encontrado"]);
            exit;
        }

        $evento = $result->fetch_assoc();

        echo json_encode([
            "status" => "success",
            "evento" => $evento
        ]);
        exit;
    } elseif ($_POST['funcion'] === 'editar_evento') {
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

        $titulo = isset($_POST['titulo']) ? trim($_POST['titulo']) : "";
        $descripcion = isset($_POST['descripcion']) ? trim($_POST['descripcion']) : "";
        $fecha = isset($_POST['fecha']) ? trim($_POST['fecha']) : "";
        $location = isset($_POST['localizacion']) ? trim($_POST['localizacion']) : "";
        $hora = isset($_POST['hora']) ? trim($_POST['hora']) : "";

        if ($id <= 0 || $titulo === '' || $descripcion === '' || $fecha === '' || $location === '' || $hora === '') {
            echo json_encode(["status" => "error", "message" => "Todos los campos son obligatorios"]);
            exit;
        }

        $sql = "UPDATE evento
                SET titulo = ?, descripcion = ?, localizacion = ?, fecha = ?, hora = ?
                WHERE id = ?";

        $stmt = $conexion->prepare($sql);
        if (!$stmt) {
            echo json_encode(["status" => "error", "message" => "Error preparando UPDATE"]);
            exit;
        }

        $stmt->bind_param("sssssi", $titulo, $descripcion, $location, $fecha, $hora, $id);
        $stmt->execute();

        echo json_encode([
            "status" => "success",
            "message" => "Evento actualizado correctamente"
        ]);
        exit;
    } elseif ($_POST['funcion'] === 'comprobar_evento') {

        $fecha = isset($_POST['fecha']) ? trim($_POST['fecha']) : "";
        $hora = isset($_POST['hora']) ? trim($_POST['hora']) : "";
        $location = isset($_POST['localizacion']) ? trim($_POST['localizacion']) : "";
        $modo = isset($_POST['modo']) ? $_POST['modo'] : "completo";
        $id = isset($_POST['id']) ? (int)$_POST['id'] : 0;

        //Comprobacion exacta
        if ($id > 0) {
            $sqlExacto = "SELECT id FROM evento WHERE fecha = ? AND hora = ? AND localizacion = ? AND id <> ? LIMIT 1";
            $stmt = $conexion->prepare($sqlExacto);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Error preparando comprobación exacta"]);
                exit;
            }
            $stmt->bind_param("sssi", $fecha, $hora, $location, $id);
        } else {
            $sqlExacto = "SELECT id FROM evento WHERE fecha = ? AND hora = ? AND localizacion = ? LIMIT 1";
            $stmt = $conexion->prepare($sqlExacto);
            if (!$stmt) {
                echo json_encode(["status" => "error", "message" => "Error preparando comprobación exacta"]);
                exit;
            }
            $stmt->bind_param("sss", $fecha, $hora, $location);
        }

        $stmt->execute();
        $res = $stmt->get_result();

        if ($res->num_rows > 0) {
            echo json_encode([
                "status" => "error",
                "tipo" => "exacto",
                "message" => "Ya existe un evento programado en esa fecha, hora y localización"
            ]);
            exit;
        }

        //Si solo queremos exacto, salimos aquí
        if ($modo === "exacto") {
            echo json_encode([
                "status" => "success",
                "tipo" => "ok"
            ]);
            exit;
        }

        //Comprobación MISMA FECHA (lista de eventos de ese día)
        if ($id > 0) {
            $sqlFecha = "SELECT titulo, hora, localizacion FROM evento WHERE fecha = ? AND id <> ? ORDER BY hora ASC";
            $stmt2 = $conexion->prepare($sqlFecha);
            if (!$stmt2) {
                echo json_encode(["status" => "error", "message" => "Error preparando comprobación por fecha"]);
                exit;
            }
            $stmt2->bind_param("si", $fecha, $id);
        } else {
            $sqlFecha = "SELECT titulo, hora, localizacion FROM evento WHERE fecha = ? ORDER BY hora ASC";
            $stmt2 = $conexion->prepare($sqlFecha);
            if (!$stmt2) {
                echo json_encode(["status" => "error", "message" => "Error preparando comprobación por fecha"]);
                exit;
            }
            $stmt2->bind_param("s", $fecha);
        }

        $stmt2->execute();
        $res2 = $stmt2->get_result();

        $eventos = [];
        while ($fila = $res2->fetch_assoc()) {
            $eventos[] = $fila;
        }

        if (count($eventos) > 0) {
            echo json_encode([
                "status" => "warning",
                "tipo" => "fecha",
                "eventos" => $eventos
            ]);
            exit;
        }

        echo json_encode([
            "status" => "success",
            "tipo" => "ok"
        ]);
        exit;
    }
}

$conexion->close();
