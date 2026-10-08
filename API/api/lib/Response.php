<?php

class Response
{
    public static function json($dados, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($dados, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    public static function erro(int $status, string $codigo, string $mensagem): void
    {
        self::json(['erro' => $codigo, 'mensagem' => $mensagem], $status);
    }

    public static function noContent(): void
    {
        http_response_code(204);
        exit;
    }
}
