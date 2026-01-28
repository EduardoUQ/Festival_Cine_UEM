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
    fecha_evento DATE NOT NULL,
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

INSERT INTO gala (anio, cartel_url, descripcion, fecha_evento, activa) VALUES
(2026, 'uploads/carteles/cartel_gala_2026.jpg', 'Gala del Festival de Cine UEM 2026','2026-12-11', TRUE);

INSERT INTO usuario (nombre_apellidos, dni, email, passwd_hash, fecha_alta, num_expediente, anio_graduacion) VALUES
('Hugo Rubio', '12345678Z', 'hugo@correo.es', '$hash', NOW(), '22441924', 2026),
('Edu Utrilla', '23456789A', 'edu@correo.es', '$hash', NOW(), '22441925', 2026),
('Toby Alonso', '34567890B', 'toby@correo.es', '$hash', NOW(), '22441926', 2026),
('Irene del Rincón', '45678901C', 'irene@correo.es', '$hash', NOW(), '22441927', 2024),
('Lucía Martín', '56789012D', 'lucia.martin@correo.es', '$hash', NOW(), '22441928', 2026),
('Diego Serrano', '67890123E', 'diego.serrano@correo.es', '$hash', NOW(), '22441929', 2026),
('Clara Vega', '78901234F', 'clara.vega@correo.es', '$hash', NOW(), '22441930', 2026),
('Sergio Ramos', '89012345G', 'sergio.ramos@correo.es', '$hash', NOW(), '22441931', 2026),
('Paula Ortiz', '90123456H', 'paula.ortiz@correo.es', '$hash', NOW(), '22441932', 2026),
('Álvaro Núñez', '01234567J', 'alvaro.nunez@correo.es', '$hash', NOW(), '22441933', 2026),
('Nerea Blanco', '11223344K', 'nerea.blanco@correo.es', '$hash', NOW(), '22441934', 2026),
('Javier Prieto', '22334455L', 'javier.prieto@correo.es', '$hash', NOW(), '22441935', 2026),
('Marina Soler', '33445566M', 'marina.soler@correo.es', '$hash', NOW(), '22441936', 2026),
('Iván Cabrera', '44556677N', 'ivan.cabrera@correo.es', '$hash', NOW(), '22441937', 2026);

INSERT INTO candidatura (id_usuario, id_gala, estado, categoria, comentarios, titulo, sinopsis, cartel_url, corto_url) VALUES
(1, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Luces de Pasillo', 'Un grupo de alumnos se enfrenta a su última entrega antes del festival.', 'uploads/candidaturas/1/1/cartel.jpg', 'uploads/candidaturas/1/1/corto.mp4'),
(2, 1, 'SUBSANAR', 'ALUMNO', NULL, 'Plano Secuencia', 'Un rodaje improvisado pone a prueba a todo el equipo.', 'uploads/candidaturas/2/2/cartel.jpg', 'uploads/candidaturas/2/2/corto.mp4'),
(3, 1, 'ACEPTADA', 'ALUMNO', NULL, 'Corte y Acción', 'Una idea brillante nace justo cuando se acaba el tiempo.', 'uploads/candidaturas/3/3/cartel.jpg', 'uploads/candidaturas/3/3/corto.mp4'),
(4, 1, 'NOMINADA', 'ALUMNI', NULL, 'Eco de Pantalla', 'Una antigua grabación reabre un recuerdo que parecía cerrado.', 'uploads/candidaturas/4/4/cartel.jpg', 'uploads/candidaturas/4/4/corto.mp4'),
(1, 1, 'NOMINADA', 'ALUMNO', NULL, 'Última Toma', 'En el último minuto, todo el equipo debe decidir entre rendirse o rodar.', 'uploads/candidaturas/1/5/cartel.jpg', 'uploads/candidaturas/1/5/corto.mp4'),

(5, 1, 'PENDIENTE', 'ALUMNO', NULL, 'A Contraluz', 'Un proyecto nocturno revela la verdadera amistad del equipo.', 'uploads/candidaturas/5/6/cartel.jpg', 'uploads/candidaturas/5/6/corto.mp4'),
(6, 1, 'PENDIENTE', 'ALUMNO', NULL, 'El Último Render', 'Una exportación fallida obliga a rehacerlo todo en una noche.', 'uploads/candidaturas/6/7/cartel.jpg', 'uploads/candidaturas/6/7/corto.mp4'),
(7, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Silencio en Set', 'El sonido desaparece y el equipo improvisa una solución.', 'uploads/candidaturas/7/8/cartel.jpg', 'uploads/candidaturas/7/8/corto.mp4'),
(8, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Storyboard', 'Un cuaderno perdido cambia el rumbo del rodaje.', 'uploads/candidaturas/8/9/cartel.jpg', 'uploads/candidaturas/8/9/corto.mp4'),
(9, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Foco', 'Una luz fundida desencadena un efecto inesperado en la escena.', 'uploads/candidaturas/9/10/cartel.jpg', 'uploads/candidaturas/9/10/corto.mp4'),
(10, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Toma Dos', 'Repetir la escena se convierte en la clave para mejorar el corto.', 'uploads/candidaturas/10/11/cartel.jpg', 'uploads/candidaturas/10/11/corto.mp4'),
(11, 1, 'PENDIENTE', 'ALUMNO', NULL, 'El Plano Perdido', 'Aparece una grabación que nadie recuerda haber hecho.', 'uploads/candidaturas/11/12/cartel.jpg', 'uploads/candidaturas/11/12/corto.mp4'),
(12, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Cinta Roja', 'Un simple marcador de escena se vuelve imprescindible.', 'uploads/candidaturas/12/13/cartel.jpg', 'uploads/candidaturas/12/13/corto.mp4'),
(13, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Días de Montaje', 'Las prisas y el cansancio ponen a prueba al editor.', 'uploads/candidaturas/13/14/cartel.jpg', 'uploads/candidaturas/13/14/corto.mp4'),
(14, 1, 'PENDIENTE', 'ALUMNO', NULL, 'Cámara en Mano', 'Un rodaje sin trípode acaba siendo el estilo perfecto.', 'uploads/candidaturas/14/15/cartel.jpg', 'uploads/candidaturas/14/15/corto.mp4');

INSERT INTO noticia (titulo, contenido, imagen_url, fecha, id_admin) VALUES
('Arranca la semana del Festival de Cortos UEM', 'Ya están abiertas las actividades previas y la cuenta atrás para la gala de 2026.', 'noticias/noticia_6970a6fad3d56.png', '2026-01-20', 1),
('Nuevas proyecciones y charlas para participantes', 'Se anuncian sesiones informativas sobre guion, montaje y presentación de candidaturas.', 'noticias/noticia_696f49f10b86c.png', '2026-01-21', 1),
('Publicadas las bases definitivas y fechas clave', 'Consulta el calendario oficial, requisitos de entrega y criterios de evaluación del jurado.', 'noticias/noticia_696ba785bbcd2.png', '2026-01-22', 1),

('Se amplía el horario de asesorías de guion', 'Durante esta semana habrá tutorías extra para pulir sinopsis y estructura narrativa.', 'noticias/noticia_6970a6fad3d56.png', '2026-01-26', 1),
('Nueva tanda de revisiones técnicas de vídeo', 'El equipo técnico revisará formatos y códecs para evitar rechazos por incompatibilidad.', 'noticias/noticia_696f49f10b86c.png', '2026-01-25', 1),
('Publicada la guía rápida de entrega de archivos', 'Recuerda nombrar correctamente el cartel y el corto y respetar las rutas de subida.', 'noticias/noticia_696ba785bbcd2.png', '2026-01-24', 1),
('Arrancan las sesiones de visionado interno', 'Se inicia el visionado previo para organizar la programación de proyecciones.', 'noticias/noticia_6970a6fad3d56.png', '2026-01-23', 1),
('Consejos de sonido para cortometrajes', 'Recomendaciones para limpiar ruido, niveles y exportar audio sin distorsión.', 'noticias/noticia_696f49f10b86c.png', '2026-01-22', 1),
('Carteles: tamaño y proporciones recomendadas', 'Se recuerdan las proporciones y peso máximo para que se vean bien en la web.', 'noticias/noticia_696ba785bbcd2.png', '2026-01-21', 1),
('Recordatorio: categorías ALUMNO y ALUMNI', 'Comprueba tu año de graduación antes de enviar para evitar incidencias.', 'noticias/noticia_6970a6fad3d56.png', '2026-01-20', 1),
('FAQ actualizado con dudas frecuentes', 'Se actualiza el apartado de preguntas frecuentes sobre candidaturas y estados.', 'noticias/noticia_696f49f10b86c.png', '2026-01-19', 1),
('Convocatoria de voluntariado para el festival', 'Se abre inscripción para apoyar en sala, acreditaciones y coordinación.', 'noticias/noticia_696ba785bbcd2.png', '2026-01-24', 1),
('Avance del programa de actividades', 'Se adelantan algunas masterclass y encuentros previstos para los participantes.', 'noticias/noticia_6970a6fad3d56.png', '2026-01-25', 1);

INSERT INTO evento (titulo, descripcion, localizacion, fecha, hora, id_admin) VALUES
('Taller de Pitch para Cortos', 'Sesión práctica para preparar la presentación del corto ante jurado y público.', 'Edificio A', '2026-01-05', '18:00', 1),
('Masterclass: Montaje y Ritmo Narrativo', 'Claves de edición para mejorar ritmo, tensión y coherencia en cortometrajes.', 'Edificio B', '2026-01-06', '19:30', 1),
('Encuentro Online de Preguntas y Respuestas', 'Resolución de dudas sobre entregas, formatos y evaluación del Festival de Cortos UEM.', 'Online', '2026-01-07', '17:00', 1),

('Apertura de acreditaciones', 'Recogida de acreditaciones y pulseras de acceso para asistentes.', 'Hall Principal', '2026-12-11', '09:00', 1),
('Ensayo técnico de proyección', 'Pruebas de vídeo, audio y subtítulos en sala antes de la gala.', 'Sala de Proyecciones', '2026-12-11', '10:00', 1),
('Photocall y prensa', 'Paso por photocall y atención a medios y entrevistas.', 'Entrada Auditorio', '2026-12-11', '11:00', 1),
('Mesa redonda: Producción de cortos', 'Charla con invitados sobre producción y distribución de cortometrajes.', 'Edificio A', '2026-12-11', '12:00', 1),
('Pausa networking', 'Encuentro informal entre equipos, jurado e invitados.', 'Zona Café', '2026-12-11', '13:00', 1),
('Comida de equipos finalistas', 'Comida organizada para finalistas y coordinación del festival.', 'Comedor Campus', '2026-12-11', '14:30', 1),
('Apertura de puertas Gala', 'Acceso del público y acomodación en butacas.', 'Auditorio', '2026-12-11', '16:30', 1),
('Proyección de finalistas', 'Bloque de proyección de cortometrajes finalistas.', 'Auditorio', '2026-12-11', '17:00', 1),
('Entrega de premios', 'Ceremonia de entrega de premios por categorías.', 'Auditorio', '2026-12-11', '19:00', 1),
('Cierre y cóctel', 'Cierre del evento con cóctel de despedida.', 'Hall Principal', '2026-12-11', '20:30', 1),

('Sesión informativa: normas de entrega', 'Revisión de requisitos, formatos y fechas del festival.', 'Online', '2026-02-03', '18:00', 1),
('Taller básico de iluminación', 'Práctica con esquemas de luz para interiores y exteriores.', 'Edificio B', '2026-02-10', '17:30', 1),
('Clínica de montaje', 'Consejos de edición y ritmo con ejemplos de cortos.', 'Edificio A', '2026-02-17', '19:00', 1),
('Revisión de sonido y mezcla', 'Buenas prácticas para niveles y exportación final.', 'Edificio B', '2026-02-24', '18:30', 1),
('Q&A con coordinación del festival', 'Dudas abiertas sobre candidaturas, categorías y estados.', 'Online', '2026-02-28', '12:00', 1);

INSERT INTO premio (categoria, puesto, descripcion, dotacion, activa, id_admin) VALUES
('ALUMNO', 1, 'Mejor Corto (Alumno) - 1º Premio', 500.00, TRUE, 1),
('ALUMNO', 2, 'Mejor Corto (Alumno) - 2º Premio', 300.00, TRUE, 1),
('ALUMNO', 3, 'Mejor Corto (Alumno) - 3º Premio', 150.00, TRUE, 1),
('ALUMNI', 1, 'Mejor Corto (Alumni) - 1º Premio', 500.00, TRUE, 1),
('ALUMNI', 2, 'Mejor Corto (Alumni) - 2º Premio', 300.00, TRUE, 1),
('ESPECIAL', 0, 'Premio Especial del Certamen a una figura distinguida del sector', NULL, TRUE, 1);

INSERT INTO patrocinador (nombre, logo_url, color_hex, web_url, id_admin) VALUES 
('Canon','patrocinadores/patrocinador_Canon.png','FFFFFF','https://www.canon.es',1);
";

if ($conexion->multi_query($sql)) {
    while ($conexion->next_result()) {;
    }
} else {
}

$conexion->close();
