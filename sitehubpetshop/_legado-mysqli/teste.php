<?php
 
// Configurações
$host   = '192.168.1.180';
$usuario = 'root';
$senha   = '';
$banco   = 'hubpetshop';
$porta = 3307;
 
// Tenta conectar
$conexao = mysqli_connect($host, $usuario, $senha, $banco, $porta);
 
// Mostra resultado na tela
if (!$conexao) {
    echo '<h2 style="color:red">❌ Conexão FALHOU</h2>';
    echo '<p><strong>Erro:</strong> ' . mysqli_connect_error() . '</p>';
    echo '<p><strong>Código:</strong> ' . mysqli_connect_errno() . '</p>';
} else {
    echo '<h2 style="color:green">✅ Conexão OK!</h2>';
    echo '<p>Banco <strong>' . $banco . '</strong> conectado com sucesso.</p>';
    mysqli_close($conexao);
}