<?php

function corpoRequisicao(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $dados = json_decode($raw, true);
    return is_array($dados) ? $dados : [];
}

function ehId($segmento): bool
{
    return $segmento !== null && $segmento !== '' && ctype_digit((string)$segmento);
}

function paraBool($valor, bool $padrao = false): bool
{
    if ($valor === null) {
        return $padrao;
    }
    return filter_var($valor, FILTER_VALIDATE_BOOLEAN);
}
