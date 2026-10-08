<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'conexao.php';

// =============================================
// Filtro opcional por categoria (?categoria_id=2)
// e por busca de nome (?busca=racao)
// =============================================

$categoria_id = $_GET['categoria_id'] ?? null;
$busca        = trim($_GET['busca'] ?? '');

$sql = "SELECT
            p.id,
            p.nome,
            p.descricao,
            p.preco,
            p.estoque,
            p.foto,
            c.nome AS categoria
        FROM produtos p
        LEFT JOIN categorias c ON c.id = p.categoria_id
        WHERE p.ativo = TRUE
          AND p.estoque > 0";

$params = [];
$tipos  = '';

if (!empty($categoria_id)) {
    $sql .= " AND p.categoria_id = ?";
    $params[] = $categoria_id;
    $tipos   .= 'i';
}

if (!empty($busca)) {
    $sql .= " AND p.nome LIKE ?";
    $params[] = '%' . $busca . '%';
    $tipos   .= 's';
}

$sql .= " ORDER BY p.nome ASC";

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

$produtos = [];
while ($linha = mysqli_fetch_assoc($resultado)) {
    $produtos[] = $linha;
}

mysqli_stmt_close($stmt);

echo json_encode(['sucesso' => true, 'produtos' => $produtos]);
