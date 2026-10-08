const pool = require("./database");
const admin = require("./admin");

// Mesma lógica de preenchimento de meses usada em admin.js — mantida
// duplicada aqui de propósito: são só ~15 linhas e os dois módulos têm
// escopos de dados diferentes (todos os petshops vs. um petshop só).
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
         WHERE criado_em IS NOT NULL AND petshop_id = ?
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
         WHERE petshop_id = ? AND YEAR(criado_em) = YEAR(CURDATE()) AND MONTH(criado_em) = MONTH(CURDATE())`,
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

async function listarCategorias(tipo) {
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

        const [resultado] = await conn.query(
            "INSERT INTO produtos (nome, descricao, categoria_id, preco, estoque, ativo, petshop_id) VALUES (?, ?, ?, ?, ?, 1, ?)",
            [dados.nome, dados.descricao || null, dados.categoriaId || null, preco, Number(dados.estoque) || 0, petshopId]
        );

        // Toda oferta pertence a um produto de um petshop específico — é essa
        // linha que o app do consumidor (via API PHP) enxerga no catálogo,
        // não a tabela `produtos` diretamente.
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

        await conn.query(
            "UPDATE produtos SET nome = ?, descricao = ?, categoria_id = ?, preco = ? WHERE id = ? AND petshop_id = ?",
            [dados.nome, dados.descricao || null, dados.categoriaId || null, preco, id, petshopId]
        );

        // Só atualiza o preço da oferta se ela já existir (produto desativado
        // não tem oferta — ver desativarProduto — e não deve ganhar uma aqui).
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

        // Recria a oferta a partir do produto atual (nome/preço já corretos
        // por causa do UPDATE acima) — NOT EXISTS evita duplicar se por
        // algum motivo a oferta já estava lá.
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

        // Produto desativado some do catálogo do app do consumidor.
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

// Categorias fixas oferecidas no cadastro/filtro — duplicado de propósito
// em servicos.js (renderer), já que main e renderer não compartilham módulo.
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
                u.nome AS cliente_nome, u.telefone AS cliente_telefone
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
    if (Number(etapa) === 4) {
        await pool.query(
            "UPDATE pedidos SET etapa = ?, motivo_cancelamento = ?, cancelado_em = NOW() WHERE id = ? AND petshop_id = ?",
            [etapa, motivo, id, petshopId]
        );
        return;
    }
    await pool.query("UPDATE pedidos SET etapa = ? WHERE id = ? AND petshop_id = ?", [etapa, id, petshopId]);
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

// Exceção pontual: o modal de detalhes do pedido (tela de Pedidos do
// petshop) precisa do endereço de entrega do cliente, e não existe hoje
// nenhuma query genérica pra isso. Não filtra por petshop_id porque o
// dado pertence ao usuário/cliente, não ao petshop — só lê, nunca grava.
async function obterEnderecoPrincipalUsuario(usuarioId) {
    const [enderecos] = await pool.query(
        `SELECT cep, rua, numero, bairro, cidade, estado
         FROM enderecos_usuarios
         WHERE usuario_id = ?
         ORDER BY principal DESC, id ASC
         LIMIT 1`,
        [usuarioId]
    );
    return enderecos[0] || null;
}

// Reaproveita as queries já existentes em admin.js — não são lógica
// "exclusiva de admin", são só operações genéricas sobre um petshop. Aqui
// o `petshopId` sempre vem da própria sessão logada, então não existe
// risco de um petshop editar o perfil de outro através dessa função.
async function obterPerfil(petshopId) {
    return admin.obterPetshopDetalhes(petshopId);
}

async function salvarPerfil(petshopId, dados) {
    await admin.salvarPetshop(petshopId, dados);
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
    salvarPerfil,
    obterEnderecoPrincipalUsuario
};
