<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function pets_linha_para_json(array $l): array {
    return [
        'id' => (int) $l['id'], 'usuarioId' => (int) $l['usuario_id'],
        'nome' => $l['nome'], 'tipo' => $l['tipo'], 'raca' => $l['raca'],
        'idade' => $l['idade'], 'peso' => $l['peso'],
        'nascimento' => $l['nascimento'], 'sexo' => $l['sexo'],
    ];
}

function pets_listar(string $usuarioId): void {
    $stmt = conexao()->prepare('SELECT * FROM pets WHERE usuario_id = ?');
    $stmt->execute([$usuarioId]);
    responder(200, array_map('pets_linha_para_json', $stmt->fetchAll()));
}

function pets_cadastrar(string $usuarioId): void {
    $dados = corpoRequisicao();
    foreach (['nome', 'tipo'] as $campo) {
        if (!campoObrigatorio($dados, $campo)) {
            erro(400, 'campo_obrigatorio', "Informe o campo obrigatório: $campo.");
        }
    }
    $pdo = conexao();
    $stmt = $pdo->prepare(
        'INSERT INTO pets (usuario_id, nome, tipo, raca, idade, peso, nascimento, sexo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $usuarioId, $dados['nome'], $dados['tipo'], $dados['raca'] ?? null,
        $dados['idade'] ?? null, $dados['peso'] ?? null,
        $dados['nascimento'] ?? null, $dados['sexo'] ?? null,
    ]);
    $novo = $pdo->prepare('SELECT * FROM pets WHERE id = ?');
    $novo->execute([$pdo->lastInsertId()]);
    responder(201, pets_linha_para_json($novo->fetch()));
}

function pets_atualizar(string $id): void {
    $dados = corpoRequisicao();
    $pdo = conexao();
    $pdo->prepare(
        'UPDATE pets SET nome=?, tipo=?, raca=?, idade=?, peso=?, nascimento=?, sexo=? WHERE id=?'
    )->execute([
        $dados['nome'] ?? null, $dados['tipo'] ?? null, $dados['raca'] ?? null,
        $dados['idade'] ?? null, $dados['peso'] ?? null, $dados['nascimento'] ?? null,
        $dados['sexo'] ?? null, $id,
    ]);
    $atual = $pdo->prepare('SELECT * FROM pets WHERE id = ?');
    $atual->execute([$id]);
    $linha = $atual->fetch();
    if (!$linha) erro(404, 'pet_nao_encontrado', 'Pet não encontrado.');
    responder(200, pets_linha_para_json($linha));
}

function pets_remover(string $id): void {
    conexao()->prepare('DELETE FROM pets WHERE id = ?')->execute([$id]);
    responder(204);
}
