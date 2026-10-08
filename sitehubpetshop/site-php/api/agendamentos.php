<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function agendamentos_linha_para_json(array $l): array {
    return [
        'id' => (int) $l['id'],
        'usuarioId' => (int) $l['usuario_id'],
        'servico' => $l['servico'],
        'hora' => $l['hora'],
        'status' => $l['status'],
        'pet' => $l['pet'],
        'local' => $l['local'],
        'petshopId' => $l['petshop_id'] !== null ? (int) $l['petshop_id'] : null,
        'data' => $l['data'],
    ];
}

function agendamentos_listar(string $usuarioId): void {
    $stmt = conexao()->prepare('SELECT * FROM agendamentos WHERE usuario_id = ? ORDER BY data DESC');
    $stmt->execute([$usuarioId]);
    responder(200, array_map('agendamentos_linha_para_json', $stmt->fetchAll()));
}

function agendamentos_cadastrar(string $usuarioId): void {
    $dados = corpoRequisicao();
    foreach (['servico', 'hora', 'data'] as $campo) {
        if (!campoObrigatorio($dados, $campo)) {
            erro(400, 'campo_obrigatorio', "Informe o campo obrigatório: $campo.");
        }
    }
    $pdo = conexao();

    // Reforça no servidor o que a tela de agendar já filtra: só pode marcar
    // serviço que o petshop escolhido realmente cadastrou (evita repetir o
    // caso do "Pet Legal" — agendamento criado sem nenhum serviço cadastrado).
    if (!empty($dados['petshopId'])) {
        $cadastrados = $pdo->prepare('SELECT nome FROM servicos WHERE petshop_id = ?');
        $cadastrados->execute([$dados['petshopId']]);
        $nomesValidos = $cadastrados->fetchAll(PDO::FETCH_COLUMN);
        $selecionados = array_map('trim', explode(',', $dados['servico']));
        foreach ($selecionados as $nome) {
            if (!in_array($nome, $nomesValidos, true)) {
                erro(400, 'servico_nao_cadastrado', "O petshop selecionado não tem o serviço \"$nome\" cadastrado.");
            }
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO agendamentos (usuario_id, servico, hora, status, pet, local, petshop_id, data)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $usuarioId, $dados['servico'], $dados['hora'], $dados['status'] ?? 'Pendente',
        $dados['pet'] ?? null, $dados['local'] ?? null, $dados['petshopId'] ?? null, $dados['data'],
    ]);
    $novo = $pdo->prepare('SELECT * FROM agendamentos WHERE id = ?');
    $novo->execute([$pdo->lastInsertId()]);
    responder(201, agendamentos_linha_para_json($novo->fetch()));
}
