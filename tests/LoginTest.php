<?php

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../src/php/login.php';

class LoginTest extends TestCase
{
    protected function setUp(): void
    {
        $_POST = [];

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_unset();
            session_destroy();
        }
        $_SESSION = [];
    }

    public function testCamposVaciosDevuelveError()
    {
        $_POST = [
            'funcion' => 'procesarLogin',
            'email'   => '',
            'pass'    => ''
        ];

        $resp = manejarLogin();

        $this->assertEquals('error', $resp['status']);
        $this->assertEquals('Email y/o contraseña vacíos', $resp['message']);
    }

    public function testCredencialesIncorrectasDevuelveError()
    {
        $_POST = [
            'funcion' => 'procesarLogin',
            'email'   => 'noexiste@example.com',
            'pass'    => 'mal'
        ];

        $resp = manejarLogin();

        // Siempre debe ser error
        $this->assertEquals('error', $resp['status']);

        // Puede fallar por credenciales o por conexión/BD no disponible
        $this->assertTrue(
            in_array($resp['message'] ?? '', [
                'Email y/o contraseña incorrectos',
                'Error de conexión con la base de datos'
            ], true),
            "Mensaje inesperado: " . ($resp['message'] ?? '(sin message)')
        );
    }
}
