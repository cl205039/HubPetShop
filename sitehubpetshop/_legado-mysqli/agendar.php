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
    echo json_encode(['sucesso' => false, 'precisa_login' => true, 'mensagem' => 'Faça login para agendar.']);
    exit;
}

$usuario_id = (int) $_SESSION['usuario_id'];

// =============================================
// 2. RECEBE OS DADOS
// =============================================

$servico_id  = (int) ($_POST['servico_id'] ?? 0);
$data        = trim($_POST['data'] ?? ''); // formato: YYYY-MM-DD
$hora        = trim($_POST['hora'] ?? ''); // formato: HH:MM
$observacoes = trim($_POST['observacoes'] ?? '');

if ($servico_id <= 0 || empty($data) || empty($hora)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Selecione o serviço, a data e o horário.']);
    exit;
}

$data_hora = $data . ' ' . $hora . ':00';

// Não permite agendar no passado
if (strtotime($data_hora) < time()) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Não é possível agendar em uma data/hora que já passou.']);
    exit;
}

require_once 'conexao.php';

// =============================================
// 3. BUSCA O SERVIÇO (pega preço e parceiro automaticamente)
// =============================================

$sqlServico  = "SELECT id, parceiro_id, preco, ativo FROM servicos WHERE id = ? LIMIT 1";
$stmtServico = mysqli_prepare($conexao, $sqlServico);
mysqli_stmt_bind_param($stmtServico, 'i', $servico_id);
mysqli_stmt_execute($stmtServico);
$resultado = mysqli_stmt_get_result($stmtServico);
$servico   = mysqli_fetch_assoc($resultado);
mysqli_stmt_close($stmtServico);

if (!$servico || !$servico['ativo']) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Serviço indisponível.']);
    exit;
}

// =============================================
// 4. VERIFICA SE O HORÁRIO JÁ ESTÁ OCUPADO
//    (mesmo parceiro, mesma data/hora, ainda não cancelado)
// =============================================

$sqlConflito  = "SELECT id FROM agendamentos
                  WHERE parceiro_id = ? AND data_hora = ? AND status != 'cancelado'
                  LIMIT 1";
$stmtConflito = mysqli_prepare($conexao, $sqlConflito);
mysqli_stmt_bind_param($stmtConflito, 'is', $servico['parceiro_id'], $data_hora);
mysqli_stmt_execute($stmtConflito);
mysqli_stmt_store_result($stmtConflito);

if (mysqli_stmt_num_rows($stmtConflito) > 0) {
    mysqli_stmt_close($stmtConflito);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Esse horário acabou de ser reservado. Escolha outro.']);
    exit;
}
mysqli_stmt_close($stmtConflito);

// =============================================
// 5. CRIA O AGENDAMENTO (sem pet, conforme definido)
// =============================================

$sqlInsere = "INSERT INTO agendamentos
                  (usuario_id, pet_id, servico_id, parceiro_id, data_hora, status, preco, observacoes)
              VALUES (?, NULL, ?, ?, ?, 'pendente', ?, ?)";

$stmtInsere = mysqli_prepare($conexao, $sqlInsere);

if (!$stmtInsere) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao preparar o agendamento.']);
    exit;
}

mysqli_stmt_bind_param(
    $stmtInsere,
    'iiisds',
    $usuario_id,
    $servico_id,
    $servico['parceiro_id'],
    $data_hora,
    $servico['preco'],
    $observacoes
);

if (!mysqli_stmt_execute($stmtInsere)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao salvar o agendamento.']);
    mysqli_stmt_close($stmtInsere);
    exit;
}

$agendamento_id = mysqli_insert_id($conexao);
mysqli_stmt_close($stmtInsere);

echo json_encode([
    'sucesso'        => true,
    'mensagem'       => 'Agendamento realizado com sucesso!',
    'agendamento_id' => $agendamento_id,
]);
