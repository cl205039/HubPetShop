<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

// =============================================
// 1. RECEBE E VALIDA OS DADOS
// =============================================

$nome     = trim($_POST['nome']     ?? '');
$email    = trim($_POST['email']    ?? '');
$senha    = trim($_POST['senha']    ?? '');
$telefone = trim($_POST['telefone'] ?? '');
$cpf      = trim($_POST['cpf']      ?? '');

if (empty($nome) || empty($email) || empty($senha)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha nome, e-mail e senha.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail inválido.']);
    exit;
}

if (strlen($senha) < 6) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'A senha deve ter pelo menos 6 caracteres.']);
    exit;
}

// =============================================
// 2. CONECTA AO BANCO
// =============================================

require_once 'conexao.php';

// =============================================
// 3. VERIFICA SE E-MAIL JÁ EXISTE
// =============================================

$sqlVerifica  = "SELECT id FROM usuarios WHERE email = ?";
$stmtVerifica = mysqli_prepare($conexao, $sqlVerifica);
mysqli_stmt_bind_param($stmtVerifica, 's', $email);
mysqli_stmt_execute($stmtVerifica);
mysqli_stmt_store_result($stmtVerifica);

if (mysqli_stmt_num_rows($stmtVerifica) > 0) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Este e-mail já está cadastrado.']);
    mysqli_stmt_close($stmtVerifica);
    exit;
}
mysqli_stmt_close($stmtVerifica);

// =============================================
// 4. CRIA HASH DA SENHA E INSERE
// =============================================

$senhaHash = password_hash($senha, PASSWORD_DEFAULT);

$sql  = "INSERT INTO usuarios (nome, email, senha, telefone, cpf, ativo)
         VALUES (?, ?, ?, ?, ?, TRUE)";
$stmt = mysqli_prepare($conexao, $sql);

if (!$stmt) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao preparar o cadastro.']);
    exit;
}

mysqli_stmt_bind_param($stmt, 'sssss', $nome, $email, $senhaHash, $telefone, $cpf);

if (!mysqli_stmt_execute($stmt)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao salvar cadastro.']);
    mysqli_stmt_close($stmt);
    exit;
}

$usuario_id = mysqli_insert_id($conexao);
mysqli_stmt_close($stmt);

// =============================================
// 5. JÁ LOGA O CLIENTE AUTOMATICAMENTE
// =============================================

session_start();
$_SESSION['usuario_id']    = $usuario_id;
$_SESSION['usuario_nome']  = $nome;
$_SESSION['usuario_email'] = $email;

echo json_encode([
    'sucesso'  => true,
    'mensagem' => 'Cadastro realizado com sucesso!',
    'usuario'  => [
        'id'    => $usuario_id,
        'nome'  => $nome,
        'email' => $email,
    ]
]);
