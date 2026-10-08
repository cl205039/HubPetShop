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

    const [usuarios] = await pool.query(
        `SELECT u.id, u.nome, u.email, u.telefone, u.cpf, u.tipo_usuario, u.ativo,
                COALESCE(SUM(pe.total), 0) AS total_gasto,
                COUNT(DISTINCT pt.id) AS quantidade_pets
         FROM usuarios u
         LEFT JOIN pedidos pe ON pe.usuario_id = u.id
         LEFT JOIN pets pt ON pt.usuario_id = u.id
         ${where}
         GROUP BY u.id
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

async function atualizarStatusPedido(id, etapa) {
    await pool.query("UPDATE pedidos SET etapa = ? WHERE id = ?", [etapa, id]);
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

// Preenche os últimos N meses (incluindo o atual) com 0 quando não há
// pedido registrado naquele mês, para o gráfico sempre mostrar uma linha
// do tempo completa em vez de ficar vazio.
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
         WHERE criado_em IS NOT NULL ${condicaoPetshop}
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
         WHERE YEAR(criado_em) = YEAR(CURDATE()) AND MONTH(criado_em) = MONTH(CURDATE())`
    );
    const [[usuariosAtivos]] = await pool.query(
        "SELECT COUNT(*) AS total FROM usuarios WHERE ativo = 1"
    );
    const [[pedidosCanceladosHoje]] = await pool.query(
        "SELECT COUNT(*) AS total FROM pedidos WHERE etapa = 4 AND DATE(criado_em) = CURDATE()"
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

function condicoesPeriodo({ dataInicio, dataFim } = {}) {
    const condicoes = ["criado_em IS NOT NULL"];
    const params = [];

    if (dataInicio) {
        condicoes.push("DATE(criado_em) >= ?");
        params.push(dataInicio);
    }
    if (dataFim) {
        condicoes.push("DATE(criado_em) <= ?");
        params.push(dataFim);
    }

    return { where: `WHERE ${condicoes.join(" AND ")}`, params };
}

async function obterFaturamentoPeriodo(periodo) {
    const { where, params } = condicoesPeriodo(periodo);
    const [[linha]] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total, COUNT(*) AS quantidade FROM pedidos ${where}`,
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

// "Ranking de serviços" combina duas fontes bem diferentes por falta de um
// vínculo real no banco entre agendamentos e servicos_petshop: produtos
// vendidos de verdade (pedido_itens, com receita real) e o catálogo de
// serviços cadastrados pelos petshops (servicos_petshop, sem contagem de
// venda ainda — isso só existiria se agendamentos referenciasse
// servicos_petshop, o que não faz parte do schema atual).
async function obterRankingServicos({ limite = 10 } = {}) {
    const [produtos] = await pool.query(
        `SELECT nome, SUM(quantidade) AS quantidade_vendida, SUM(quantidade * preco_unitario) AS receita
         FROM pedido_itens
         GROUP BY nome
         ORDER BY receita DESC
         LIMIT ?`,
        [limite]
    );

    const [servicos] = await pool.query(
        `SELECT sp.nome, sp.preco, p.nome AS petshop_nome
         FROM servicos_petshop sp
         LEFT JOIN petshops p ON p.id = sp.petshop_id
         WHERE sp.ativo = 1
         ORDER BY sp.preco DESC
         LIMIT ?`,
        [limite]
    );

    return {
        produtosMaisVendidos: produtos.map((p) => ({
            nome: p.nome,
            quantidade: p.quantidade_vendida,
            receita: Number(p.receita)
        })),
        servicosCadastrados: servicos.map((s) => ({
            nome: s.nome,
            preco: Number(s.preco),
            petshop: s.petshop_nome
        }))
    };
}

async function obterRelatorioVendas(periodo) {
    return {
        faturamento: await obterFaturamentoPeriodo(periodo),
        pedidosPorStatus: await obterPedidosPorStatus(periodo),
        ranking: await obterRankingServicos({})
    };
}

module.exports = {
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
    atualizarStatusPedido,
    listarAgendamentos,
    atualizarStatusAgendamento,
    obterDashboardAdmin,
    obterRelatorioVendas
};
