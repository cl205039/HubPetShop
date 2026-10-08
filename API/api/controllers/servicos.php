<?php

class Servicos
{
    public static function listar(): void
    {
        $stmt = Database::get()->query('SELECT * FROM servicos ORDER BY id');

        $servicos = array_map(function ($linha) {
            return [
                'id'    => (int)$linha['id'],
                'nome'  => $linha['nome'],
                'preco' => (float)$linha['preco'],
                'icone' => $linha['icone'],
            ];
        }, $stmt->fetchAll());

        Response::json($servicos, 200);
    }
}
