<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function usuarios_linha_para_json(array $linha): array {
    // Nunca inclui senha_hash — equivale a "senha nunca volta em
    // nenhuma resposta da API", exigido em docs/API.md.
    return [
        'id'               => (int) $linha['id'],
        'nome'             => $linha['nome'],
        'cpf'              => $linha['cpf'],
        'email'            => $linha['email'],
        'telefone'         => $linha['telefone'],
        'aceitaNewsletter' => (bool) $linha['aceita_newsletter'],
        'aceitaTermos'     => (bool) $linha['aceita_termos'],
        'tipoUsuario'      => $linha['tipo_usuario'],
        'notificacoes'     => (bool) $linha['notificacoes'],
        'localizacao'      => (bool) $linha['localizacao'],
    ];
}

function usuarios_cadastrar(): void {
    $dados = corpoRequisicao();
    foreach (['nome', 'cpf', 'email', 'telefone', 'senha', 'tipoUsuario'] as $campo) {
        if (!campoObrigatorio($dados, $campo)) {
            erro(400, 'campo_obrigatorio', "Informe o campo obrigatório: $campo.");
        }
    }

    $pdo = conexao();
    $existe = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $existe->execute([$dados['email']]);
    if ($existe->fetch()) {
        erro(409, 'email_ja_cadastrado', 'Este e-mail já está cadastrado.');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO usuarios
           (nome, cpf, email, telefone, senha_hash, aceita_newsletter, aceita_termos, tipo_usuario, notificacoes, localizacao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $dados['nome'], $dados['cpf'], $dados['email'], $dados['telefone'],
        password_hash($dados['senha'], PASSWORD_BCRYPT),
        !empty($dados['aceitaNewsletter']) ? 1 : 0,
        !empty($dados['aceitaTermos']) ? 1 : 0,
        $dados['tipoUsuario'],
        array_key_exists('notificacoes', $dados) ? (!empty($dados['notificacoes']) ? 1 : 0) : 1,
        !empty($dados['localizacao']) ? 1 : 0,
    ]);

    responder(201, usuarios_linha_para_json(buscarUsuarioPorId($pdo, (int) $pdo->lastInsertId())));
}

function usuarios_login(): void {
    $dados = corpoRequisicao();
    if (!campoObrigatorio($dados, 'email') || !campoObrigatorio($dados, 'senha')) {
        erro(400, 'campo_obrigatorio', 'Informe e-mail e senha.');
    }

    $pdo = conexao();
    $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = ?');
    $stmt->execute([$dados['email']]);
    $linha = $stmt->fetch();

    if (!$linha || !password_verify($dados['senha'], $linha['senha_hash'])) {
        erro(401, 'credenciais_invalidas', 'E-mail ou senha incorretos.');
    }

    responder(200, usuarios_linha_para_json($linha));
}

function usuarios_redefinir_senha(): void {
    $dados = corpoRequisicao();
    if (!campoObrigatorio($dados, 'email') || !campoObrigatorio($dados, 'novaSenha')) {
        erro(400, 'campo_obrigatorio', 'Informe e-mail e nova senha.');
    }

    $pdo = conexao();
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$dados['email']]);
    $linha = $stmt->fetch();
    if (!$linha) erro(404, 'email_nao_cadastrado', 'E-mail não cadastrado.');

    $pdo->prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?')
        ->execute([password_hash($dados['novaSenha'], PASSWORD_BCRYPT), $linha['id']]);

    responder(200, new stdClass());
}

function usuarios_buscar_por_id(string $id): void {
    $linha = buscarUsuarioPorId(conexao(), (int) $id);
    if (!$linha) erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
    responder(200, usuarios_linha_para_json($linha));
}

// Busca por UM atributo por vez: nome | email | telefone | cpf (substring,
// case-insensitive) ou tipo (substring contra o rótulo em português).
function usuarios_buscar(): void {
    $pdo = conexao();
    $mapaColuna = ['nome' => 'nome', 'email' => 'email', 'telefone' => 'telefone', 'cpf' => 'cpf'];

    if (!empty($_GET['tipo'])) {
        $rotulos = [
            'pessoafisica'   => 'Pessoa Física',
            'pessoajuridica' => 'Pessoa Jurídica',
        ];
        $termo = mb_strtolower($_GET['tipo']);
        $tipos = array_keys(array_filter($rotulos, fn($r) => str_contains(mb_strtolower($r), $termo)));
        if (empty($tipos)) responder(200, []);
        $marcadores = implode(',', array_fill(0, count($tipos), '?'));
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE tipo_usuario IN ($marcadores)");
        $stmt->execute($tipos);
    } else {
        $filtro = null;
        foreach ($mapaColuna as $param => $coluna) {
            if (!empty($_GET[$param])) { $filtro = [$coluna, $_GET[$param]]; break; }
        }
        if ($filtro) {
            [$coluna, $termo] = $filtro;
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE $coluna LIKE ?");
            $stmt->execute(['%' . $termo . '%']);
        } else {
            $stmt = $pdo->query('SELECT * FROM usuarios');
        }
    }

    responder(200, array_map('usuarios_linha_para_json', $stmt->fetchAll()));
}

function buscarUsuarioPorId(PDO $pdo, int $id): array|false {
    $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}
