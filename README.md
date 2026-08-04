# Festival de Cine UEM

Aplicacion web para la gestión y promoción del Festival de Cine UEM. El proyecto permite consultar información pública del certamen, revisar bases legales, noticias, calendario, premios y galas, ademas de gestionar candidaturas de cortometrajes mediante perfiles de usuario y paneles de administración.

## Descripción

El sitio esta orientado a centralizar la experiencia del festival universitario de cortometrajes: participantes, estudiantes alumni, administradores y visitantes pueden acceder a distintas secciones segun su rol.

Entre sus funcionalidades principales se incluyen:

- Página pública con slider audiovisual, noticias, premios, galas anteriores y patrocinadores.
- Consulta de bases legales, calendario de actividades y detalle de galas.
- Login para usuarios y administradores.
- Subida y seguimiento de candidaturas de cortometrajes.
- Panel de usuario para consultar perfil, candidaturas y detalle de estado.
- Panel de administrador para gestionar candidaturas, calendario, galas, premios, noticias, patrocinadores y ganadores.
- Almacenamiento de carteles, videos, galeria, noticias y ganadores.
- Inicialización automática de base de datos con datos de ejemplo si no existe.

## Tecnologías

- **Frontend:** HTML5, CSS3 y JavaScript.
- **Backend:** PHP.
- **Base de datos:** MySQL/MariaDB mediante `mysqli`.
- **Servidor local recomendado:** XAMPP, con Apache y MySQL activos.
- **Iconos:** Font Awesome.
- **Gestion de dependencias:** Composer.
- **Testing:** PHPUnit 11.

## Estructura del proyecto

```text
Festival_Cine_UEM/
|-- documentacion/       # PDFs y documentación del festival
|-- src/
|   |-- css/             # Hojas de estilo por pantalla
|   |-- font/            # Fuentes locales
|   |-- ganadores/       # Recursos multimedia de ganadores
|   |-- html/            # Vistas HTML de la aplicacion
|   |-- img/             # Imagenes del sitio
|   |-- js/              # Lógica de cliente y llamadas fetch
|   |-- noticias/        # Imagenes subidas para noticias
|   |-- php/             # Endpoints, autenticacion y acceso a datos
|   |-- uploads/         # Archivos subidos por usuarios y administradores
|   `-- videos/          # Videos del hero principal
|-- tests/               # Pruebas PHPUnit
|-- vendor/              # Dependencias instaladas por Composer
|-- composer.json
|-- phpunit.xml
`-- README.md
```

## Requisitos

Antes de ejecutar el proyecto en local, instala o activa:

- PHP compatible con PHPUnit 11.
- Apache.
- MySQL o MariaDB.
- Composer.
- XAMPP, recomendado para ejecutar Apache y MySQL de forma sencilla en Windows.

## Ejecucion en local

1. Copia o clona el proyecto dentro de la carpeta `htdocs` de XAMPP.

   Ejemplo de ruta:

   ```text
   C:\xampp\htdocs\Festival_Cine_UEM\Festival_Cine_UEM
   ```

2. Abre el panel de XAMPP e inicia:

   - Apache
   - MySQL

3. Instala las dependencias de PHP si no existe la carpeta `vendor` o si quieres regenerarla:

   ```bash
   composer install
   ```

4. Abre la aplicacion en el navegador:

   ```text
   http://localhost/Festival_Cine_UEM/Festival_Cine_UEM/src/html/index.html
   ```

5. Al hacer la primera peticion a un endpoint PHP, el proyecto comprobara si existe la base de datos `festival_cine_uem`. Si no existe, se creara automaticamente con tablas y datos iniciales desde:

   ```text
   src/php/BBDD.php
   ```

## Configuracion de base de datos

La conexion esta definida en:

```text
src/php/conexion.php
```

Valores por defecto:

```php
$servidor = "localhost";
$usuario  = "root";
$password = "";
$database = "festival_cine_uem";
```

Estos valores coinciden con una instalacion habitual de XAMPP en local. Si tu entorno usa otro usuario, password o host, modifica ese archivo.

## Usuarios de prueba

La base de datos inicial incluye cuentas de ejemplo:

| Rol | Email | Password |
| --- | --- | --- |
| Administrador | `sara.delcastillo@universidadeuropea.es` | `12345` |
| Usuario | `hugo@correo.es` | `1234` |
| Usuario | `edu@correo.es` | `1234` |

Al iniciar sesion como administrador con la password temporal `12345`, la aplicacion puede solicitar el cambio de contrasena.

## Pruebas

Para ejecutar la suite de PHPUnit:

```bash
vendor/bin/phpunit
```

En Windows tambien puede ejecutarse con:

```bash
vendor\bin\phpunit
```

Las pruebas actuales cubren validaciones basicas del login.

## Rutas utiles

- Inicio: `src/html/index.html`
- Login: `src/html/login.html`
- Subida de cortos: `src/html/subir_corto.html`
- Panel de administrador: `src/html/panel_administrador.html`
- Panel de usuario: `src/html/panel_usuario_perfil.html`
- Configuracion de conexion: `src/php/conexion.php`
- Script de creacion de base de datos: `src/php/BBDD.php`

## Notas de desarrollo

- El proyecto usa rutas relativas entre `html`, `js`, `css` y `php`, por lo que debe servirse desde Apache para que las llamadas `fetch` funcionen correctamente.
- No se recomienda abrir los archivos HTML directamente desde el explorador con `file://`, ya que los endpoints PHP y las sesiones no se ejecutaran correctamente.
- Los archivos subidos y recursos multimedia se almacenan dentro de `src/uploads`, `src/noticias` y `src/ganadores`.
- La carpeta `vendor` puede regenerarse con `composer install`.

## Estado del proyecto

Proyecto academico orientado a la gestion integral de un festival universitario de cortometrajes, con secciones publicas, autenticacion, roles, administracion de contenidos y persistencia en base de datos.
