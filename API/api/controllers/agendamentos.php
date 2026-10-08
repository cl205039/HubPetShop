<?php

class Agendamentos
{
    private const STATUS_VALIDOS = ['Confirmado', 'Pendente', 'Concluído'];

    private static function transformar(array $linha): array
    {
        return [
            'id'        => (int)$linha['id'],
            'usuarioId' => (int)$linha['usuario_id'],
            'servico'   => $linha['servico'],
            'hora'      => $linha['hora'],
            'status'    => $linha['status'],
            'pet'       => $linha['pet'],
            'local'     => $linha['local'],
            'petshopId' => $linha['petshop_id'] !== null ? (int)$linha['petshop_id'] : null,
            'data'      => $linha['data'],
        ];
    }

    public static function listar(int $usuarioId): void
    {
        $stmt = Database::get()->prepare('SELECT * FROM agendamentos WHERE usuario_id = ? ORDER BY id');
        $stmt->execute([$usuarioId]);
        Response::json(array_map([self::class, 'transformar'], $stmt->fetchAll()), 200);
    }

    public static function criar(int $usuarioId, array $corpo): void
    {
        if (!Usuarios::existe($usuarioId)) {
            Response::erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
        }

        $status = $corpo['status'] ?? 'Pendente';
        if (!in_array($status, self::STATUS_VALIDOS, true)) {
            Response::erro(400, 'status_invalido', 'status deve ser Confirmado, Pendente ou Concluído.');
        }

        $pdo = Database::get();
        $stmt = $pdo->prepare(
            'INSERT INTO agendamentos (usuario_id, servico, hora, status, pet, local, petshop_id, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $usuarioId,
            $corpo['servico'] ?? null,
            $corpo['hora'] ?? null,
            $status,
            $corpo['pet'] ?? null,
            $corpo['local'] ?? null,
            isset($corpo['petshopId']) ? (int)$corpo['petshopId'] : null,
            $corpo['data'] ?? null,
        ]);

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM agendamentos WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::transformar($stmt->fetch()), 201);
    }
}
