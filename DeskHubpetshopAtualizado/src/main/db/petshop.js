const pool = require("./database");
const admin = require("./admin");

// Preenche com 0 os meses sem pedido (mesma lógica de admin.js).
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

async function receitaPorMes(petshopId, meses = 6) {
    const [linhas] = await pool.query(
        `SELECT DATE_FORMAT(criado_em, '%Y-%m') AS mes, SUM(total) AS total
         FROM pedidos
         WHERE criado_em IS NOT NULL AND petshop_id = ? AND etapa <> 4
         GROUP BY mes`,
        [petshopId]
    );

    return preencherUltimosMeses(linhas, meses);
}

async function obterDashboardPetshop(petshopId) {
    const [[produtosAtivos]] = await pool.query(
        "SELECT COUNT(*) AS total FROM produtos WHERE petshop_id = ? AND ativo = 1",
        [petshopId]
    );
    const [[estoqueBaixo]] = await pool.query(
        "SELECT COUNT(*) AS total FROM produtos WHERE petshop_id = ? AND ativo = 1 AND estoque < 5",
        [petshopId]
    );
    const [[pedidosHoje]] = await pool.query(
        "SELECT COUNT(*) AS total FROM pedidos WHERE petshop_id = ? AND DATE(criado_em) = CURDATE()",
        [petshopId]
    );
    const [[agendamentosHoje]] = await pool.query(
        `SELECT COUNT(*) AS total FROM agendamentos
         WHERE petshop_id = ?
           AND ((data_hora IS NOT NULL AND DATE(data_hora) = CURDATE())
             OR (data_hora IS NULL AND data LIKE CONCAT(CURDATE(), '%')))`,
        [petshopId]
    );
    const [[receitaMes]] = await pool.query(
        `SELECT COALESCE(SUM(total), 0) AS total FROM pedidos
         WHERE petshop_id = ? AND YEAR(criado_em) = YEAR(CURDATE()) AND MONTH(criado_em) = MONTH(CURDATE()) AND etapa <> 4`,
        [petshopId]
    );

    return {
        produtosAtivos: produtosAtivos.total,
        estoqueBaixo: estoqueBaixo.total,
        pedidosHoje: pedidosHoje.total,
        agendamentosHoje: agendamentosHoje.total,
        receitaMes: Number(receitaMes.total),
        graficoReceitaMensal: await receitaPorMes(petshopId)
    };
}

// Categorias que o app aceita (ENUM produtos.categoria).
const CATEGORIA_APP_POR_NOME = {
    "Rações": "racoes",
    "Petiscos": "petiscos",
    "Higiene e Limpeza": "higiene",
    "Brinquedos": "brinquedos"
};

// Converte categoria_id (desktop) no valor de produtos.categoria (app).
async function categoriaDoApp(conn, categoriaId) {
    if (!categoriaId) return null;
    const [[categoria]] = await conn.query("SELECT nome FROM categorias WHERE id = ?", [categoriaId]);
    return (categoria && CATEGORIA_APP_POR_NOME[categoria.nome]) || null;
}

async function listarCategorias(tipo) {
    if (tipo === "produto") {
        const [linhas] = await pool.query(
            "SELECT id, nome FROM categorias WHERE tipo = ? AND nome IN (?) ORDER BY nome ASC",
            [tipo, Object.keys(CATEGORIA_APP_POR_NOME)]
        );
        return linhas;
    }

    const [linhas] = await pool.query(
        "SELECT id, nome FROM categorias WHERE tipo = ? ORDER BY nome ASC",
        [tipo]
    );
    return linhas;
}

async function listarProdutos(petshopId, { busca = "" } = {}) {
    const condicoes = ["p.petshop_id = ?"];
    const params = [petshopId];

    if (busca) {
        condicoes.push("p.nome LIKE ?");
        params.push(`%${busca}%`);
    }

    const [produtos] = await pool.query(
        `SELECT p.id, p.nome, p.descricao, p.categoria_id, c.nome AS categoria_nome,
                p.preco, p.estoque, p.ativo
         FROM produtos p
         LEFT JOIN categorias c ON c.id = p.categoria_id
         WHERE ${condicoes.join(" AND ")}
         ORDER BY p.nome ASC`,
        params
    );

    return produtos;
}

async function cadastrarProduto(petshopId, dados) {
    const preco = Number(dados.preco) || 0;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const categoriaApp = await categoriaDoApp(conn, dados.categoriaId);
        const [resultado] = await conn.query(
            "INSERT INTO produtos (nome, descricao, categoria_id, categoria, preco, estoque, ativo, petshop_id) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
            [dados.nome, dados.descricao || null, dados.categoriaId || null, categoriaApp, preco, Number(dados.estoque) || 0, petshopId]
        );

        await conn.query(
            "INSERT INTO ofertas (produto_id, petshop_id, preco) VALUES (?, ?, ?)",
            [resultado.insertId, petshopId, preco]
        );

        await conn.commit();
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally {
        conn.release();
    }
}

async function editarProduto(id, petshopId, dados) {
    const preco = Number(dados.preco) || 0;
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const categoriaApp = await categoriaDoApp(conn, dados.categoriaId);
        await conn.query(
            "UPDATE produtos SET nome = ?, descricao = ?, categoria_id = ?, categoria = ?, preco = ? WHERE id = ? AND petshop_id = ?",
            [dados.nome, dados.descricao || null, dados.categoriaId || null, categoriaApp, preco, id, petshopId]
        );

        await conn.query(
            "UPDATE ofertas SET preco = ? WHERE produto_id = ? AND petshop_id = ?",
            [preco, id, petshopId]
        );

        await conn.commit();
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally {
        conn.release();
    }
}

async function ativarProduto(id, petshopId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query("UPDATE produtos SET ativo = 1 WHERE id = ? AND petshop_id = ?", [id, petshopId]);

        await conn.query(
            `INSERT INTO ofertas (produto_id, petshop_id, preco)
             SELECT p.id, p.petshop_id, p.preco FROM produtos p
             WHERE p.id = ? AND p.petshop_id = ?
               AND NOT EXISTS (SELECT 1 FROM ofertas o WHERE o.produto_id = p.id AND o.petshop_id = p.petshop_id)`,
            [id, petshopId]
        );

        await conn.commit();
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally {
        conn.release();
    }
}

async function desativarProduto(id, petshopId) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        await conn.query("UPDATE produtos SET ativo = 0 WHERE id = ? AND petshop_id = ?", [id, petshopId]);

        await conn.query("DELETE FROM ofertas WHERE produto_id = ? AND petshop_id = ?", [id, petshopId]);

        await conn.commit();
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally {
        conn.release();
    }
}

async function atualizarEstoqueProduto(id, petshopId, estoque) {
    await pool.query(
        "UPDATE produtos SET estoque = ? WHERE id = ? AND petshop_id = ?",
        [Number(estoque), id, petshopId]
    );
}

// Categorias fixas de serviço (também em servicos.js do renderer).
const CATEGORIAS_SERVICO_PRESET = ["Banho e Tosa", "Consulta Veterinária", "Hospedagem", "Passeio", "Adestramento"];

async function listarServicos(petshopId, { busca = "", categoria = "todos" } = {}) {
    const condicoes = ["petshop_id = ?"];
    const params = [petshopId];

    if (busca) {
        condicoes.push("nome LIKE ?");
        params.push(`%${busca}%`);
    }

    if (categoria && categoria !== "todos") {
        if (categoria === "Outro") {
            const placeholders = CATEGORIAS_SERVICO_PRESET.map(() => "?").join(", ");
            condicoes.push(`(categoria IS NULL OR categoria NOT IN (${placeholders}))`);
            params.push(...CATEGORIAS_SERVICO_PRESET);
        } else {
            condicoes.push("categoria = ?");
            params.push(categoria);
        }
    }

    const [servicos] = await pool.query(
        `SELECT id, nome, categoria, descricao, preco, duracao, ativo
         FROM servicos_petshop
         WHERE ${condicoes.join(" AND ")}
         ORDER BY nome ASC`,
        params
    );

    return servicos;
}

async function cadastrarServico(petshopId, dados) {
    await pool.query(
        "INSERT INTO servicos_petshop (petshop_id, nome, categoria, descricao, preco, duracao, ativo) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [petshopId, dados.nome, dados.categoria || null, dados.descricao || null, Number(dados.preco), dados.duracao || null, dados.ativo ? 1 : 0]
    );
}

async function editarServico(id, petshopId, dados) {
    await pool.query(
        "UPDATE servicos_petshop SET nome = ?, categoria = ?, descricao = ?, preco = ?, duracao = ?, ativo = ? WHERE id = ? AND petshop_id = ?",
        [dados.nome, dados.categoria || null, dados.descricao || null, Number(dados.preco), dados.duracao || null, dados.ativo ? 1 : 0, id, petshopId]
    );
}

async function ativarServico(id, petshopId) {
    await pool.query("UPDATE servicos_petshop SET ativo = 1 WHERE id = ? AND petshop_id = ?", [id, petshopId]);
}

async function desativarServico(id, petshopId) {
    await pool.query("UPDATE servicos_petshop SET ativo = 0 WHERE id = ? AND petshop_id = ?", [id, petshopId]);
}

async function listarPedidos(petshopId, { status = "todos" } = {}) {
    const condicoes = ["pe.petshop_id = ?"];
    const params = [petshopId];

    if (status !== "todos") {
        condicoes.push("pe.etapa = ?");
        params.push(Number(status));
    }

    const [pedidos] = await pool.query(
        `SELECT pe.id, pe.usuario_id, pe.loja, pe.total, pe.data, pe.etapa, pe.criado_em,
                pe.motivo_cancelamento, pe.cancelado_em,
                u.nome AS cliente_nome, u.telefone AS cliente_telefone,
                (SELECT COALESCE(SUM(pi.quantidade), 0) FROM pedido_itens pi WHERE pi.pedido_id = pe.id) AS quantidade_itens
         FROM pedidos pe
         LEFT JOIN usuarios u ON u.id = pe.usuario_id
         WHERE ${condicoes.join(" AND ")}
         ORDER BY pe.id DESC`,
        params
    );

    return pedidos;
}

async function obterItensPedido(pedidoId, petshopId) {
    const [[pedido]] = await pool.query(
        "SELECT id FROM pedidos WHERE id = ? AND petshop_id = ?",
        [pedidoId, petshopId]
    );
    if (!pedido) return [];

    const [itens] = await pool.query(
        "SELECT nome, quantidade, preco_unitario FROM pedido_itens WHERE pedido_id = ?",
        [pedidoId]
    );
    return itens;
}

async function atualizarStatusPedido(id, petshopId, etapa, motivo = null) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [[pedido]] = await conn.query(
            "SELECT etapa FROM pedidos WHERE id = ? AND petshop_id = ? FOR UPDATE",
            [id, petshopId]
        );

        if (pedido && Number(pedido.etapa) === 4 && Number(etapa) !== 4) {
            throw new Error("Pedido cancelado não pode mudar de status.");
        }

        if (pedido && Number(pedido.etapa) === 3 && Number(etapa) !== 3) {
            throw new Error("Pedido entregue não pode mudar de status.");
        }

        if (Number(etapa) === 4) {
            await conn.query(
                "UPDATE pedidos SET etapa = ?, motivo_cancelamento = ?, cancelado_em = NOW() WHERE id = ? AND petshop_id = ?",
                [etapa, motivo, id, petshopId]
            );

            if (pedido && Number(pedido.etapa) !== 4) {
                await admin.devolverEstoquePedido(conn, id);
            }
        } else {
            await conn.query("UPDATE pedidos SET etapa = ? WHERE id = ? AND petshop_id = ?", [etapa, id, petshopId]);
        }

        await conn.commit();
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally {
        conn.release();
    }
}

async function listarAgendamentos(petshopId, { status = "todos", data = "" } = {}) {
    const condicoes = ["ag.petshop_id = ?"];
    const params = [petshopId];

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

    const [linhas] = await pool.query(
        `SELECT ag.id, ag.usuario_id, ag.servico, ag.hora, ag.status, ag.pet, ag.local, ag.data, ag.data_hora,
                u.nome AS tutor_nome, u.telefone AS tutor_telefone
         FROM agendamentos ag
         LEFT JOIN usuarios u ON u.id = ag.usuario_id
         WHERE ${condicoes.join(" AND ")}
         ORDER BY ag.id DESC`,
        params
    );

    return linhas;
}

async function atualizarStatusAgendamento(id, petshopId, status) {
    await pool.query("UPDATE agendamentos SET status = ? WHERE id = ? AND petshop_id = ?", [status, id, petshopId]);
}

// Endereço de entrega do cliente (detalhes do pedido).
async function obterEnderecoPrincipalUsuario(usuarioId) {
    const [doApp] = await pool.query(
        `SELECT titulo, rua, numero, complemento, bairro, cidade, NULL AS estado, NULL AS cep
         FROM enderecos
         WHERE usuario_id = ?
         ORDER BY principal DESC, id ASC
         LIMIT 1`,
        [usuarioId]
    );
    if (doApp[0]) return doApp[0];

    const [reserva] = await pool.query(
        `SELECT apelido AS titulo, rua, numero, NULL AS complemento, bairro, cidade, estado, cep
         FROM enderecos_usuarios
         WHERE usuario_id = ?
         ORDER BY principal DESC, id ASC
         LIMIT 1`,
        [usuarioId]
    );
    return reserva[0] || null;
}

// Perfil do petshop: o petshopId vem sempre da sessão (index.js).
async function obterPerfil(petshopId) {
    const detalhes = await admin.obterPetshopDetalhes(petshopId);
    if (!detalhes) return null;
    return { ...detalhes, horarios: await obterHorariosFuncionamento(petshopId) };
}

// =========================
// Horário de funcionamento e agenda
// =========================

const HORA_VALIDA = /^([01]\d|2[0-3]):[0-5]\d$/;
const INTERVALO_AGENDA_MIN = 30;
const DURACAO_PADRAO_MIN = 30;

// Erro com mensagem que pode ser mostrada na tela.
function erroParaUsuario(mensagem) {
    const erro = new Error(mensagem);
    erro.mensagemParaUsuario = mensagem;
    return erro;
}

function horaCurta(valor) {
    return valor ? String(valor).slice(0, 5) : null;
}

// Horário padrão: segunda a sábado 08:00–18:00, domingo fechado.
function horarioPadrao(diaSemana) {
    const fechado = diaSemana === 0;
    return {
        dia_semana: diaSemana,
        hora_abertura: fechado ? null : "08:00",
        hora_fechamento: fechado ? null : "18:00",
        fechado
    };
}

async function obterHorariosFuncionamento(petshopId) {
    const [linhas] = await pool.query(
        "SELECT dia_semana, hora_abertura, hora_fechamento, fechado FROM horarios_funcionamento WHERE petshop_id = ?",
        [petshopId]
    );

    return [0, 1, 2, 3, 4, 5, 6].map((dia) => {
        const linha = linhas.find((l) => l.dia_semana === dia);
        if (!linha) return horarioPadrao(dia);
        return {
            dia_semana: dia,
            hora_abertura: horaCurta(linha.hora_abertura),
            hora_fechamento: horaCurta(linha.hora_fechamento),
            fechado: Boolean(linha.fechado)
        };
    });
}

// Grava os 7 dias do horário de funcionamento.
async function salvarHorariosFuncionamento(petshopId, horarios) {
    const dias = [0, 1, 2, 3, 4, 5, 6].map((dia) => (horarios || []).find((h) => Number(h.dia_semana) === dia));
    if (dias.some((h) => !h)) throw erroParaUsuario("Informe os 7 dias da semana.");

    dias.forEach((h) => {
        if (h.fechado) return;
        const nomeDia = admin.DIAS_SEMANA[h.dia_semana];
        if (!HORA_VALIDA.test(h.hora_abertura || "") || !HORA_VALIDA.test(h.hora_fechamento || "")) {
            throw erroParaUsuario(`Preencha a abertura e o fechamento de ${nomeDia}.`);
        }
        if (h.hora_abertura >= h.hora_fechamento) {
            throw erroParaUsuario(`${nomeDia}: a abertura precisa ser antes do fechamento.`);
        }
    });

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [existentes] = await conn.query(
            "SELECT id, dia_semana FROM horarios_funcionamento WHERE petshop_id = ? FOR UPDATE",
            [petshopId]
        );

        for (const h of dias) {
            const valores = [
                HORA_VALIDA.test(h.hora_abertura || "") ? h.hora_abertura : null,
                HORA_VALIDA.test(h.hora_fechamento || "") ? h.hora_fechamento : null,
                h.fechado ? 1 : 0
            ];
            const existente = existentes.find((e) => e.dia_semana === Number(h.dia_semana));

            if (existente) {
                await conn.query(
                    "UPDATE horarios_funcionamento SET hora_abertura = ?, hora_fechamento = ?, fechado = ? WHERE id = ?",
                    [...valores, existente.id]
                );
            } else {
                await conn.query(
                    "INSERT INTO horarios_funcionamento (hora_abertura, hora_fechamento, fechado, petshop_id, dia_semana) VALUES (?, ?, ?, ?, ?)",
                    [...valores, petshopId, Number(h.dia_semana)]
                );
            }
        }

        await conn.commit();
    } catch (erro) {
        await conn.rollback();
        throw erro;
    } finally {
        conn.release();
    }
}

async function salvarPerfil(petshopId, dados) {
    await admin.salvarPetshop(petshopId, dados);
}

// Converte a duração em texto ("1h30", "30min") em minutos.
function duracaoEmMinutos(texto) {
    const t = String(texto || "").toLowerCase().replace(/\s+/g, "");
    const comHoras = t.match(/^(\d+)h(\d+)?/);
    if (comHoras) return Number(comHoras[1]) * 60 + Number(comHoras[2] || 0);
    const soMinutos = t.match(/^(\d+)/);
    return soMinutos ? Number(soMinutos[1]) : null;
}

// Duração total do agendamento (30 min para serviço não encontrado).
function duracaoDoAgendamento(textoServico, servicos) {
    const nomes = String(textoServico || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (nomes.length === 0) return DURACAO_PADRAO_MIN;

    return nomes.reduce((total, nome) => {
        const servico = servicos.find((s) => s.nome.trim().toLowerCase() === nome);
        return total + (duracaoEmMinutos(servico?.duracao) || DURACAO_PADRAO_MIN);
    }, 0);
}

// Início do agendamento em minutos.
function inicioDoAgendamento(ag) {
    const texto = ag.hora || String(ag.data || "").split(/[T ]/)[1] || "";
    const encontrada = texto.match(/^(\d{1,2}):(\d{2})/);
    return encontrada ? Number(encontrada[1]) * 60 + Number(encontrada[2]) : null;
}

function seSobrepoem(a, b) {
    return a.inicio < b.fim && b.inicio < a.fim;
}

// Marca os agendamentos que se sobrepõem (conflito).
function marcarConflitos(agendamentos) {
    const ativos = agendamentos.filter((a) => a.status !== "Cancelado" && a.inicio !== null);
    for (let i = 0; i < ativos.length; i++) {
        for (let j = i + 1; j < ativos.length; j++) {
            if (seSobrepoem(ativos[i], ativos[j])) {
                ativos[i].conflito = true;
                ativos[j].conflito = true;
            }
        }
    }
}

// Dados da Agenda do dia: horário, agendamentos e serviços.
async function obterAgendaDoDia(petshopId, data) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(data))) throw erroParaUsuario("Data inválida.");

    const diaSemana = new Date(`${data}T12:00:00`).getDay();
    const [horarios, agendamentosDoDia, servicosDoPetshop] = await Promise.all([
        obterHorariosFuncionamento(petshopId),
        listarAgendamentos(petshopId, { data }),
        listarServicos(petshopId)
    ]);

    const servicos = servicosDoPetshop.map((s) => ({
        id: s.id,
        nome: s.nome,
        duracao: s.duracao,
        duracaoMinutos: duracaoEmMinutos(s.duracao) || DURACAO_PADRAO_MIN,
        ativo: Boolean(s.ativo)
    }));

    const agendamentos = agendamentosDoDia
        .map((ag) => {
            const inicio = inicioDoAgendamento(ag);
            const duracao = duracaoDoAgendamento(ag.servico, servicos);
            return { ...ag, inicio, duracao, fim: inicio === null ? null : inicio + duracao, conflito: false };
        })
        .sort((a, b) => (a.inicio ?? 9999) - (b.inicio ?? 9999));

    marcarConflitos(agendamentos);

    return { data, diaSemana, horario: horarios[diaSemana], intervaloMinutos: INTERVALO_AGENDA_MIN, agendamentos, servicos };
}

module.exports = {
    obterDashboardPetshop,
    listarCategorias,
    listarProdutos,
    cadastrarProduto,
    editarProduto,
    ativarProduto,
    desativarProduto,
    atualizarEstoqueProduto,
    listarServicos,
    cadastrarServico,
    editarServico,
    ativarServico,
    desativarServico,
    listarPedidos,
    obterItensPedido,
    atualizarStatusPedido,
    listarAgendamentos,
    atualizarStatusAgendamento,
    obterPerfil,
    salvarHorariosFuncionamento,
    obterAgendaDoDia,
    salvarPerfil,
    obterEnderecoPrincipalUsuario
};
