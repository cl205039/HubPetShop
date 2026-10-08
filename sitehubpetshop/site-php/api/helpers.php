<?php
function corpoRequisicao(): array {
    $dados = json_decode(file_get_contents('php://input'), true);
    return is_array($dados) ? $dados : [];
}

function responder(int $status, $dados = null): void {
    http_response_code($status);
    if ($dados !== null) echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

// Sempre no formato { "erro": "...", "mensagem": "..." } exigido por docs/API.md.
function erro(int $status, string $codigo, string $mensagem): void {
    responder($status, ['erro' => $codigo, 'mensagem' => $mensagem]);
}

function campoObrigatorio(array $dados, string $campo): bool {
    return isset($dados[$campo]) && $dados[$campo] !== '';
}
