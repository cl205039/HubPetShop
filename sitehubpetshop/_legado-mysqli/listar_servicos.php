<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'conexao.php';

$categoria_id = $_GET['categoria_id'] ?? null;
$busca        = trim($_GET['busca'] ?? '');

$sql = "SELECT
            s.id,
            s.nome,
            s.descricao,
            s.preco,
            s.duracao_min,
            c.nome AS categoria
        FROM servicos s
        LEFT JOIN categorias c ON c.id = s.categoria_id
        WHERE s.ativo = TRUE";

$params = [];
$tipos  = '';

if (!empty($categoria_id)) {
    $sql .= " AND s.categoria_id = ?";
    $params[] = $categoria_id;
    $tipos   .= 'i';
}

if (!empty($busca)) {
    $sql .= " AND s.nome LIKE ?";
    $params[] = '%' . $busca . '%';
    $tipos   .= 's';
}

$sql .= " ORDER BY s.nome ASC";

$stmt = mysqli_prepare($conexao, $sql);

if (!$stmt) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao preparar a consulta.']);
    exit;
}

if (!empty($params)) {
    mysqli_stmt_bind_param($stmt, $tipos, ...$params);
}

mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);

$servicos = [];
while ($linha = mysqli_fetch_assoc($resultado)) {
    $servicos[] = $linha;
}

mysqli_stmt_close($stmt);

echo json_encode(['sucesso' => true, 'servicos' => $servicos]);
