const pool = require("./database");

const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function statusPetshopWhere(status) {
    if (status === "pendente") return "p.aprovado = 0 AND p.bloqueado = 0";
    if (status === "aprovado") return "p.aprovado = 1 AND p.bloqueado = 0";
    if (status === "bloqueado") return "p.bloqueado = 1";
    return null;
}

async function listarPetshops({ busca = "", status = "todos" } = {}) {
    const condicoes = [];
    const params = [];

    if (busca) {
        condicoes.push("(p.nome LIKE ? OR p.cnpj LIKE ?)");
        params.push(`%${busca}%`, `%${busca}%`);
    }

    const condicaoStatus = statusPetshopWhere(status);
    if (condicaoStatus) condicoes.push(condicaoStatus);

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const [linhas] = await pool.query(
        `SELECT p.id, p.nome, p.email, p.telefone, p.cnpj, p.tipo, p.descricao, p.logo,
                p.aprovado, p.bloqueado, p.criado_em,
                e.cep, e.rua, e.numero, e.bairro, e.cidade, e.estado
         FROM petshops p
         LEFT JOIN enderecos_petshops e ON e.petshop_id = p.id
         ${where}
         ORDER BY p.criado_em DESC`,
        params
    );

    return linhas;
}

async function obterPetshopDetalhes(id) {
    const [petshops] = await pool.query(
        `SELECT p.id, p.nome, p.email, p.telefone, p.cnpj, p.tipo, p.descricao, p.logo,
                p.aprovado, p.bloqueado, p.criado_em,
                e.cep, e.rua, e.numero, e.bairro, e.cidade, e.estado
         FROM petshops p
         LEFT JOIN enderecos_petshops e ON e.petshop_id = p.id
         WHERE p.id = ?
         LIMIT 1`,
        [id]
    );

    if (petshops.length === 0) return null;
    const petshop = petshops[0];

    const [horarios] = await pool.query(
        "SELECT dia_semana, hora_abertura, hora_fechamento, fechado FROM horarios_funcionamento WHERE petshop_id = ? ORDER BY dia_semana",
        [id]
    );

    const [avaliacoes] = await pool.query(
        `SELECT a.nota, a.comentario, a.criado_em, u.nome AS usuario_nome
         FROM avaliacoes a
         LEFT JOIN usuarios u ON u.id = a.usuario_id
         WHERE a.petshop_id = ?
         ORDER BY a.criado_em DESC
         LIMIT 10`,
        [id]
    );

    const [[resumoAvaliacoes]] = await pool.query(
        "SELECT COUNT(*) AS quantidade, COALESCE(AVG(nota), 0) AS media FROM avaliacoes WHERE petshop_id = ?",
        [id]
    );

    return {
        ...petshop,
        horarios: horarios.map((h) => ({ ...h, dia_nome: DIAS_SEMANA[h.dia_semana] || `Dia ${h.dia_semana}` })),
        avaliacoes,
        mediaAvaliacoes: Number(resumoAvaliacoes.media),
        quantidadeAvaliacoes: resumoAvaliacoes.quantidade
    };
}

async function aprovarPetshop(id) {
    await pool.query("UPDATE petshops SET aprovado = 1 WHERE id = ?", [id]);
}

async function bloquearPetshop(id) {
    await pool.query("UPDATE petshops SET bloqueado = 1 WHERE id = ?", [id]);
}

async function desbloquearPetshop(id) {
    await pool.query("UPDATE petshops SET bloqueado = 0 WHERE id = ?", [id]);
}

async function salvarPetshop(id, dados) {
    await pool.query(
        "UPDATE petshops SET nome = ?, telefone = ?, tipo = ?, descricao = ? WHERE id = ?",
        [dados.nome, dados.telefone, dados.tipo, dados.descricao || null, id]
    );

    const endereco = dados.endereco || {};
    const [existentes] = await pool.query(
        "SELECT id FROM enderecos_petshops WHERE petshop_id = ? LIMIT 1",
        [id]
    );

    if (existentes.length > 0) {
        await pool.query(
            "UPDATE enderecos_petshops SET cep = ?, rua = ?, numero = ?, bairro = ?, cidade = ?, estado = ? WHERE petshop_id = ?",
            [endereco.cep, endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado, id]
        );
    } else {
        await pool.query(
            "INSERT INTO enderecos_petshops (petshop_id, cep, rua, numero, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, endereco.cep, endereco.rua, endereco.numero, endereco.bairro, endereco.cidade, endereco.estado]
        );
    }
}

async function listarUsuarios({ busca = "" } = {}) {
    const condicoes = [];
    const params = [];

    if (busca) {
        condicoes.push("(u.nome LIKE ? OR u.email LIKE ? OR u.cpf LIKE ?)");
        params.push(`%${busca}%`, `%${busca}%`, `%${busca}%`);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    // Subconsultas (e não JOIN) para o total não ser multiplicado por pet.
    const [usuarios] = await pool.query(
        `SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.tipo_usuario, u.ativo,
                (SELECT COALESCE(SUM(pe.total), 0) FROM pedidos pe
                  WHERE pe.usuario_id = u.id AND pe.etapa <> 4) AS total_gasto,
                (SELECT COUNT(*) FROM pets pt WHERE pt.usuario_id = u.id) AS quantidade_pets
         FROM usuarios u
         ${where}
         ORDER BY u.nome ASC`,
        params
    );

    return usuarios;
}

async function obterPetsUsuario(usuarioId) {
    const [pets] = await pool.query(
        "SELECT id, nome, tipo, raca, idade, peso, sexo FROM pets WHERE usuario_id = ?",
        [usuarioId]
    );
    return pets;
}

async function ativarUsuario(id) {
    await pool.query("UPDATE usuarios SET ativo = 1 WHERE id = ?", [id]);
}

async function desativarUsuario(id) {
    await pool.query("UPDATE usuarios SET ativo = 0 WHERE id = ?", [id]);
}

async function listarPedidos({ status = "todos" } = {}) {
    const condicoes = [];
    const params = [];

    if (status !== "todos") {
        condicoes.push("pe.etapa = ?");
        params.push(Number(status));
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const [pedidos] = await pool.query(
        `SELECT pe.id, pe.usuario_id, pe.loja, pe.total, pe.data, pe.etapa, pe.petshop_id, pe.criado_em,
                pe.motivo_cancelamento,
                u.nome AS cliente_nome, u.telefone AS cliente_telefone,
                pa.nome AS petshop_nome
         FROM pedidos pe
         LEFT JOIN usuarios u ON u.id = pe.usuario_id
         LEFT JOIN petshops pa ON pa.id = pe.petshop_id
         ${where}
         ORDER BY pe.id DESC`,
        params
    );

    return pedidos;
}

async function obterItensPedido(pedidoId) {
    const [itens] = await pool.query(
        "SELECT nome, quantidade, preco_unitario FROM pedido_itens WHERE pedido_id = ?",
        [pedidoId]
    );
    return itens;
}

// Devolve ao estoque os itens de um pedido cancelado (na transação de quem chamou).
async function devolverEstoquePedido(conn, pedidoId) {
    const [itens] = await conn.query(
        "SELECT produto_id, quantidade FROM pedido_itens WHERE pedido_id = ? AND produto_id IS NOT NULL",
        [pedidoId]
    );

    for (const item of itens) {
        await conn.query(
            "UPDATE produtos SET estoque = estoque + ? WHERE id = ?",
            [item.quantidade, item.produto_id]
        );
    }
}

async function atualizarStatusPedido(id, etapa, motivo = null) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // FOR UPDATE evita devolver o estoque duas vezes.
        const [[pedido]] = await conn.query("SELECT etapa FROM pedidos WHERE id = ? FOR UPDATE", [id]);

        if (pedido && Number(pedido.etapa) === 4 && Number(etapa) !== 4) {
            throw new Error("Pedido cancelado não pode mudar de status.");
        }

        if (pedido && Number(pedido.etapa) === 3 && Number(etapa) !== 3) {
            throw new Error("Pedido entregue não pode mudar de status.");
        }

        await conn.query("UPDATE pedidos SET etapa = ? WHERE id = ?", [etapa, id]);

        if (pedido && Number(etapa) === 4 && Number(pedido.etapa) !== 4) {
            await conn.query(
                "UPDATE pedidos SET cancelado_em = NOW(), motivo_cancelamento = ? WHERE id = ?",
                [motivo, id]
            );
            await devolverEstoquePedido(conn, id);
        }

        await conn.commit();
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally {
        conn.release();
    }
}

async function listarAgendamentos({ status = "todos", data = "" } = {}) {
    const condicoes = [];
    const params = [];

    if (status !== "todos") {
        condicoes.push("ag.status = ?");
        params.push(status);
    }

    if (data) {
        condicoes.push(
            "((ag.data_hora IS NOT NULL AND DATE(ag.data_hora) = ?) OR (ag.data_hora IS NULL AND ag.data LIKE CONCAT(?, '%')))"
        );
        params.push(data, data);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const [linhas] = await pool.query(
        `SELECT ag.id, ag.usuario_id, ag.servico, ag.hora, ag.status, ag.pet, ag.local,
                ag.data, ag.data_hora, ag.petshop_id,
                u.nome AS tutor_nome, u.telefone AS tutor_telefone,
                pa.nome AS petshop_nome
         FROM agendamentos ag
         LEFT JOIN usuarios u ON u.id = ag.usuario_id
         LEFT JOIN petshops pa ON pa.id = ag.petshop_id
         ${where}
         ORDER BY ag.id DESC`,
        params
    );

    return linhas;
}

async function atualizarStatusAgendamento(id, status) {
    await pool.query("UPDATE agendamentos SET status = ? WHERE id = ?", [status, id]);
}

// Preenche com 0 os meses sem pedido, para o gráfico ficar completo.
function preencherUltimosMeses(linhas, quantidade) {
    const mapa = new Map(linhas.map((l) => [l.mes, Number(l.total)]));
    const resultado = [];
    const hoje = new Date();

    for (let i = quantidade - 1; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
        resultado.push({
            mes: chave,
            label: data.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
            total: mapa.get(chave) || 0
        });
    }

    return resultado;
}

async function receitaPorMes({ petshopId = null, meses = 6 } = {}) {
    const condicaoPetshop = petshopId ? "AND petshop_id = ?" : "";
    const params = petshopId ? [petshopId] : [];

    const [linhas] = await pool.query(
        `SELECT DATE_FORMAT(criado_em, '%Y-%m') AS mes, SUM(total) AS total
         FROM pedidos
         WHERE criado_em IS NOT NULL AND etapa <> 4 ${condicaoPetshop}
         GROUP BY mes`,
        params
    );

    return preencherUltimosMeses(linhas, meses);
}

async function obterDashboardAdmin() {
    const [[pendentes]] = await pool.query(
        "SELECT COUNT(*) AS total FROM petshops WHERE aprovado = 0 AND bloqueado = 0"
    );
    const [[pedidosHoje]] = await pool.query(
        "SELECT COUNT(*) AS total FROM pedidos WHERE DATE(criado_em) = CURDATE()"
    );
    const [[receitaMes]] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM pedidos
         WHERE YEAR(criado_em) = YEAR(CURDATE()) AND MONTH(criado_em) = MONTH(CURDATE()) AND etapa <> 4`
    );
    const [[usuariosAtivos]] = await pool.query(
        "SELECT COUNT(*) AS total FROM usuarios WHERE ativo = 1"
    );
    const [[pedidosCanceladosHoje]] = await pool.query(
        "SELECT COUNT(*) AS total FROM pedidos WHERE etapa = 4 AND DATE(cancelado_em) = CURDATE()"
    );
    const [[agendamentosPendentes]] = await pool.query(
        "SELECT COUNT(*) AS total FROM agendamentos WHERE status = 'Pendente'"
    );

    const alertas = [];
    if (pendentes.total > 0) alertas.push(`${pendentes.total} petshop(s) aguardando aprovação`);
    if (pedidosCanceladosHoje.total > 0) alertas.push(`${pedidosCanceladosHoje.total} pedido(s) cancelado(s) hoje`);
    if (agendamentosPendentes.total > 0) alertas.push(`${agendamentosPendentes.total} agendamento(s) pendente(s) de confirmação`);
    if (alertas.length === 0) alertas.push("Nenhum alerta no momento.");

    return {
        petshopsPendentes: pendentes.total,
        pedidosHoje: pedidosHoje.total,
        receitaMes: Number(receitaMes.total),
        usuariosAtivos: usuariosAtivos.total,
        alertas,
        graficoReceitaMensal: await receitaPorMes({})
    };
}

function condicoesPeriodo({ dataInicio, dataFim } = {}, prefixo = "") {
    const coluna = `${prefixo}criado_em`;
    const condicoes = [`${coluna} IS NOT NULL`];
    const params = [];

    if (dataInicio) {
        condicoes.push(`DATE(${coluna}) >= ?`);
        params.push(dataInicio);
    }
    if (dataFim) {
        condicoes.push(`DATE(${coluna}) <= ?`);
        params.push(dataFim);
    }

    return { where: `WHERE ${condicoes.join(" AND ")}`, params };
}

async function obterFaturamentoPeriodo(periodo) {
    const { where, params } = condicoesPeriodo(periodo);
    const [[linha]] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS quantidade FROM pedidos ${where} AND etapa <> 4`,
        params
    );
    return { total: Number(linha.total), quantidade: linha.quantidade };
}

async function obterPedidosPorStatus(periodo) {
    const { where, params } = condicoesPeriodo(periodo);
    const [linhas] = await pool.query(
        `SELECT etapa, COUNT(*) AS quantidade, COALESCE(SUM(total), 0) AS total
         FROM pedidos
         ${where}
         GROUP BY etapa
         ORDER BY etapa`,
        params
    );
    return linhas.map((l) => ({ etapa: l.etapa, quantidade: l.quantidade, total: Number(l.total) }));
}

// Ranking do relatório: produtos mais vendidos e serviços mais agendados.
async function obterRankingServicos({ limite = 10, dataInicio, dataFim } = {}) {
    const { where, params } = condicoesPeriodo({ dataInicio, dataFim }, "pe.");

    const [produtos] = await pool.query(
        `SELECT MAX(pi.nome) AS nome, MAX(ps.nome) AS petshop_nome,
                SUM(pi.quantidade) AS quantidade_vendida, SUM(pi.quantidade * pi.preco_unitario) AS receita
         FROM pedido_itens pi
         JOIN pedidos pe ON pe.id = pi.pedido_id
         LEFT JOIN petshops ps ON ps.id = pe.petshop_id
         ${where} AND pe.etapa <> 4
         GROUP BY pi.produto_id,
                  CASE WHEN pi.produto_id IS NULL THEN pi.nome END,
                  CASE WHEN pi.produto_id IS NULL THEN pe.petshop_id END
         ORDER BY receita DESC
         LIMIT ?`,
        [...params, limite]
    );

    const dataAgendamento = "COALESCE(DATE(data_hora), LEFT(data, 10))";
    const condicoesAgendamento = ["status <> 'Cancelado'"];
    const paramsAgendamento = [];
    if (dataInicio) {
        condicoesAgendamento.push(`${dataAgendamento} >= ?`);
        paramsAgendamento.push(dataInicio);
    }
    if (dataFim) {
        condicoesAgendamento.push(`${dataAgendamento} <= ?`);
        paramsAgendamento.push(dataFim);
    }

    const [agendamentos] = await pool.query(
        `SELECT servico FROM agendamentos WHERE ${condicoesAgendamento.join(" AND ")}`,
        paramsAgendamento
    );

    const contagem = new Map();
    agendamentos.forEach((ag) => {
        (ag.servico || "").split(",").map((s) => s.trim()).filter(Boolean).forEach((nome) => {
            contagem.set(nome, (contagem.get(nome) || 0) + 1);
        });
    });

    return {
        produtosMaisVendidos: produtos.map((p) => ({
            nome: p.nome,
            petshop: p.petshop_nome,
            quantidade: p.quantidade_vendida,
            receita: Number(p.receita)
        })),
        servicosMaisAgendados: [...contagem.entries()]
            .map(([nome, quantidade]) => ({ nome, quantidade }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, limite)
    };
}

async function obterRelatorioVendas(periodo) {
    return {
        faturamento: await obterFaturamentoPeriodo(periodo),
        pedidosPorStatus: await obterPedidosPorStatus(periodo),
        ranking: await obterRankingServicos(periodo)
    };
}

module.exports = {
    DIAS_SEMANA,
    listarPetshops,
    obterPetshopDetalhes,
    aprovarPetshop,
    bloquearPetshop,
    desbloquearPetshop,
    salvarPetshop,
    listarUsuarios,
    obterPetsUsuario,
    ativarUsuario,
    desativarUsuario,
    listarPedidos,
    obterItensPedido,
    devolverEstoquePedido,
    atualizarStatusPedido,
    listarAgendamentos,
    atualizarStatusAgendamento,
    obterDashboardAdmin,
    obterRelatorioVendas
};
