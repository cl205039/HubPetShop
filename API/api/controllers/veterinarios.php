<?php

class Veterinarios
{
    private static function transformar(array $linha): array
    {
        return [
            'id'            => (int)$linha['id'],
            'veterinarioId' => (int)$linha['veterinario_id'],
            'nome'          => $linha['nome'],
            'preco'         => (float)$linha['preco'],
            'duracao'       => $linha['duracao'],
        ];
    }

    public static function listarServicos(int $veterinarioId): void
    {
        $stmt = Database::get()->prepare('SELECT * FROM servicos_vet WHERE veterinario_id = ? ORDER BY id');
        $stmt->execute([$veterinarioId]);
        Response::json(array_map([self::class, 'transformar'], $stmt->fetchAll()), 200);
    }

    public static function criarServico(int $veterinarioId, array $corpo): void
    {
        if (!Usuarios::existe($veterinarioId)) {
            Response::erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
        }
        if (empty($corpo['nome']) || !isset($corpo['preco'])) {
            Response::erro(400, 'campo_obrigatorio', 'Os campos "nome" e "preco" são obrigatórios.');
        }

        $pdo = Database::get();
        $stmt = $pdo->prepare('INSERT INTO servicos_vet (veterinario_id, nome, preco, duracao) VALUES (?, ?, ?, ?)');
        $stmt->execute([$veterinarioId, $corpo['nome'], (float)$corpo['preco'], $corpo['duracao'] ?? null]);

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM servicos_vet WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::transformar($stmt->fetch()), 201);
    }

    public static function removerServico(int $id): void
    {
        $pdo = Database::get();
        $stmt = $pdo->prepare('SELECT id FROM servicos_vet WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::erro(404, 'servico_nao_encontrado', 'Serviço não encontrado.');
        }

        $pdo->prepare('DELETE FROM servicos_vet WHERE id = ?')->execute([$id]);
        Response::noContent();
    }
}
