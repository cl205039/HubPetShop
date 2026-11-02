<?php

class Petshops
{
    // Formata a linha do banco para a resposta.
    private static function transformar(array $linha): array
    {
        return [
            'id'          => (int)$linha['id'],
            'nome'        => $linha['nome'],
            'nota'        => (float)$linha['nota'],
            'distanciaKm' => (float)$linha['distancia_km'],
        ];
    }

    // Lista todos os petshops.
    public static function listar(): void
    {
        $stmt = Database::get()->query('SELECT * FROM petshops ORDER BY id');
        Response::json(array_map([self::class, 'transformar'], $stmt->fetchAll()), 200);
    }

    // Retorna um petshop pelo id.
    public static function buscarPorId(int $id): void
    {
        $stmt = Database::get()->prepare('SELECT * FROM petshops WHERE id = ?');
        $stmt->execute([$id]);
        $petshop = $stmt->fetch();

        if (!$petshop) {
            Response::erro(404, 'petshop_nao_encontrado', 'Petshop não encontrado.');
        }

        Response::json(self::transformar($petshop), 200);
    }
}
