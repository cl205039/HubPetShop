<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function servicos_linha_para_json(array $l): array {
    return [
        'id' => (int) $l['id'],
        'petshopId' => (int) $l['petshop_id'],
        'nome' => $l['nome'],
        'preco' => (float) $l['preco'],
        'icone' => $l['icone'],
    ];
}

// Só lista o que o próprio petshop cadastrou — sem petshopId, não retorna nada,
// pra evitar agendar um serviço que o petshop nunca cadastrou.
function servicos_listar(): void {
    $petshopId = $_GET['petshopId'] ?? null;
    if (!$petshopId) {
        responder(200, []);
        return;
    }
    $stmt = conexao()->prepare('SELECT * FROM servicos WHERE petshop_id = ? ORDER BY id');
    $stmt->execute([$petshopId]);
    responder(200, array_map('servicos_linha_para_json', $stmt->fetchAll()));
}
