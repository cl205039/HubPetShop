<?php

class Pedidos
{
    private static function transformarItem(array $linha): array
    {
        return [
            'nome'          => $linha['nome'],
            'quantidade'    => (int)$linha['quantidade'],
            'precoUnitario' => (float)$linha['preco_unitario'],
            'produtoId'     => $linha['produto_id'] !== null ? (int)$linha['produto_id'] : null,
        ];
    }

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

    public static function listar(int $usuarioId): void
    {
        $pdo = Database::get();
        $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id');
        $stmt->execute([$usuarioId]);

        $resultado = array_map(fn($pedido) => self::transformar($pdo, $pedido), $stmt->fetchAll());
        Response::json($resultado, 200);
    }

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

        // Alguns clientes mandam petshopId mas esquecem `loja` (texto livre
        // com o nome da loja). Como petshopId já é a fonte de verdade, a API
        // preenche `loja` sozinha a partir do nome do petshop nesse caso —
        // não depende de cada cliente (web, Flutter, futuros) mandar os dois.
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
            // Só abate estoque de itens que vieram com produtoId (o carrinho
            // monta isso a partir do produtoId já presente em cada oferta —
            // ver Produtos::ofertas/ofertasPorPetshop). Sem produtoId não dá
            // pra saber qual linha de `produtos` corresponde ao item.
            $estoqueStmt = $pdo->prepare(
                'UPDATE produtos SET estoque = GREATEST(estoque - ?, 0) WHERE id = ?'
            );
            foreach ($itens as $item) {
                $quantidade = (int)($item['quantidade'] ?? 1);
                $produtoId = isset($item['produtoId']) ? (int)$item['produtoId'] : null;

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
