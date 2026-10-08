import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus, ETAPA_LABELS } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";
import { paginar, renderizarControlesPaginacao, ligarControlesPaginacao } from "../shared/paginacao.js";

const ITENS_POR_PAGINA = 10;

let filtroStatus = "todos";
let filtroBusca = "";
let listaAtual = [];
let paginaAtual = 1;

function formatarMoeda(valor) {
    return `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Prioriza `criado_em` (DATETIME real) — o campo `data` é texto livre vindo
// de fora (já vimos valores como "Teste" ou "Hoje, 14:59") e não pode virar
// exibição padrão da tabela.
function formatarDataHoraPedido(p) {
    const tentativas = [p.criado_em, p.data];
    for (const valor of tentativas) {
        if (!valor) continue;
        const d = new Date(valor);
        if (!Number.isNaN(d.getTime())) {
            const data = d.toLocaleDateString("pt-BR");
            const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
            return `${data} ${hora}`;
        }
    }
    return "—";
}

function estabelecimentoHtml(p) {
    const nome = p.petshop_nome || p.loja;
    return nome ? nome : `<span class="texto-nao-vinculado">Não vinculado</span>`;
}

export async function montarPaginaPedidosAdmin(container) {
    container.innerHTML = `
        <div id="painel-lateral-pedido-admin" class="painel-lateral">
            <button id="btnFecharPainelPedidoAdmin">✕ Fechar</button>
            <div id="conteudo-lateral-pedido-admin"></div>
        </div>

        <div class="painel">
            <div class="topo-tabela-container">
                <input type="text" id="buscaPedidoAdmin" class="input-busca-moderno" placeholder="Buscar por cliente ou nº do pedido..." value="${filtroBusca}">
                <select id="filtroStatusPedidoAdmin" class="select-filtro">
                    <option value="todos" ${filtroStatus === "todos" ? "selected" : ""}>Todos os Status</option>
                    ${ETAPA_LABELS.map((label, etapa) => `<option value="${etapa}" ${filtroStatus === String(etapa) ? "selected" : ""}>${label}</option>`).join("")}
                </select>
            </div>
            <table class="tabela-sem-quebra tabela-pedidos-admin">
                <thead>
                    <tr>
                        <th>N° Pedido</th>
                        <th>Cliente</th>
                        <th>Estabelecimento</th>
                        <th>Total</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabela-pedidos-admin-corpo"></tbody>
            </table>
            <div id="paginacao-pedidos-admin"></div>
        </div>
    `;

    document.getElementById("btnFecharPainelPedidoAdmin").addEventListener("click", fecharPainel);

    const selectStatus = document.getElementById("filtroStatusPedidoAdmin");
    selectStatus.addEventListener("change", () => {
        filtroStatus = selectStatus.value;
        paginaAtual = 1;
        carregarLista();
    });

    const inputBusca = document.getElementById("buscaPedidoAdmin");
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        paginaAtual = 1;
        renderizarTabela();
    });

    await carregarLista();
}

async function carregarLista() {
    const tbody = document.getElementById("tabela-pedidos-admin-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;

    try {
        listaAtual = await window.api.listarPedidos({ status: filtroStatus });
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;">Erro ao carregar pedidos do banco.</td></tr>`;
    }
}

function aplicarFiltroBusca(lista) {
    const termo = filtroBusca.trim().toLowerCase();
    if (!termo) return lista;

    const termoNumerico = termo.replace("#", "");
    return lista.filter((p) => {
        const cliente = (p.cliente_nome || "").toLowerCase();
        const numeroFormatado = `#${String(p.id).padStart(4, "0")}`.toLowerCase();
        return cliente.includes(termo) || numeroFormatado.includes(termo) || String(p.id).includes(termoNumerico);
    });
}

function renderizarTabela() {
    const tbody = document.getElementById("tabela-pedidos-admin-corpo");
    const areaPaginacao = document.getElementById("paginacao-pedidos-admin");
    if (!tbody) return;

    const filtrada = aplicarFiltroBusca(listaAtual);

    if (filtrada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum pedido encontrado.</td></tr>`;
        areaPaginacao.innerHTML = "";
        return;
    }

    const { itens, totalPaginas, totalItens } = paginar(filtrada, paginaAtual, ITENS_POR_PAGINA);

    tbody.innerHTML = itens.map((p) => `
        <tr>
            <td>#${String(p.id).padStart(4, "0")}</td>
            <td class="celula-truncar" title="${p.cliente_nome || "Cliente removido"}"><strong>${p.cliente_nome || "Cliente removido"}</strong></td>
            <td class="celula-truncar" title="${p.petshop_nome || p.loja || "Não vinculado"}">${estabelecimentoHtml(p)}</td>
            <td class="celula-preco">${formatarMoeda(p.total)}</td>
            <td class="celula-data">${formatarDataHoraPedido(p)}</td>
            <td>${criarBadgeStatus(ETAPA_LABELS[p.etapa] || "Confirmado")}</td>
            <td><button class="btn-secundario btn-acao-tabela" data-id="${p.id}">Gerenciar</button></td>
        </tr>
    `).join("");

    tbody.querySelectorAll("button[data-id]").forEach((botao) => {
        botao.addEventListener("click", () => abrirGerenciamento(Number(botao.dataset.id)));
    });

    areaPaginacao.innerHTML = renderizarControlesPaginacao(paginaAtual, totalPaginas, totalItens);
    ligarControlesPaginacao(areaPaginacao, (novaPagina) => {
        paginaAtual = novaPagina;
        renderizarTabela();
    });
}

function fecharPainel() {
    const lateral = document.getElementById("painel-lateral-pedido-admin");
    if (lateral) lateral.classList.remove("ativo");
}

async function abrirGerenciamento(id) {
    const pedido = listaAtual.find((p) => p.id === id);
    if (!pedido) return;

    const lateral = document.getElementById("painel-lateral-pedido-admin");
    const conteudo = document.getElementById("conteudo-lateral-pedido-admin");
    conteudo.innerHTML = "<p>Carregando itens...</p>";
    lateral.classList.add("ativo");

    let itens = [];
    try {
        itens = await window.api.obterItensPedido(id);
    } catch (erro) {
        console.error("Erro ao carregar itens do pedido:", erro);
    }

    const itensHtml = itens.length === 0
        ? "<p>Nenhum item registrado para este pedido.</p>"
        : itens.map((i) => `<p>${i.quantidade}x <strong>${i.nome}</strong> — ${formatarMoeda(i.preco_unitario)} cada</p>`).join("");

    conteudo.innerHTML = `
        <div class="header-lateral-detalhes"><h2>Pedido #${String(pedido.id).padStart(4, "0")}</h2></div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">👤 Cliente</h3>
            <p><strong>Nome:</strong> ${pedido.cliente_nome || "Cliente removido"}</p>
            <p><strong>Telefone:</strong> ${pedido.cliente_telefone || "Não informado"}</p>
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">🏬 Estabelecimento</h3>
            <p>${estabelecimentoHtml(pedido)}</p>
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">📦 Itens</h3>
            ${itensHtml}
            <p style="margin-top:10px;"><strong>Total:</strong> ${formatarMoeda(pedido.total)}</p>
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">⚙️ Status do Pedido</h3>
            <div class="grupo-formulario">
                <label>Novo status:</label>
                <select id="pedidoAdminNovoStatus" class="input-formulario select-formulario-edicao">
                    ${ETAPA_LABELS.map((label, etapa) => `<option value="${etapa}" ${pedido.etapa === etapa ? "selected" : ""}>${label}</option>`).join("")}
                </select>
            </div>
            <button id="btnAtualizarStatusPedido" class="btn-aprovar btn-salvar-lateral">Atualizar Pedido</button>
        </div>
    `;

    document.getElementById("btnAtualizarStatusPedido").addEventListener("click", () => atualizarStatus(id));
}

async function atualizarStatus(id) {
    const novaEtapa = Number(document.getElementById("pedidoAdminNovoStatus").value);

    const confirmado = await confirmarAcao({
        titulo: "Atualizar status do pedido",
        mensagem: `Confirma a mudança de status para "${ETAPA_LABELS[novaEtapa]}"?`,
        textoConfirmar: "Atualizar"
    });
    if (!confirmado) return;

    try {
        const resultado = await window.api.atualizarStatusPedido(id, novaEtapa);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(`Pedido #${String(id).padStart(4, "0")} atualizado para ${ETAPA_LABELS[novaEtapa]}!`);
        fecharPainel();
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao atualizar status do pedido:", erro);
        mostrarNotificacao("Erro ao atualizar status do pedido.", false);
    }
}
