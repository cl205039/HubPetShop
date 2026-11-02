<?php

// Lê o corpo JSON da requisição como array.
function corpoRequisicao(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $dados = json_decode($raw, true);
    return is_array($dados) ? $dados : [];
}

// Verifica se o segmento da URL é um id numérico.
function ehId($segmento): bool
{
    return $segmento !== null && $segmento !== '' && ctype_digit((string)$segmento);
}

// Converte um valor em booleano.
function paraBool($valor, bool $padrao = false): bool
{
    if ($valor === null) {
        return $padrao;
    }
    return filter_var($valor, FILTER_VALIDATE_BOOLEAN);
}
