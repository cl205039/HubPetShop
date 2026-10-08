<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

session_start();
$_SESSION = [];
session_destroy();

echo json_encode(['sucesso' => true, 'mensagem' => 'Sessão encerrada.']);
