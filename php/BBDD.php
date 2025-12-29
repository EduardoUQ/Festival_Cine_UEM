<?php
$servidor = "localhost";
$usuario = "root";
$password = "";
$database = "festival_cine_uem";

// Conectar
$conexion = new mysqli($servidor, $usuario, $password);
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}

// Comprobar si la base de datos existe, y si no existe la crea
$sql = "SHOW DATABASES LIKE '$database'";
$comprobar = $conexion->query($sql);
if ($conexion->connect_error) {
    die("Error al comprobar la base de datos: " . $conexion->error);
}

if ($comprobar->num_rows <= 0) {

    // Crear y conectar con la base de datos
    $sql = "CREATE DATABASE $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"; //permite tildes, emojis y caracteres especiales. El unicode_ci define como comparar los textos ignorando las mayus/minus y comparando bien letras con tildes y letras de otros alfabetos.
    $conexion->query($sql) or die("Error al crear la base de datos");
    $conexion->select_db($database);

    // Crear tablas con la inserción de datos
    $sql = "
    CREATE TABLE admin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        dni VARCHAR(9) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        passwd_hash VARCHAR(255) NOT NULL,
        nombre_apellidos VARCHAR(255) NOT NULL
    ) ENGINE=InnoDB; 

    -- seleccionar el ENGINE InnoDB evita que se use otro por defecto que pueda dar problemas.

    CREATE TABLE gala (
        id INT AUTO_INCREMENT PRIMARY KEY,
        anio INT NOT NULL UNIQUE,
        logo_url VARCHAR(500),
        cartel_url VARCHAR(500),
        descripcion TEXT,
        activa BOOLEAN NOT NULL DEFAULT FALSE
    ) ENGINE=InnoDB;

    CREATE TABLE usuario (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre_apellidos VARCHAR(255) NOT NULL,
        dni VARCHAR(9) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        passwd_hash VARCHAR(255) NOT NULL,
        fecha_alta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        num_expediente VARCHAR(30) NOT NULL UNIQUE,
        anio_graduacion INT NOT NULL
    ) ENGINE=InnoDB;

    CREATE TABLE candidatura (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_usuario INT NOT NULL,
        id_gala INT NOT NULL,
        estado VARCHAR(20) NOT NULL,
        categoria VARCHAR(20) NOT NULL,
        comentarios TEXT NULL,
        titulo VARCHAR(255) NOT NULL,
        sinopsis TEXT NOT NULL,
        cartel_url VARCHAR(500) NULL,
        corto_url VARCHAR(500) NOT NULL,
        FOREIGN KEY (id_usuario) REFERENCES usuario(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        FOREIGN KEY (id_gala) REFERENCES gala(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        CHECK (estado IN ('PENDIENTE','ACEPTADA','RECHAZADA','NOMINADA','PREMIADA')),
        CHECK (categoria IN ('ALUMNO','ALUMNI'))
    ) ENGINE=InnoDB;

    -- Las restricciones ON UPDATE actualizan la información si el id de la gala o el del usuario cambia.
    -- Las restricciones ON DELETE no permiten borrar al usuario o la gala si tienen candidaturas ya hechas. Primero se borran las candidaturas y luego las galas/usuarios. 

    CREATE TABLE noticia (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        contenido TEXT NOT NULL,
        imagen_url VARCHAR(500),
        id_admin INT NOT NULL,
        FOREIGN KEY (id_admin) REFERENCES admin(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
    ) ENGINE=InnoDB;

    CREATE TABLE evento (
        id INT AUTO_INCREMENT PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        fecha DATE NOT NULL,
        id_admin INT NOT NULL,
        FOREIGN KEY (id_admin) REFERENCES admin(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
    ) ENGINE=InnoDB;

    CREATE TABLE patrocinador (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        logo_url VARCHAR(500),
        id_admin INT NOT NULL,
        FOREIGN KEY (id_admin) REFERENCES admin(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
    ) ENGINE=InnoDB;

    CREATE TABLE premio (
        id INT AUTO_INCREMENT PRIMARY KEY,
        categoria VARCHAR(30) NOT NULL,
        puesto INT NOT NULL,
        descripcion TEXT NOT NULL,
        dotacion DECIMAL(10,2) NULL,
        activa BOOLEAN NOT NULL DEFAULT TRUE,
        id_admin INT NOT NULL,
        FOREIGN KEY (id_admin) REFERENCES admin(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        UNIQUE (categoria, puesto)
    ) ENGINE=InnoDB;

    -- Impedimos que haya dos premios de la misma categoría y puesto. 

    CREATE TABLE ganador (
        id_gala INT NOT NULL,
        id_premio INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        sinopsis TEXT NOT NULL,
        cartel_url VARCHAR(500) NULL,
        corto_url VARCHAR(500) NOT NULL,
        PRIMARY KEY (id_gala, id_premio),
        FOREIGN KEY (id_gala) REFERENCES gala(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT,
        FOREIGN KEY (id_premio) REFERENCES premio(id)
            ON UPDATE CASCADE
            ON DELETE RESTRICT
    ) ENGINE=InnoDB;


    INSERT INTO admin (dni, email, passwd_hash, nombre_apellidos) VALUES
    ('00000000A', 'sara.delcastillo@universidadeuropea.es', '1234', 'Sara Del Castillo');

    INSERT INTO gala (anio, logo_url, cartel_url, descripcion, activa) VALUES
    (2026, 'uploads/logos/logo_gala_2026.png', 'uploads/carteles/cartel_gala_2026.jpg', 'Gala del Festival de Cine UEM 2026', TRUE);

    INSERT INTO usuario (nombre_apellidos, dni, email, passwd_hash, fecha_alta, num_expediente, anio_graduacion) VALUES
    ('Hugo Rubio', '12345678Z', 'hugo@correo.es', '1234', NOW(), '22441924', 2026);

    INSERT INTO candidatura (id_usuario, id_gala, estado, categoria, comentarios, titulo, sinopsis, cartel_url, corto_url) VALUES
    (1, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Corto de ejemplo 2: La venganza', 'Un corto sobre el esfuerzo y la superación en el entorno académico.', 'uploads/carteles/sombras_en_el_aula.jpg', 'uploads/cortos/sombras_en_el_aula.mp4');

    INSERT INTO premio (categoria, puesto, descripcion, dotacion, activa, id_admin) VALUES
    ('ALUMNO', 1, 'Mejor Corto (Alumno) - 1º Premio', 500.00, TRUE, 1),
    ('ALUMNO', 2, 'Mejor Corto (Alumno) - 2º Premio', 300.00, TRUE, 1),
    ('ALUMNO', 3, 'Mejor Corto (Alumno) - 3º Premio', 150.00, TRUE, 1),
    ('ALUMNI', 1, 'Mejor Corto (Alumni) - 1º Premio', 500.00, TRUE, 1),
    ('ALUMNI', 2, 'Mejor Corto (Alumni) - 2º Premio', 300.00, TRUE, 1),
    ('ESPECIAL', 1, 'Premio Especial del Certamen a una figura distinguida del sector', NULL, TRUE, 1);

    ";

    if ($conexion->multi_query($sql)) {
        while ($conexion->next_result()) { ; }
       
    } else {
        
    }

} else {

    $conexion->select_db($database);
}

?>
