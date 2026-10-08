<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function petshops_linha_para_json(array $l): array {
    return [
        'id' => (int) $l['id'],
        'nome' => $l['nome'],
        'nota' => (float) $l['nota'],
        'distanciaKm' => (float) $l['distancia_km'],
    ];
}

function petshops_listar(): void {
    $stmt = conexao()->query('SELECT * FROM petshops ORDER BY nome');
    responder(200, array_map('petshops_linha_para_json', $stmt->fetchAll()));
}

function petshops_buscar_por_id(string $id): void {
    $stmt = conexao()->prepare('SELECT * FROM petshops WHERE id = ?');
    $stmt->execute([$id]);
    $linha = $stmt->fetch();
    if (!$linha) erro(404, 'petshop_nao_encontrado', 'Petshop não encontrado.');
    responder(200, petshops_linha_para_json($linha));
}
