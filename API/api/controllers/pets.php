<?php

class Pets
{
    private static function transformar(array $linha): array
    {
        return [
            'id'         => (int)$linha['id'],
            'usuarioId'  => (int)$linha['usuario_id'],
            'nome'       => $linha['nome'],
            'tipo'       => $linha['tipo'],
            'raca'       => $linha['raca'],
            'idade'      => $linha['idade'],
            'peso'       => $linha['peso'],
            'nascimento' => $linha['nascimento'],
            'sexo'       => $linha['sexo'],
        ];
    }

    public static function listar(int $usuarioId): void
    {
        $stmt = Database::get()->prepare('SELECT * FROM pets WHERE usuario_id = ? ORDER BY id');
        $stmt->execute([$usuarioId]);
        Response::json(array_map([self::class, 'transformar'], $stmt->fetchAll()), 200);
    }

    public static function criar(int $usuarioId, array $corpo): void
    {
        if (!Usuarios::existe($usuarioId)) {
            Response::erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
        }
        if (empty($corpo['nome'])) {
            Response::erro(400, 'campo_obrigatorio', 'O campo "nome" é obrigatório.');
        }

        $pdo = Database::get();
        $stmt = $pdo->prepare(
            'INSERT INTO pets (usuario_id, nome, tipo, raca, idade, peso, nascimento, sexo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $usuarioId,
            $corpo['nome'],
            $corpo['tipo'] ?? null,
            $corpo['raca'] ?? null,
            $corpo['idade'] ?? null,
            $corpo['peso'] ?? null,
            $corpo['nascimento'] ?? null,
            $corpo['sexo'] ?? null,
        ]);

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM pets WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::transformar($stmt->fetch()), 201);
    }

    public static function atualizar(int $id, array $corpo): void
    {
        $pdo = Database::get();
        $stmt = $pdo->prepare('SELECT * FROM pets WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::erro(404, 'pet_nao_encontrado', 'Pet não encontrado.');
        }

        $campos = ['nome', 'tipo', 'raca', 'idade', 'peso', 'nascimento', 'sexo'];
        $colunas = [];
        $valores = [];
        foreach ($campos as $campo) {
            if (array_key_exists($campo, $corpo)) {
                $colunas[] = "$campo = ?";
                $valores[] = $corpo[$campo];
            }
        }

        if (!empty($colunas)) {
            $valores[] = $id;
            $pdo->prepare('UPDATE pets SET ' . implode(', ', $colunas) . ' WHERE id = ?')->execute($valores);
        }

        $stmt = $pdo->prepare('SELECT * FROM pets WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::transformar($stmt->fetch()), 200);
    }

    public static function remover(int $id): void
    {
        $pdo = Database::get();
        $stmt = $pdo->prepare('SELECT id FROM pets WHERE id = ?');
        $stmt->execute([$id]);
        if (!$stmt->fetch()) {
            Response::erro(404, 'pet_nao_encontrado', 'Pet não encontrado.');
        }

        $pdo->prepare('DELETE FROM pets WHERE id = ?')->execute([$id]);
        Response::noContent();
    }
}
