<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function ofertas_linha_para_json(array $l, bool $comPetshop): array {
    $base = [
        'ofertaId'  => (int) $l['ofertaId'],
        'produtoId' => (int) $l['produtoId'],
        'nome'      => $l['nome'],
        'descricao' => $l['descricao'],
        'categoria' => $l['categoria'],
        'imagem'    => $l['imagem'],
        'preco'     => (float) $l['preco'],
    ];
    if ($comPetshop) {
        $base += [
            'petshopId'          => (int) $l['petshopId'],
            'petshopNome'        => $l['petshopNome'],
            'petshopNota'        => (float) $l['petshopNota'],
            'petshopDistanciaKm' => (float) $l['petshopDistanciaKm'],
        ];
    }
    return $base;
}

function ofertas_por_petshop(string $petshopId): void {
    $stmt = conexao()->prepare(
        'SELECT o.id AS ofertaId, p.id AS produtoId, p.nome, p.descricao, p.categoria, p.imagem, o.preco
         FROM ofertas o
         JOIN produtos p ON p.id = o.produto_id
         WHERE o.petshop_id = ?'
    );
    $stmt->execute([$petshopId]);
    responder(200, array_map(fn($l) => ofertas_linha_para_json($l, false), $stmt->fetchAll()));
}

function ofertas_todas(): void {
    $sql = 'SELECT o.id AS ofertaId, p.id AS produtoId, p.nome, p.descricao, p.categoria, p.imagem, o.preco,
                   ps.id AS petshopId, ps.nome AS petshopNome, ps.nota AS petshopNota, ps.distancia_km AS petshopDistanciaKm
            FROM ofertas o
            JOIN produtos p ON p.id = o.produto_id
            JOIN petshops ps ON ps.id = o.petshop_id';
    $condicoes = [];
    $params = [];
    if (!empty($_GET['categoria'])) {
        $condicoes[] = 'p.categoria = ?';
        $params[] = $_GET['categoria'];
    }
    if (!empty($_GET['busca'])) {
        $condicoes[] = '(p.nome LIKE ? OR p.descricao LIKE ?)';
        $termo = '%' . $_GET['busca'] . '%';
        $params[] = $termo;
        $params[] = $termo;
    }
    if ($condicoes) {
        $sql .= ' WHERE ' . implode(' AND ', $condicoes);
    }
    $stmt = conexao()->prepare($sql);
    $stmt->execute($params);
    responder(200, array_map(fn($l) => ofertas_linha_para_json($l, true), $stmt->fetchAll()));
}
