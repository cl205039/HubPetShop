<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function enderecos_linha_para_json(array $l): array {
    return [
        'id' => (int) $l['id'], 'usuarioId' => (int) $l['usuario_id'],
        'titulo' => $l['titulo'], 'rua' => $l['rua'], 'numero' => $l['numero'],
        'complemento' => $l['complemento'], 'bairro' => $l['bairro'], 'cidade' => $l['cidade'],
        'principal' => (bool) $l['principal'],
    ];
}

function enderecos_listar(string $usuarioId): void {
    $stmt = conexao()->prepare('SELECT * FROM enderecos WHERE usuario_id = ?');
    $stmt->execute([$usuarioId]);
    responder(200, array_map('enderecos_linha_para_json', $stmt->fetchAll()));
}

function enderecos_cadastrar(string $usuarioId): void {
    $dados = corpoRequisicao();
    foreach (['rua', 'numero', 'bairro', 'cidade'] as $campo) {
        if (!campoObrigatorio($dados, $campo)) {
            erro(400, 'campo_obrigatorio', "Informe o campo obrigatório: $campo.");
        }
    }
    $pdo = conexao();

    if (!empty($dados['principal'])) {
        $pdo->prepare('UPDATE enderecos SET principal = 0 WHERE usuario_id = ?')->execute([$usuarioId]);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO enderecos (usuario_id, titulo, rua, numero, complemento, bairro, cidade, principal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $usuarioId, $dados['titulo'] ?? null, $dados['rua'], $dados['numero'],
        $dados['complemento'] ?? null, $dados['bairro'], $dados['cidade'],
        !empty($dados['principal']) ? 1 : 0,
    ]);
    $novo = $pdo->prepare('SELECT * FROM enderecos WHERE id = ?');
    $novo->execute([$pdo->lastInsertId()]);
    responder(201, enderecos_linha_para_json($novo->fetch()));
}

function enderecos_remover(string $id): void {
    conexao()->prepare('DELETE FROM enderecos WHERE id = ?')->execute([$id]);
    responder(204);
}
