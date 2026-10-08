<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Método não permitido.']);
    exit;
}

// =============================================
// 1. RECEBE OS DADOS
// =============================================

$email = trim($_POST['email'] ?? '');
$senha = trim($_POST['senha'] ?? '');

if (empty($email) || empty($senha)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha o e-mail e a senha.']);
    exit;
}

// =============================================
// 2. CONECTA AO BANCO
// =============================================

require_once 'conexao.php';

// =============================================
// 3. BUSCA O USUARIO PELO E-MAIL
// =============================================

$sql  = "SELECT id, nome, email, senha, ativo FROM usuarios WHERE email = ? LIMIT 1";
$stmt = mysqli_prepare($conexao, $sql);

if (!$stmt) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao preparar a consulta.']);
    exit;
}

mysqli_stmt_bind_param($stmt, 's', $email);
mysqli_stmt_execute($stmt);
$resultado = mysqli_stmt_get_result($stmt);
$usuario   = mysqli_fetch_assoc($resultado);
mysqli_stmt_close($stmt);

// =============================================
// 4. VALIDA CREDENCIAIS
// =============================================

if (!$usuario || !password_verify($senha, $usuario['senha'])) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail ou senha incorretos.']);
    exit;
}

if (!$usuario['ativo']) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Sua conta está desativada. Fale com o suporte.']);
    exit;
}

// =============================================
// 5. INICIA SESSÃO
// =============================================

session_start();
$_SESSION['usuario_id']    = $usuario['id'];
$_SESSION['usuario_nome']  = $usuario['nome'];
$_SESSION['usuario_email'] = $usuario['email'];

echo json_encode([
    'sucesso'  => true,
    'mensagem' => 'Login realizado com sucesso!',
    'usuario'  => [
        'id'    => $usuario['id'],
        'nome'  => $usuario['nome'],
        'email' => $usuario['email'],
    ]
]);
