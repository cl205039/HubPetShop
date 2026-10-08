<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

session_start();

// =============================================
// 1. EXIGE LOGIN
// =============================================

if (empty($_SESSION['usuario_id'])) {
    echo json_encode(['sucesso' => false, 'precisa_login' => true, 'mensagem' => 'Faça login para finalizar o pedido.']);
    exit;
}

$usuario_id = (int) $_SESSION['usuario_id'];

// =============================================
// 2. RECEBE OS DADOS
// carrinho: JSON com [{produto_id, quantidade}, ...]
// endereço: dados do endereço de entrega
// =============================================

$carrinhoJson = $_POST['carrinho'] ?? '';
$carrinho     = json_decode($carrinhoJson, true);

if (empty($carrinho) || !is_array($carrinho)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Carrinho vazio.']);
    exit;
}

$cep    = trim($_POST['cep']    ?? '');
$rua    = trim($_POST['rua']    ?? '');
$numero = trim($_POST['numero'] ?? '');
$bairro = trim($_POST['bairro'] ?? '');
$cidade = trim($_POST['cidade'] ?? '');
$estado = trim($_POST['estado'] ?? '');

if (empty($cep) || empty($rua) || empty($numero) || empty($bairro) || empty($cidade) || empty($estado)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os campos de endereço.']);
    exit;
}

require_once 'conexao.php';

mysqli_begin_transaction($conexao);

try {

    // =============================================
    // 3. SALVA O ENDEREÇO DE ENTREGA
    // =============================================

    $sqlEndereco = "INSERT INTO enderecos_usuarios
                        (usuario_id, apelido, cep, rua, numero, bairro, cidade, estado, principal)
                    VALUES (?, 'Entrega', ?, ?, ?, ?, ?, ?, FALSE)";

    $stmtEndereco = mysqli_prepare($conexao, $sqlEndereco);
    mysqli_stmt_bind_param($stmtEndereco, 'issssss', $usuario_id, $cep, $rua, $numero, $bairro, $cidade, $estado);
    mysqli_stmt_execute($stmtEndereco);
    $endereco_id = mysqli_insert_id($conexao);
    mysqli_stmt_close($stmtEndereco);

    // =============================================
    // 4. VALIDA PRODUTOS, MONTA ITENS E CALCULA TOTAL
    //    (busca preço/estoque real no banco, nunca confia no front)
    // =============================================

    $itens = [];
    $total = 0;

    foreach ($carrinho as $item) {

        $produto_id = (int) ($item['produto_id'] ?? 0);
        $quantidade = (int) ($item['quantidade'] ?? 0);

        if ($produto_id <= 0 || $quantidade <= 0) {
            throw new Exception('Item de carrinho inválido.');
        }

        $sqlProduto  = "SELECT id, preco, estoque, ativo FROM produtos WHERE id = ? LIMIT 1";
        $stmtProduto = mysqli_prepare($conexao, $sqlProduto);
        mysqli_stmt_bind_param($stmtProduto, 'i', $produto_id);
        mysqli_stmt_execute($stmtProduto);
        $resultado = mysqli_stmt_get_result($stmtProduto);
        $produto   = mysqli_fetch_assoc($resultado);
        mysqli_stmt_close($stmtProduto);

        if (!$produto || !$produto['ativo']) {
            throw new Exception('Produto indisponível.');
        }

        if ($produto['estoque'] < $quantidade) {
            throw new Exception('Estoque insuficiente para um dos produtos.');
        }

        $subtotal = $produto['preco'] * $quantidade;
        $total   += $subtotal;

        $itens[] = [
            'produto_id'     => $produto_id,
            'quantidade'     => $quantidade,
            'preco_unitario' => $produto['preco'],
            'subtotal'       => $subtotal,
        ];
    }

    // =============================================
    // 5. CRIA O PEDIDO
    // =============================================

    $sqlPedido  = "INSERT INTO pedidos (usuario_id, endereco_id, status, total)
                   VALUES (?, ?, 'pendente', ?)";
    $stmtPedido = mysqli_prepare($conexao, $sqlPedido);
    mysqli_stmt_bind_param($stmtPedido, 'iid', $usuario_id, $endereco_id, $total);
    mysqli_stmt_execute($stmtPedido);
    $pedido_id = mysqli_insert_id($conexao);
    mysqli_stmt_close($stmtPedido);

    // =============================================
    // 6. INSERE OS ITENS E BAIXA O ESTOQUE
    // =============================================

    $sqlItem  = "INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal)
                 VALUES (?, ?, ?, ?, ?)";
    $stmtItem = mysqli_prepare($conexao, $sqlItem);

    $sqlBaixa  = "UPDATE produtos SET estoque = estoque - ? WHERE id = ?";
    $stmtBaixa = mysqli_prepare($conexao, $sqlBaixa);

    foreach ($itens as $item) {
        mysqli_stmt_bind_param(
            $stmtItem,
            'iiidd',
            $pedido_id,
            $item['produto_id'],
            $item['quantidade'],
            $item['preco_unitario'],
            $item['subtotal']
        );
        mysqli_stmt_execute($stmtItem);

        mysqli_stmt_bind_param($stmtBaixa, 'ii', $item['quantidade'], $item['produto_id']);
        mysqli_stmt_execute($stmtBaixa);
    }

    mysqli_stmt_close($stmtItem);
    mysqli_stmt_close($stmtBaixa);

    // =============================================
    // 7. REGISTRA O PAGAMENTO (na entrega/loja)
    // =============================================

    $sqlPagamento  = "INSERT INTO pagamentos (usuario_id, pedido_id, metodo, status, valor)
                      VALUES (?, ?, 'na_entrega', 'pendente', ?)";
    $stmtPagamento = mysqli_prepare($conexao, $sqlPagamento);
    mysqli_stmt_bind_param($stmtPagamento, 'iid', $usuario_id, $pedido_id, $total);
    mysqli_stmt_execute($stmtPagamento);
    mysqli_stmt_close($stmtPagamento);

    mysqli_commit($conexao);

    echo json_encode([
        'sucesso'   => true,
        'mensagem'  => 'Pedido realizado com sucesso! Pagamento na entrega.',
        'pedido_id' => $pedido_id,
        'total'     => $total,
    ]);

} catch (Exception $e) {

    mysqli_rollback($conexao);

    echo json_encode([
        'sucesso'  => false,
        'mensagem' => 'Não foi possível concluir o pedido: ' . $e->getMessage(),
    ]);
}
