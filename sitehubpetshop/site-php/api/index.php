<?php
require __DIR__ . '/cors.php';
require __DIR__ . '/helpers.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$caminho = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
// Se a API estiver publicada em /sitehubpetshop/site-php/api/, remove esse prefixo antes de rotear.
$caminho = preg_replace('#^sitehubpetshop/site-php/api/?#', '', $caminho);

// [método, regex, arquivo, função]
$rotas = [
    ['POST',   '#^usuarios$#',                    'usuarios.php',    'usuarios_cadastrar'],
    ['POST',   '#^usuarios/login$#',              'usuarios.php',    'usuarios_login'],
    ['POST',   '#^usuarios/redefinir-senha$#',    'usuarios.php',    'usuarios_redefinir_senha'],
    ['GET',    '#^usuarios/(\d+)$#',              'usuarios.php',    'usuarios_buscar_por_id'],
    ['GET',    '#^usuarios$#',                    'usuarios.php',    'usuarios_buscar'],

    ['GET',    '#^usuarios/(\d+)/pets$#',         'pets.php',        'pets_listar'],
    ['POST',   '#^usuarios/(\d+)/pets$#',         'pets.php',        'pets_cadastrar'],
    ['PUT',    '#^pets/(\d+)$#',                  'pets.php',        'pets_atualizar'],
    ['DELETE', '#^pets/(\d+)$#',                  'pets.php',        'pets_remover'],

    ['GET',    '#^usuarios/(\d+)/enderecos$#',    'enderecos.php',   'enderecos_listar'],
    ['POST',   '#^usuarios/(\d+)/enderecos$#',    'enderecos.php',   'enderecos_cadastrar'],
    ['DELETE', '#^enderecos/(\d+)$#',             'enderecos.php',   'enderecos_remover'],

    ['GET',    '#^petshops$#',                    'petshops.php',    'petshops_listar'],
    ['GET',    '#^petshops/(\d+)$#',              'petshops.php',    'petshops_buscar_por_id'],
    ['GET',    '#^petshops/(\d+)/ofertas$#',      'produtos.php',    'ofertas_por_petshop'],
    ['GET',    '#^produtos/ofertas$#',            'produtos.php',    'ofertas_todas'],

    ['GET',    '#^servicos$#',                    'servicos.php',    'servicos_listar'],

    ['GET',    '#^usuarios/(\d+)/agendamentos$#', 'agendamentos.php', 'agendamentos_listar'],
    ['POST',   '#^usuarios/(\d+)/agendamentos$#', 'agendamentos.php', 'agendamentos_cadastrar'],

    ['GET',    '#^usuarios/(\d+)/pedidos$#',      'pedidos.php',     'pedidos_listar'],
    ['POST',   '#^usuarios/(\d+)/pedidos$#',      'pedidos.php',     'pedidos_cadastrar'],
];

foreach ($rotas as [$metodoRota, $regex, $arquivo, $funcao]) {
    if ($metodo !== $metodoRota) continue;
    if (preg_match($regex, $caminho, $m)) {
        array_shift($m);
        require __DIR__ . '/' . $arquivo;
        $funcao(...$m);
        exit;
    }
}

erro(404, 'rota_nao_encontrada', 'Rota não encontrada.');
