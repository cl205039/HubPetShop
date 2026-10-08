<?php

// Configurações do banco de dados local
define('DB_HOST',     '192.168.1.180');//COTIL CASO RODE Na MAQUINA DA NAYARA
//define('DB_HOST',     'localhost'); //COMPUTADOR LAVIGNIA
define('DB_USUARIO',  'root');       // usuário padrão do XAMPP/WAMP
define('DB_SENHA', '');           // senha padrão local é vazia
define('DB_BANCO',    'hubpetshop');
define ('DB_PORT', 3307);

// Cria a conexão
$conexao = mysqli_connect(DB_HOST, DB_USUARIO, DB_SENHA, DB_BANCO, DB_PORT);

// Verifica se conectou
if (!$conexao) {
    die(json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao conectar com o banco de dados: ' . mysqli_connect_error()
    ]));
}

// Define o charset para suportar acentos
mysqli_set_charset($conexao, 'utf8mb4');