<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function pedidos_linha_para_json(PDO $pdo, array $pedido): array {
    $stmt = $pdo->prepare('SELECT nome, quantidade, preco_unitario AS precoUnitario FROM itens_pedido WHERE pedido_id = ?');
    $stmt->execute([$pedido['id']]);
    return [
        'id'        => (int) $pedido['id'],
        'usuarioId' => (int) $pedido['usuario_id'],
        'petshopId' => (int) $pedido['petshop_id'],
        'loja'      => $pedido['petshopNome'],
        'itens'     => array_map(fn($i) => [
            'nome' => $i['nome'],
            'quantidade' => (int) $i['quantidade'],
            'precoUnitario' => (float) $i['precoUnitario'],
        ], $stmt->fetchAll()),
        'total' => (float) $pedido['total'],
        'data'  => $pedido['data'],
        'etapa' => (int) $pedido['etapa'],
    ];
}

const PEDIDOS_SELECT_BASE = 'SELECT ped.*, ps.nome AS petshopNome FROM pedidos ped JOIN petshops ps ON ps.id = ped.petshop_id';

function pedidos_listar(string $usuarioId): void {
    $pdo = conexao();
    $stmt = $pdo->prepare(PEDIDOS_SELECT_BASE . ' WHERE ped.usuario_id = ? ORDER BY ped.id DESC');
    $stmt->execute([$usuarioId]);
    responder(200, array_map(fn($p) => pedidos_linha_para_json($pdo, $p), $stmt->fetchAll()));
}

function pedidos_cadastrar(string $usuarioId): void {
    $dados = corpoRequisicao();
    if (empty($dados['petshopId']) || empty($dados['itens']) || !is_array($dados['itens'])) {
        erro(400, 'campo_obrigatorio', 'Informe petshopId e ao menos um item.');
    }

    $pdo = conexao();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO pedidos (usuario_id, petshop_id, total, data, etapa) VALUES (?, ?, ?, ?, ?)')
            ->execute([$usuarioId, $dados['petshopId'], $dados['total'] ?? 0, $dados['data'] ?? '', $dados['etapa'] ?? 0]);
        $pedidoId = (int) $pdo->lastInsertId();

        $itemStmt = $pdo->prepare('INSERT INTO itens_pedido (pedido_id, nome, quantidade, preco_unitario) VALUES (?, ?, ?, ?)');
        foreach ($dados['itens'] as $item) {
            $itemStmt->execute([$pedidoId, $item['nome'], $item['quantidade'] ?? 1, $item['precoUnitario'] ?? 0]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        erro(500, 'erro_interno', 'Não foi possível criar o pedido.');
    }

    $stmt = $pdo->prepare(PEDIDOS_SELECT_BASE . ' WHERE ped.id = ?');
    $stmt->execute([$pedidoId]);
    responder(201, pedidos_linha_para_json($pdo, $stmt->fetch()));
}
