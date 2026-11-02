<?php

class Pedidos
{
    // Formata um item do pedido para a resposta.
    private static function transformarItem(array $linha): array
    {
        return [
            'nome'          => $linha['nome'],
            'quantidade'    => (int)$linha['quantidade'],
            'precoUnitario' => (float)$linha['preco_unitario'],
            'produtoId'     => $linha['produto_id'] !== null ? (int)$linha['produto_id'] : null,
        ];
    }

    // Formata o pedido com seus itens para a resposta.
    private static function transformar(PDO $pdo, array $pedido): array
    {
        $itensStmt = $pdo->prepare('SELECT * FROM pedido_itens WHERE pedido_id = ? ORDER BY id');
        $itensStmt->execute([$pedido['id']]);

        return [
            'id'        => (int)$pedido['id'],
            'usuarioId' => (int)$pedido['usuario_id'],
            'loja'      => $pedido['loja'],
            'petshopId' => $pedido['petshop_id'] !== null ? (int)$pedido['petshop_id'] : null,
            'itens'     => array_map([self::class, 'transformarItem'], $itensStmt->fetchAll()),
            'total'     => (float)$pedido['total'],
            'data'      => $pedido['data'],
            'etapa'     => (int)$pedido['etapa'],
        ];
    }

    // Lista os pedidos do usuário.
    public static function listar(int $usuarioId): void
    {
        $pdo = Database::get();
        $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id');
        $stmt->execute([$usuarioId]);

        $resultado = array_map(fn($pedido) => self::transformar($pdo, $pedido), $stmt->fetchAll());
        Response::json($resultado, 200);
    }

    // Cria um pedido com seus itens e atualiza o estoque.
    public static function criar(int $usuarioId, array $corpo): void
    {
        if (!Usuarios::existe($usuarioId)) {
            Response::erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
        }

        $itens = is_array($corpo['itens'] ?? null) ? $corpo['itens'] : [];

        $total = $corpo['total'] ?? array_reduce($itens, function ($soma, $item) {
            return $soma + (($item['quantidade'] ?? 1) * ($item['precoUnitario'] ?? 0));
        }, 0);

        $petshopId = isset($corpo['petshopId']) ? (int)$corpo['petshopId'] : null;

        $pdo = Database::get();

        // Sem `loja`, usa o nome do petshop.
        $loja = $corpo['loja'] ?? null;
        if (empty($loja) && $petshopId !== null) {
            $petshopStmt = $pdo->prepare('SELECT nome FROM petshops WHERE id = ?');
            $petshopStmt->execute([$petshopId]);
            $petshop = $petshopStmt->fetch();
            if ($petshop) {
                $loja = $petshop['nome'];
            }
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO pedidos (usuario_id, loja, total, data, etapa, petshop_id, criado_em) VALUES (?, ?, ?, ?, ?, ?, NOW())'
            );
            $stmt->execute([
                $usuarioId,
                $loja,
                (float)$total,
                $corpo['data'] ?? null,
                (int)($corpo['etapa'] ?? 0),
                $petshopId,
            ]);
            $pedidoId = (int)$pdo->lastInsertId();

            $itemStmt = $pdo->prepare(
                'INSERT INTO pedido_itens (pedido_id, nome, quantidade, preco_unitario, produto_id) VALUES (?, ?, ?, ?, ?)'
            );
            // Abate o estoque dos itens com produtoId.
            $estoqueStmt = $pdo->prepare(
                'UPDATE produtos SET estoque = GREATEST(estoque - ?, 0) WHERE id = ?'
            );
            // Sem produtoId, procura o produto pelo nome no petshop.
            $produtoPorNomeStmt = $pdo->prepare(
                'SELECT id FROM produtos WHERE nome = ? AND petshop_id = ? AND ativo = 1 LIMIT 1'
            );
            foreach ($itens as $item) {
                $quantidade = (int)($item['quantidade'] ?? 1);
                $produtoId = isset($item['produtoId']) ? (int)$item['produtoId'] : null;

                if ($produtoId === null && $petshopId !== null) {
                    $produtoPorNomeStmt->execute([$item['nome'] ?? '', $petshopId]);
                    $encontrado = $produtoPorNomeStmt->fetchColumn();
                    if ($encontrado !== false) {
                        $produtoId = (int)$encontrado;
                    }
                }

                $itemStmt->execute([
                    $pedidoId,
                    $item['nome'] ?? '',
                    $quantidade,
                    (float)($item['precoUnitario'] ?? 0),
                    $produtoId,
                ]);

                if ($produtoId !== null) {
                    $estoqueStmt->execute([$quantidade, $produtoId]);
                }
            }

            $pdo->commit();
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id = ?');
        $stmt->execute([$pedidoId]);
        Response::json(self::transformar($pdo, $stmt->fetch()), 201);
    }
}
