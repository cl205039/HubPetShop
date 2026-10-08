<?php

class Usuarios
{
    private const TIPOS_VALIDOS = ['pessoafisica', 'pessoajuridica', 'veterinario'];

    private const ROTULOS_TIPO = [
        'pessoafisica'   => 'Pessoa Física',
        'pessoajuridica' => 'Pessoa Jurídica',
        'veterinario'    => 'Veterinário',
    ];

    public static function existe(int $id): bool
    {
        $stmt = Database::get()->prepare('SELECT 1 FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        return (bool)$stmt->fetchColumn();
    }

    private static function transformar(array $linha): array
    {
        return [
            'id'               => (int)$linha['id'],
            'nome'             => $linha['nome'],
            'cpf'              => $linha['cpf'],
            'email'            => $linha['email'],
            'telefone'         => $linha['telefone'],
            'aceitaNewsletter' => (bool)$linha['aceita_newsletter'],
            'aceitaTermos'     => (bool)$linha['aceita_termos'],
            'tipoUsuario'      => $linha['tipo_usuario'],
            'notificacoes'     => (bool)$linha['notificacoes'],
            'localizacao'      => (bool)$linha['localizacao'],
        ];
    }

    public static function cadastrar(array $corpo): void
    {
        foreach (['nome', 'cpf', 'email', 'telefone', 'senha', 'tipoUsuario'] as $campo) {
            if (empty($corpo[$campo])) {
                Response::erro(400, 'campo_obrigatorio', "O campo \"$campo\" é obrigatório.");
            }
        }

        if (!in_array($corpo['tipoUsuario'], self::TIPOS_VALIDOS, true)) {
            Response::erro(400, 'tipo_usuario_invalido', 'tipoUsuario deve ser pessoafisica, pessoajuridica ou veterinario.');
        }

        $pdo = Database::get();

        $stmt = $pdo->prepare('SELECT 1 FROM usuarios WHERE email = ?');
        $stmt->execute([$corpo['email']]);
        if ($stmt->fetchColumn()) {
            Response::erro(409, 'email_ja_cadastrado', 'Este e-mail já está cadastrado.');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO usuarios (nome, cpf, email, telefone, senha, aceita_newsletter, aceita_termos, tipo_usuario, notificacoes, localizacao)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $corpo['nome'],
            $corpo['cpf'],
            $corpo['email'],
            $corpo['telefone'],
            password_hash($corpo['senha'], PASSWORD_BCRYPT),
            paraBool($corpo['aceitaNewsletter'] ?? null),
            paraBool($corpo['aceitaTermos'] ?? null),
            $corpo['tipoUsuario'],
            paraBool($corpo['notificacoes'] ?? null, true),
            paraBool($corpo['localizacao'] ?? null),
        ]);

        $id = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::transformar($stmt->fetch()), 201);
    }

    public static function login(array $corpo): void
    {
        if (empty($corpo['email']) || empty($corpo['senha'])) {
            Response::erro(400, 'campo_obrigatorio', 'email e senha são obrigatórios.');
        }

        $stmt = Database::get()->prepare('SELECT * FROM usuarios WHERE email = ?');
        $stmt->execute([$corpo['email']]);
        $usuario = $stmt->fetch();

        if (!$usuario || !password_verify($corpo['senha'], $usuario['senha'])) {
            Response::erro(401, 'credenciais_invalidas', 'E-mail ou senha inválidos.');
        }

        Response::json(self::transformar($usuario), 200);
    }

    public static function redefinirSenha(array $corpo): void
    {
        if (empty($corpo['email']) || empty($corpo['novaSenha'])) {
            Response::erro(400, 'campo_obrigatorio', 'email e novaSenha são obrigatórios.');
        }

        $pdo = Database::get();
        $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
        $stmt->execute([$corpo['email']]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            Response::erro(404, 'email_nao_cadastrado', 'Este e-mail não está cadastrado.');
        }

        $stmt = $pdo->prepare('UPDATE usuarios SET senha = ? WHERE id = ?');
        $stmt->execute([password_hash($corpo['novaSenha'], PASSWORD_BCRYPT), $usuario['id']]);

        Response::json(new stdClass(), 200);
    }

    public static function buscarPorId(int $id): void
    {
        $stmt = Database::get()->prepare('SELECT * FROM usuarios WHERE id = ?');
        $stmt->execute([$id]);
        $usuario = $stmt->fetch();

        if (!$usuario) {
            Response::erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
        }

        Response::json(self::transformar($usuario), 200);
    }

    public static function buscar(array $query): void
    {
        $stmt = Database::get()->query('SELECT * FROM usuarios ORDER BY id');
        $usuarios = $stmt->fetchAll();

        $filtro = null;
        $valor = null;
        foreach (['nome', 'email', 'telefone', 'cpf', 'tipo'] as $campo) {
            if (!empty($query[$campo])) {
                $filtro = $campo;
                $valor = $query[$campo];
                break;
            }
        }

        if ($filtro !== null) {
            $usuarios = array_values(array_filter($usuarios, function ($usuario) use ($filtro, $valor) {
                if ($filtro === 'tipo') {
                    $rotulo = self::ROTULOS_TIPO[$usuario['tipo_usuario']] ?? '';
                    return mb_stripos($rotulo, $valor) !== false;
                }
                return mb_stripos((string)$usuario[$filtro], $valor) !== false;
            }));
        }

        Response::json(array_map([self::class, 'transformar'], $usuarios), 200);
    }
}
