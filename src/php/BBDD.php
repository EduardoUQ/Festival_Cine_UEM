<?php
$servidor = "localhost";
$usuario  = "root";
$password = "";
$database = "festival_cine_uem";

// Conectar sin seleccionar BD (todavía puede no existir)
$conexion = new mysqli($servidor, $usuario, $password);
if ($conexion->connect_error) {
    die("Error de conexión: " . $conexion->connect_error);
}
$conexion->set_charset("utf8mb4");

// Si la BD ya existe, NO la recreamos (evita sobreescritura)
$sql = "SHOW DATABASES LIKE '$database'";
$comprobar = $conexion->query($sql);
if (!$comprobar) {
    die("Error al comprobar la base de datos: " . $conexion->error);
}

if ($comprobar->num_rows > 0) {
    die("La base de datos '$database' ya existe. Instalación cancelada para evitar sobreescritura.");
}

// Crear y usar la BD
$sql = "CREATE DATABASE $database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"; //utf8mb4 permite tildes, emojis y caracteres especiales. utf8mb4_unicode_ci define cómo se comparan los textos, ignorando mayus/minus y comparando bien acentos y letras internacionales.
$conexion->query($sql) or die("Error al crear la base de datos: " . $conexion->error);
$conexion->select_db($database);

// Cifrar la contraseña del admin
$hash = password_hash(1234, PASSWORD_DEFAULT);

// Crear tablas + inserts
$sql = "
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(9) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    passwd_hash VARCHAR(255) NOT NULL,
    nombre_apellidos VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
-- Hace que el motor de MySQL sea InnoDB forzadamente.

CREATE TABLE gala (
    id INT AUTO_INCREMENT PRIMARY KEY,
    anio INT NOT NULL UNIQUE,
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
    CHECK (estado IN ('PENDIENTE','ACEPTADA','RECHAZADA','NOMINADA','PREMIADA','SUBSANAR')),
    CHECK (categoria IN ('ALUMNO','ALUMNI'))
) ENGINE=InnoDB;

CREATE TABLE noticia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    imagen_url VARCHAR(500),
    fecha DATE NOT NULL,
    id_admin INT NOT NULL,
    FOREIGN KEY (id_admin) REFERENCES admin(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE evento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion VARCHAR(500) NOT NULL,
    localizacion VARCHAR(255) NOT NULL,
    fecha DATE NOT NULL,
    hora VARCHAR(20) NOT NULL,
    id_admin INT NOT NULL,
    FOREIGN KEY (id_admin) REFERENCES admin(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE patrocinador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    color_hex VARCHAR(6) NULL,
    web_url VARCHAR(500) NULL,
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

CREATE TABLE ganador_corto (
    id_gala INT NOT NULL,
    id_premio INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    titulo VARCHAR(255),
    sinopsis TEXT,
    cartel_url VARCHAR(500),
    corto_url VARCHAR(500),
    PRIMARY KEY (id_gala, id_premio),
    FOREIGN KEY (id_gala) REFERENCES gala(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (id_premio) REFERENCES premio(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE ganador_honorifico (
    id_gala INT NOT NULL,
    id_premio INT NOT NULL,
    nombre_apellidos VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(15),
    video_url VARCHAR(500),
    PRIMARY KEY (id_gala, id_premio),
    FOREIGN KEY (id_gala) REFERENCES gala(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    FOREIGN KEY (id_premio) REFERENCES premio(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO admin (dni, email, passwd_hash, nombre_apellidos) VALUES
('00000000A', 'sara.delcastillo@universidadeuropea.es', '$hash', 'Sara Del Castillo');

INSERT INTO gala (anio, cartel_url, descripcion, activa) VALUES
(2026, 'uploads/carteles/cartel_gala_2026.jpg', 'Gala del Festival de Cine UEM 2026', TRUE);

INSERT INTO usuario (nombre_apellidos, dni, email, passwd_hash, fecha_alta, num_expediente, anio_graduacion) VALUES
('Hugo Rubio', '12345678Z', 'hugo@correo.es', '$hash', NOW(), '22441924', 2026),
('Edu Utrilla', '23456789A', 'edu@correo.es', '$hash', NOW(), '22441925', 2026),
('Toby Alonso', '34567890B', 'toby@correo.es', '$hash', NOW(), '22441926', 2026);

INSERT INTO candidatura (id_usuario, id_gala, estado, categoria, comentarios, titulo, sinopsis, cartel_url, corto_url) VALUES
(1, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Luces de Pasillo', 'Un grupo de alumnos se enfrenta a su última entrega antes del festival.', 'uploads/candidaturas/1/1/cartel.jpg', 'uploads/candidaturas/1/1/corto.mp4'),
(2, 1, 'SUBSANAR', 'ALUMNO', NULL, 'Plano Secuencia', 'Un rodaje improvisado pone a prueba a todo el equipo.', 'uploads/candidaturas/2/2/cartel.jpg', 'uploads/candidaturas/2/2/corto.mp4'),
(3, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Corte y Acción', 'Una idea brillante nace justo cuando se acaba el tiempo.', 'uploads/candidaturas/3/3/cartel.jpg', 'uploads/candidaturas/3/3/corto.mp4');

INSERT INTO noticia (titulo, contenido, imagen_url, fecha, id_admin) VALUES
('Arranca la semana del Festival de Cortos UEM', 'Ya están abiertas las actividades previas y la cuenta atrás para la gala de 2026.', 'uploads/noticias/noticia_6970a6fad3d56.png', '2026-01-20', 1),
('Nuevas proyecciones y charlas para participantes', 'Se anuncian sesiones informativas sobre guion, montaje y presentación de candidaturas.', 'uploads/noticias/noticia_696f49f10b86c.png', '2026-01-21', 1),
('Publicadas las bases definitivas y fechas clave', 'Consulta el calendario oficial, requisitos de entrega y criterios de evaluación del jurado.', 'uploads/noticias/noticia_696ba785bbcd2.png', '2026-01-22', 1);

INSERT INTO evento (titulo, descripcion, localizacion, fecha, hora, id_admin) VALUES
('Taller de Pitch para Cortos', 'Sesión práctica para preparar la presentación del corto ante jurado y público.', 'Edificio A', '2026-01-05', '18:00', 1),
('Masterclass: Montaje y Ritmo Narrativo', 'Claves de edición para mejorar ritmo, tensión y coherencia en cortometrajes.', 'Edificio B', '2026-01-06', '19:30', 1),
('Encuentro Online de Preguntas y Respuestas', 'Resolución de dudas sobre entregas, formatos y evaluación del Festival de Cortos UEM.', 'Online', '2026-01-07', '17:00', 1);

INSERT INTO premio (categoria, puesto, descripcion, dotacion, activa, id_admin) VALUES
('ALUMNO', 1, 'Mejor Corto (Alumno) - 1º Premio', 500.00, TRUE, 1),
('ALUMNO', 2, 'Mejor Corto (Alumno) - 2º Premio', 300.00, TRUE, 1),
('ALUMNO', 3, 'Mejor Corto (Alumno) - 3º Premio', 150.00, TRUE, 1),
('ALUMNI', 1, 'Mejor Corto (Alumni) - 1º Premio', 500.00, TRUE, 1),
('ALUMNI', 2, 'Mejor Corto (Alumni) - 2º Premio', 300.00, TRUE, 1),
('ESPECIAL', 1, 'Premio Especial del Certamen a una figura distinguida del sector', NULL, TRUE, 1);

INSERT INTO patrocinador (nombre, logo_url, color_hex, web_url, id_admin) VALUES 
('Canon','img/canon.png','FFFFFF','https://www.canon.es',1);
";

if ($conexion->multi_query($sql)) {
    while ($conexion->next_result()) {;
    }
} else {
}

$conexion->close();
