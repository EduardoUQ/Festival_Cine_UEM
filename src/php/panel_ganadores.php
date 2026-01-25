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

/* =========================
   HELPERS
========================= */
function json_error($msg)
{
    echo json_encode(["status" => "error", "message" => $msg]);
    exit;
}

function json_ok($arr)
{
    $arr["status"] = "success";
    echo json_encode($arr);
    exit;
}

function getGalaActivaId($conexion)
{
    $res = $conexion->query("SELECT id FROM gala WHERE activa = TRUE LIMIT 1");
    if (!$res || $res->num_rows === 0) return null;
    $row = $res->fetch_assoc();
    return (int) $row["id"];
}

/* =========================
   BORRADO RECURSIVO DE CARPETA (ganadores)
========================= */
function borrar_directorio($dir)
{
    if (!is_dir($dir)) return;
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === "." || $item === "..") continue;
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            borrar_directorio($path);
        } else {
            @unlink($path);
        }
    }
    @rmdir($dir);
}

$funcion = $_POST["funcion"] ?? "";

/* =========================
   GET CATEGORÍAS (puesto>0 y activa)
========================= */
if ($funcion === "get_categorias") {

    $sql = "SELECT DISTINCT categoria
            FROM premio
            WHERE activa = TRUE AND puesto > 0
            ORDER BY categoria ASC";

    $res = $conexion->query($sql);
    if (!$res) json_error("Error al cargar categorías");

    $cats = [];
    while ($row = $res->fetch_assoc()) $cats[] = $row["categoria"];

    json_ok(["categorias" => $cats]);
}

/* =========================
   GET HONORÍFICOS (puesto=0 y activa)
========================= */
if ($funcion === "get_honorificos") {

    $sql = "SELECT id, descripcion
            FROM premio
            WHERE activa = TRUE AND puesto = 0
            ORDER BY id ASC";

    $res = $conexion->query($sql);
    if (!$res) json_error("Error al cargar honoríficos");

    $hon = [];
    while ($row = $res->fetch_assoc()) {
        $hon[] = [
            "id_premio" => (int) $row["id"],
            "descripcion" => $row["descripcion"]
        ];
    }

    json_ok(["honorificos" => $hon]);
}

/* =========================
   GET DATOS CATEGORÍA
========================= */
if ($funcion === "get_datos_categoria") {

    $categoria = trim($_POST["categoria"] ?? "");
    if ($categoria === "") json_error("Categoría inválida");

    $idGala = getGalaActivaId($conexion);
    if (!$idGala) json_error("No hay gala activa");

    // 1) Premios puestos de esa categoría
    $stmt = $conexion->prepare("
        SELECT id, puesto, descripcion, dotacion
        FROM premio
        WHERE activa = TRUE AND puesto > 0 AND categoria = ?
        ORDER BY puesto ASC
    ");
    $stmt->bind_param("s", $categoria);
    $stmt->execute();
    $res = $stmt->get_result();

    $premios = [];
    while ($row = $res->fetch_assoc()) {
        $premios[] = [
            "id_premio" => (int) $row["id"],
            "puesto" => (int) $row["puesto"],
            "descripcion" => $row["descripcion"],
            "dotacion" => $row["dotacion"] !== null ? (float) $row["dotacion"] : null
        ];
    }

    // 2) Nominados de esa categoría en gala activa
    $stmt2 = $conexion->prepare("
        SELECT c.id AS id_candidatura, c.titulo, u.nombre_apellidos
        FROM candidatura c
        INNER JOIN usuario u ON u.id = c.id_usuario
        WHERE c.id_gala = ? AND c.estado = 'NOMINADA' AND c.categoria = ?
        ORDER BY c.id DESC
    ");
    $stmt2->bind_param("is", $idGala, $categoria);
    $stmt2->execute();
    $res2 = $stmt2->get_result();

    $nominados = [];
    while ($row = $res2->fetch_assoc()) {
        $nominados[] = [
            "id_candidatura" => (int) $row["id_candidatura"],
            "titulo" => $row["titulo"],
            "nombre_apellidos" => $row["nombre_apellidos"]
        ];
    }

    // 3) Ya otorgados (ganador_corto) para esa categoría
    $stmt3 = $conexion->prepare("
        SELECT p.puesto, g.id_premio, g.nombre, g.titulo
        FROM ganador_corto g
        INNER JOIN premio p ON p.id = g.id_premio
        WHERE g.id_gala = ? AND p.categoria = ? AND p.puesto > 0
        ORDER BY p.puesto ASC
    ");
    $stmt3->bind_param("is", $idGala, $categoria);
    $stmt3->execute();
    $res3 = $stmt3->get_result();

    $ganadores = [];
    while ($row = $res3->fetch_assoc()) {
        $ganadores[] = [
            "puesto" => (int) $row["puesto"],
            "id_premio" => (int) $row["id_premio"],
            "nombre" => $row["nombre"],
            "titulo" => $row["titulo"]
        ];
    }

    json_ok([
        "premios" => $premios,
        "nominados" => $nominados,
        "ganadores" => $ganadores
    ]);
}

/* =========================
   GUARDAR GANADORES (ganador_corto)
========================= */
if ($funcion === "guardar_ganadores") {

    $categoria = trim($_POST["categoria"] ?? "");
    $datosJson = $_POST["datos"] ?? "";

    if ($categoria === "") json_error("Categoría inválida");
    if ($datosJson === "") json_error("No hay datos para guardar");

    $idGala = getGalaActivaId($conexion);
    if (!$idGala) json_error("No hay gala activa");

    $datos = json_decode($datosJson, true);
    if (!is_array($datos)) json_error("Datos inválidos");

    // 1) Validación: no duplicar candidatura entre puestos
    $seen = [];
    foreach ($datos as $d) {
        $idC = trim($d["id_candidatura"] ?? "");
        if ($idC === "") continue;
        if (isset($seen[$idC])) json_error("No puedes premiar la misma candidatura en dos puestos distintos.");
        $seen[$idC] = true;
    }

    // 2) Premios válidos de esa categoría (activos y puesto>0)
    $stmtPrem = $conexion->prepare("
        SELECT id, puesto
        FROM premio
        WHERE activa = TRUE AND puesto > 0 AND categoria = ?
    ");
    $stmtPrem->bind_param("s", $categoria);
    $stmtPrem->execute();
    $resPrem = $stmtPrem->get_result();

    $premiosValidos = []; // id_premio => puesto
    while ($row = $resPrem->fetch_assoc()) {
        $premiosValidos[(int) $row["id"]] = (int) $row["puesto"];
    }
    if (!count($premiosValidos)) json_error("No hay premios válidos para esa categoría.");

    // 3) Validar que (id_gala,id_premio) no exista ya (si se intenta premiar)
    foreach ($datos as $d) {
        $idPremio = (int) ($d["id_premio"] ?? 0);
        $idC = trim($d["id_candidatura"] ?? "");

        if ($idC === "") continue;
        if (!isset($premiosValidos[$idPremio])) json_error("Premio inválido para la categoría seleccionada.");

        $stmtChk = $conexion->prepare("SELECT 1 FROM ganador_corto WHERE id_gala = ? AND id_premio = ? LIMIT 1");
        $stmtChk->bind_param("ii", $idGala, $idPremio);
        $stmtChk->execute();
        $resChk = $stmtChk->get_result();
        if ($resChk && $resChk->num_rows > 0) {
            json_error("Ese premio ya tiene ganador asignado. No se puede volver a premiar el mismo premio.");
        }
    }

    // 4) Insertar (si viene vacío, no inserta -> permite desiertos)
    foreach ($datos as $d) {

        $idPremio = (int) ($d["id_premio"] ?? 0);
        $puesto   = (int) ($d["puesto"] ?? 0);
        $idC      = trim($d["id_candidatura"] ?? "");

        if ($idC === "") continue;
        if (!isset($premiosValidos[$idPremio])) json_error("Premio inválido para la categoría seleccionada.");

        // Validar candidatura y obtener datos completos
        $stmtC = $conexion->prepare("
            SELECT c.id, c.titulo, c.sinopsis, c.cartel_url, c.corto_url, u.nombre_apellidos
            FROM candidatura c
            INNER JOIN usuario u ON u.id = c.id_usuario
            WHERE c.id = ? AND c.id_gala = ? AND c.estado = 'NOMINADA' AND c.categoria = ?
            LIMIT 1
        ");
        $idCint = (int) $idC;
        $stmtC->bind_param("iis", $idCint, $idGala, $categoria);
        $stmtC->execute();
        $resC = $stmtC->get_result();
        if (!$resC || $resC->num_rows === 0) {
            json_error("Alguna candidatura seleccionada no es válida (no está nominada / no pertenece a esa gala o categoría).");
        }
        $rowC = $resC->fetch_assoc();

        $titulo = $rowC["titulo"];
        $sinopsis = $rowC["sinopsis"];
        $cartelUrl = $rowC["cartel_url"];
        $cortoUrl  = $rowC["corto_url"];
        $nombreGanador = $rowC["nombre_apellidos"];

        // Carpeta destino: ganadores/(id_gala)/(categoria)/premioX/
        $categoriaClean = preg_replace('/[^A-Za-z0-9_\-]/', '', $categoria);
        $destWebDir = "ganadores/" . $idGala . "/" . $categoriaClean . "/premio" . $puesto . "/";
        $destFisDir = __DIR__ . "/../" . $destWebDir;

        if (!is_dir($destFisDir)) {
            mkdir($destFisDir, 0777, true);
        }

        // Copiar cartel
        $nuevoCartel = null;
        if ($cartelUrl) {
            $srcCartelFis = __DIR__ . "/../" . $cartelUrl;
            if (!file_exists($srcCartelFis)) {
                json_error("No se encontró el cartel original de una candidatura. Revisa la ruta en uploads.");
            }

            $extCartel = pathinfo($srcCartelFis, PATHINFO_EXTENSION);
            $nuevoCartelNombre = "cartel." . ($extCartel ? $extCartel : "jpg");
            $dstCartelFis = $destFisDir . $nuevoCartelNombre;

            if (!copy($srcCartelFis, $dstCartelFis)) {
                json_error("Error copiando el cartel a la carpeta de ganadores.");
            }
            $nuevoCartel = $destWebDir . $nuevoCartelNombre;
        }

        // Copiar corto
        $nuevoCorto = null;
        if ($cortoUrl) {
            $srcCortoFis = __DIR__ . "/../" . $cortoUrl;
            if (!file_exists($srcCortoFis)) {
                json_error("No se encontró el vídeo original de una candidatura. Revisa la ruta en uploads.");
            }

            $extCorto = pathinfo($srcCortoFis, PATHINFO_EXTENSION);
            $nuevoCortoNombre = "corto." . ($extCorto ? $extCorto : "mp4");
            $dstCortoFis = $destFisDir . $nuevoCortoNombre;

            if (!copy($srcCortoFis, $dstCortoFis)) {
                json_error("Error copiando el vídeo a la carpeta de ganadores.");
            }
            $nuevoCorto = $destWebDir . $nuevoCortoNombre;
        }

        // Insert en ganador_corto
        $stmtIns = $conexion->prepare("
            INSERT INTO ganador_corto (id_gala, id_premio, nombre, titulo, sinopsis, cartel_url, corto_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtIns->bind_param(
            "iisssss",
            $idGala,
            $idPremio,
            $nombreGanador,
            $titulo,
            $sinopsis,
            $nuevoCartel,
            $nuevoCorto
        );

        if (!$stmtIns->execute()) {
            json_error("Error guardando ganador en BBDD.");
        }

        // Cambiar candidatura a PREMIADA
        $stmtUpd = $conexion->prepare("UPDATE candidatura SET estado = 'PREMIADA' WHERE id = ? LIMIT 1");
        $stmtUpd->bind_param("i", $idCint);
        $stmtUpd->execute();
    }

    json_ok(["message" => "Ganadores guardados correctamente"]);
}

/* =========================
   BORRAR GANADOR (ganador_corto)
   - Borra de ganador_corto
   - Revierte candidatura a NOMINADA
   - Borra carpeta ganadores/.../premioX/
========================= */
if ($funcion === "borrar_ganador") {

    $idPremio = (int) ($_POST["id_premio"] ?? 0);
    $categoria = trim($_POST["categoria"] ?? "");

    if ($idPremio <= 0) json_error("Premio inválido");
    if ($categoria === "") json_error("Categoría inválida");

    $idGala = getGalaActivaId($conexion);
    if (!$idGala) json_error("No hay gala activa");

    // 1) Obtener info del ganador (titulo/nombre) + puesto del premio
    $stmt = $conexion->prepare("
        SELECT g.titulo, g.nombre, p.puesto
        FROM ganador_corto g
        INNER JOIN premio p ON p.id = g.id_premio
        WHERE g.id_gala = ? AND g.id_premio = ?
        LIMIT 1
    ");
    $stmt->bind_param("ii", $idGala, $idPremio);
    $stmt->execute();
    $res = $stmt->get_result();

    if (!$res || $res->num_rows === 0) {
        json_error("No existe ese ganador para este premio en la gala activa.");
    }

    $row = $res->fetch_assoc();
    $tituloGanador = $row["titulo"];
    $nombreGanador = $row["nombre"];
    $puesto = (int) $row["puesto"];

    // 2) Borrar carpeta de ganadores (opcional, pero recomendado)
    $categoriaClean = preg_replace('/[^A-Za-z0-9_\-]/', '', $categoria);
    $dirFis = __DIR__ . "/../ganadores/" . $idGala . "/" . $categoriaClean . "/premio" . $puesto . "/";
    borrar_directorio($dirFis);

    // 3) Borrar registro de ganador_corto
    $stmtDel = $conexion->prepare("DELETE FROM ganador_corto WHERE id_gala = ? AND id_premio = ? LIMIT 1");
    $stmtDel->bind_param("ii", $idGala, $idPremio);
    if (!$stmtDel->execute()) {
        json_error("No se pudo borrar el ganador de la tabla.");
    }

    // 4) Revertir candidatura a NOMINADA sin id_candidatura:
    //    Buscamos la candidatura PREMIADA que coincida por titulo + nombre + gala + categoria
    $stmtFind = $conexion->prepare("
        SELECT c.id
        FROM candidatura c
        INNER JOIN usuario u ON u.id = c.id_usuario
        WHERE c.id_gala = ?
          AND c.categoria = ?
          AND c.estado = 'PREMIADA'
          AND c.titulo = ?
          AND u.nombre_apellidos = ?
        LIMIT 1
    ");
    $stmtFind->bind_param("isss", $idGala, $categoria, $tituloGanador, $nombreGanador);
    $stmtFind->execute();
    $resFind = $stmtFind->get_result();

    if ($resFind && $resFind->num_rows > 0) {
        $rowFind = $resFind->fetch_assoc();
        $idCandidatura = (int) $rowFind["id"];

        $stmtUpd = $conexion->prepare("UPDATE candidatura SET estado = 'NOMINADA' WHERE id = ? LIMIT 1");
        $stmtUpd->bind_param("i", $idCandidatura);
        $stmtUpd->execute();
    } else {
        // Aquí no rompo el borrado, pero aviso
        json_error("Se borró el ganador, pero NO se pudo localizar la candidatura a revertir (posible título/nombre duplicado).");
    }

    json_ok(["message" => "Ganador borrado y candidatura revertida a NOMINADA"]);
}

/* =========================
   ACCIÓN NO VÁLIDA
========================= */
json_error("Acción no válida");
