<?php

class Agendamentos
{
    private const STATUS_VALIDOS = ['Confirmado', 'Pendente', 'Concluído'];

    // Regras de horário iguais às da agenda do desktop.
    private const DURACAO_PADRAO_MIN = 30;
    private const FUSO = 'America/Sao_Paulo';

    // Horário padrão: seg a sáb, 08:00 às 18:00; domingo fechado.
    private static function horarioPadrao(int $diaSemana): array
    {
        $fechado = $diaSemana === 0;
        return [
            'abertura'   => $fechado ? null : '08:00',
            'fechamento' => $fechado ? null : '18:00',
            'fechado'    => $fechado,
        ];
    }

    // Converte texto de duração em minutos ("1h30" -> 90).
    private static function duracaoEmMinutos(?string $texto): ?int
    {
        $t = strtolower(preg_replace('/\s+/', '', (string)$texto));
        if (preg_match('/^(\d+)h(\d+)?/', $t, $m)) {
            return (int)$m[1] * 60 + (int)($m[2] ?? 0);
        }
        if (preg_match('/^(\d+)/', $t, $m)) {
            return (int)$m[1];
        }
        return null;
    }

    // Soma a duração dos serviços do agendamento (30 min se não encontrar).
    private static function duracaoDoAgendamento(?string $servico, array $servicosDoPetshop): int
    {
        $nomes = array_filter(
            array_map(fn($s) => mb_strtolower(trim($s)), explode(',', (string)$servico)),
            fn($s) => $s !== ''
        );
        if (count($nomes) === 0) {
            return self::DURACAO_PADRAO_MIN;
        }

        $total = 0;
        foreach ($nomes as $nome) {
            $duracao = null;
            foreach ($servicosDoPetshop as $s) {
                if (mb_strtolower(trim($s['nome'])) === $nome) {
                    $duracao = self::duracaoEmMinutos($s['duracao']);
                    break;
                }
            }
            $total += $duracao ?: self::DURACAO_PADRAO_MIN;
        }
        return $total;
    }

    // Hora de início em minutos desde a meia-noite (usa hora ou data).
    private static function inicioEmMinutos(?string $hora, ?string $data): ?int
    {
        $texto = $hora ?: (preg_split('/[T ]/', (string)$data)[1] ?? '');
        if (preg_match('/^(\d{1,2}):(\d{2})/', (string)$texto, $m)) {
            return (int)$m[1] * 60 + (int)$m[2];
        }
        return null;
    }

    // Converte "HH:MM" em minutos.
    private static function minutos(string $hora): int
    {
        [$h, $m] = array_map('intval', explode(':', $hora));
        return $h * 60 + $m;
    }

    // Valida o horário: null se livre, ou [status, codigo, mensagem] do erro.
    private static function validarHorario(PDO $pdo, int $petshopId, array $corpo): ?array
    {
        $fuso = new DateTimeZone(self::FUSO);
        $data = substr((string)($corpo['data'] ?? ''), 0, 10);
        $inicio = self::inicioEmMinutos($corpo['hora'] ?? null, $corpo['data'] ?? null);
        $dia = DateTime::createFromFormat('!Y-m-d', $data, $fuso);

        if (!$dia || $dia->format('Y-m-d') !== $data || $inicio === null) {
            return [400, 'data_hora_invalida', 'Informe a data (AAAA-MM-DD) e o horário (HH:MM) do agendamento.'];
        }

        $agora = new DateTime('now', $fuso);
        $hoje = $agora->format('Y-m-d');
        $minutosAgora = (int)$agora->format('G') * 60 + (int)$agora->format('i');
        if ($data < $hoje || ($data === $hoje && $inicio < $minutosAgora)) {
            return [409, 'horario_indisponivel', 'Essa data ou horário já passou. Escolha outro horário.'];
        }

        $diaSemana = (int)$dia->format('w');
        $stmt = $pdo->prepare(
            'SELECT hora_abertura, hora_fechamento, fechado FROM horarios_funcionamento WHERE petshop_id = ? AND dia_semana = ? LIMIT 1'
        );
        $stmt->execute([$petshopId, $diaSemana]);
        $linha = $stmt->fetch();
        $horario = $linha
            ? [
                'abertura'   => $linha['hora_abertura'] ? substr($linha['hora_abertura'], 0, 5) : null,
                'fechamento' => $linha['hora_fechamento'] ? substr($linha['hora_fechamento'], 0, 5) : null,
                'fechado'    => (bool)$linha['fechado'],
            ]
            : self::horarioPadrao($diaSemana);

        if ($horario['fechado'] || !$horario['abertura'] || !$horario['fechamento']) {
            return [409, 'horario_indisponivel', 'O petshop está fechado nesse dia.'];
        }

        $stmt = $pdo->prepare('SELECT nome, duracao FROM servicos_petshop WHERE petshop_id = ?');
        $stmt->execute([$petshopId]);
        $servicos = $stmt->fetchAll();

        $fim = $inicio + self::duracaoDoAgendamento($corpo['servico'] ?? null, $servicos);
        if ($inicio < self::minutos($horario['abertura']) || $fim > self::minutos($horario['fechamento'])) {
            return [409, 'horario_indisponivel', sprintf(
                'Esse horário está fora do funcionamento do petshop (%s às %s).',
                $horario['abertura'],
                $horario['fechamento']
            )];
        }

        // Verifica conflito com outros agendamentos do dia.
        $stmt = $pdo->prepare(
            "SELECT hora, data, servico FROM agendamentos
             WHERE petshop_id = ? AND status <> 'Cancelado'
               AND ((data_hora IS NOT NULL AND DATE(data_hora) = ?) OR (data_hora IS NULL AND data LIKE CONCAT(?, '%')))"
        );
        $stmt->execute([$petshopId, $data, $data]);

        foreach ($stmt->fetchAll() as $outro) {
            $outroInicio = self::inicioEmMinutos($outro['hora'], $outro['data']);
            if ($outroInicio === null) {
                continue;
            }
            $outroFim = $outroInicio + self::duracaoDoAgendamento($outro['servico'], $servicos);
            if ($inicio < $outroFim && $outroInicio < $fim) {
                return [409, 'horario_indisponivel', 'Esse horário não está disponível. Escolha outro horário.'];
            }
        }

        return null;
    }

    // Formata a linha do banco para a resposta.
    private static function transformar(array $linha): array
    {
        return [
            'id'        => (int)$linha['id'],
            'usuarioId' => (int)$linha['usuario_id'],
            'servico'   => $linha['servico'],
            'hora'      => $linha['hora'],
            'status'    => $linha['status'],
            'pet'       => $linha['pet'],
            'local'     => $linha['local'],
            'petshopId' => $linha['petshop_id'] !== null ? (int)$linha['petshop_id'] : null,
            'data'      => $linha['data'],
        ];
    }

    // Lista os agendamentos do usuário.
    public static function listar(int $usuarioId): void
    {
        $stmt = Database::get()->prepare('SELECT * FROM agendamentos WHERE usuario_id = ? ORDER BY id');
        $stmt->execute([$usuarioId]);
        Response::json(array_map([self::class, 'transformar'], $stmt->fetchAll()), 200);
    }

    // Cria um agendamento, validando o horário quando há petshopId.
    public static function criar(int $usuarioId, array $corpo): void
    {
        if (!Usuarios::existe($usuarioId)) {
            Response::erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
        }

        $status = $corpo['status'] ?? 'Pendente';
        if (!in_array($status, self::STATUS_VALIDOS, true)) {
            Response::erro(400, 'status_invalido', 'status deve ser Confirmado, Pendente ou Concluído.');
        }

        $pdo = Database::get();
        $petshopId = isset($corpo['petshopId']) ? (int)$corpo['petshopId'] : null;

        // Transação + FOR UPDATE evitam dois agendamentos simultâneos no mesmo horário.
        $pdo->beginTransaction();
        try {
            if ($petshopId !== null) {
                $pdo->prepare('SELECT id FROM petshops WHERE id = ? FOR UPDATE')->execute([$petshopId]);
                $erro = self::validarHorario($pdo, $petshopId, $corpo);
                if ($erro !== null) {
                    $pdo->rollBack();
                    Response::erro($erro[0], $erro[1], $erro[2]);
                }
            }

            $stmt = $pdo->prepare(
                'INSERT INTO agendamentos (usuario_id, servico, hora, status, pet, local, petshop_id, data) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $usuarioId,
                $corpo['servico'] ?? null,
                $corpo['hora'] ?? null,
                $status,
                $corpo['pet'] ?? null,
                $corpo['local'] ?? null,
                $petshopId,
                $corpo['data'] ?? null,
            ]);
            $id = (int)$pdo->lastInsertId();
            $pdo->commit();
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }

        $stmt = $pdo->prepare('SELECT * FROM agendamentos WHERE id = ?');
        $stmt->execute([$id]);
        Response::json(self::transformar($stmt->fetch()), 201);
    }
}
