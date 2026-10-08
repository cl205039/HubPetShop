<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$metodo = $_SERVER['REQUEST_METHOD'];

if ($metodo === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/lib/Helpers.php';
require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/controllers/usuarios.php';
require_once __DIR__ . '/controllers/pets.php';
require_once __DIR__ . '/controllers/enderecos.php';
require_once __DIR__ . '/controllers/petshops.php';
require_once __DIR__ . '/controllers/produtos.php';
require_once __DIR__ . '/controllers/servicos.php';
require_once __DIR__ . '/controllers/veterinarios.php';
require_once __DIR__ . '/controllers/agendamentos.php';
require_once __DIR__ . '/controllers/pedidos.php';

$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME']));
$uri = (string)parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($scriptDir !== '/' && strpos($uri, $scriptDir) === 0) {
    $uri = substr($uri, strlen($scriptDir));
}
$caminho = trim($uri, '/');
$segmentos = $caminho === '' ? [] : explode('/', $caminho);
$corpo = corpoRequisicao();

try {
    $recurso = $segmentos[0] ?? '';
    $n = count($segmentos);

    if ($n === 0) {
        Response::json(['api' => 'HubPet', 'status' => 'ok'], 200);
    }

    // Usuários
    if ($recurso === 'usuarios' && $n === 1 && $metodo === 'POST') {
        Usuarios::cadastrar($corpo);
    }
    if ($recurso === 'usuarios' && $n === 1 && $metodo === 'GET') {
        Usuarios::buscar($_GET);
    }
    if ($recurso === 'usuarios' && $n === 2 && $segmentos[1] === 'login' && $metodo === 'POST') {
        Usuarios::login($corpo);
    }
    if ($recurso === 'usuarios' && $n === 2 && $segmentos[1] === 'redefinir-senha' && $metodo === 'POST') {
        Usuarios::redefinirSenha($corpo);
    }
    if ($recurso === 'usuarios' && $n === 2 && ehId($segmentos[1]) && $metodo === 'GET') {
        Usuarios::buscarPorId((int)$segmentos[1]);
    }
    if ($recurso === 'usuarios' && $n === 3 && ehId($segmentos[1]) && $segmentos[2] === 'pets') {
        $usuarioId = (int)$segmentos[1];
        if ($metodo === 'GET') {
            Pets::listar($usuarioId);
        }
        if ($metodo === 'POST') {
            Pets::criar($usuarioId, $corpo);
        }
    }
    if ($recurso === 'usuarios' && $n === 3 && ehId($segmentos[1]) && $segmentos[2] === 'enderecos') {
        $usuarioId = (int)$segmentos[1];
        if ($metodo === 'GET') {
            Enderecos::listar($usuarioId);
        }
        if ($metodo === 'POST') {
            Enderecos::criar($usuarioId, $corpo);
        }
    }
    if ($recurso === 'usuarios' && $n === 3 && ehId($segmentos[1]) && $segmentos[2] === 'agendamentos') {
        $usuarioId = (int)$segmentos[1];
        if ($metodo === 'GET') {
            Agendamentos::listar($usuarioId);
        }
        if ($metodo === 'POST') {
            Agendamentos::criar($usuarioId, $corpo);
        }
    }
    if ($recurso === 'usuarios' && $n === 3 && ehId($segmentos[1]) && $segmentos[2] === 'pedidos') {
        $usuarioId = (int)$segmentos[1];
        if ($metodo === 'GET') {
            Pedidos::listar($usuarioId);
        }
        if ($metodo === 'POST') {
            Pedidos::criar($usuarioId, $corpo);
        }
    }

    // Pets
    if ($recurso === 'pets' && $n === 2 && ehId($segmentos[1])) {
        $id = (int)$segmentos[1];
        if ($metodo === 'PUT') {
            Pets::atualizar($id, $corpo);
        }
        if ($metodo === 'DELETE') {
            Pets::remover($id);
        }
    }

    // Endereços
    if ($recurso === 'enderecos' && $n === 2 && ehId($segmentos[1]) && $metodo === 'DELETE') {
        Enderecos::remover((int)$segmentos[1]);
    }

    // Petshops
    if ($recurso === 'petshops' && $n === 1 && $metodo === 'GET') {
        Petshops::listar();
    }
    if ($recurso === 'petshops' && $n === 2 && ehId($segmentos[1]) && $metodo === 'GET') {
        Petshops::buscarPorId((int)$segmentos[1]);
    }
    if ($recurso === 'petshops' && $n === 3 && ehId($segmentos[1]) && $segmentos[2] === 'ofertas' && $metodo === 'GET') {
        Produtos::ofertasPorPetshop((int)$segmentos[1]);
    }

    // Produtos / ofertas
    if ($recurso === 'produtos' && $n === 2 && $segmentos[1] === 'ofertas' && $metodo === 'GET') {
        Produtos::ofertas($_GET['categoria'] ?? null);
    }

    // Serviços (catálogo global)
    if ($recurso === 'servicos' && $n === 1 && $metodo === 'GET') {
        Servicos::listar();
    }

    // Veterinários
    if ($recurso === 'veterinarios' && $n === 3 && ehId($segmentos[1]) && $segmentos[2] === 'servicos') {
        $veterinarioId = (int)$segmentos[1];
        if ($metodo === 'GET') {
            Veterinarios::listarServicos($veterinarioId);
        }
        if ($metodo === 'POST') {
            Veterinarios::criarServico($veterinarioId, $corpo);
        }
    }
    if ($recurso === 'servicos-vet' && $n === 2 && ehId($segmentos[1]) && $metodo === 'DELETE') {
        Veterinarios::removerServico((int)$segmentos[1]);
    }

    Response::erro(404, 'rota_nao_encontrada', 'Rota não encontrada.');
} catch (\PDOException $e) {
    Response::erro(500, 'erro_banco_dados', 'Erro ao acessar o banco de dados.');
} catch (\Throwable $e) {
    Response::erro(500, 'erro_interno', 'Erro interno do servidor.');
}
