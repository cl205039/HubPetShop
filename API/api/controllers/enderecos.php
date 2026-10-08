<?php

class Enderecos
{
    private static function transformar(array $linha): array
    {
        return [
            'id'          => (int)$linha['id'],
            'usuarioId'   => (int)$linha['usuario_id'],
            'titulo'      => $linha['titulo'],
            'rua'         => $linha['rua'],
            'numero'      => $linha['numero'],
            'complemento' => $linha['complemento'],
            'bairro'      => $linha['bairro'],
            'cidade'      => $linha['cidade'],
            'principal'   => (bool)$linha['principal'],
        ];
    }

    public static function listar(int $usuarioId): void
    {
        $stmt = Database::get()->prepare('SELECT * FROM enderecos WHERE usuario_id = ? ORDER BY id');
        $stmt->execute([$usuarioId]);
        Response::json(array_map([self::class, 'transformar'], $stmt->fetchAll()), 200);
    }

    public static function criar(int $usuarioId, array $corpo): void
    {
        if (!Usuarios::existe($usuarioId)) {
            Response::erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
        }

        $pdo = Database::get();
        $stmt = $pdo->prepare(
            'INSERT INTO enderecos (usuario_id, titulo, rua, numero, complemento, bairro, cidade, principal) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $usuarioId,
            $corpo['titulo'] ?? null,
            $corpo['rua'] ?? null,
            $corpo['numero'] ?? null,
            $corpo['complemento'] ?? null,
            $corpo['bairro'] ?? null,
            $corpo['cidade'] ?? null,
            paraBool($corpo['principal'] ?? null),
        ]);

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM enderecos WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::transformar($stmt->fetch()), 201);
    }

    public static function remover(int $id): void
    {
        $pdo = Database::get();
        $stmt = $pdo->prepare('SELECT id FROM enderecos WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::erro(404, 'endereco_nao_encontrado', 'Endereço não encontrado.');
        }

        $pdo->prepare('DELETE FROM enderecos WHERE id = ?')->execute([$id]);
        Response::noContent();
    }
}
