import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus, ETAPA_LABELS, enderecoHtml, escaparHtml, formatarMoeda } from "../shared/ui.js";
import { confirmarAcao, solicitarMotivoCancelamento } from "../shared/confirmacao.js";

const LIMITE_HISTORICO = 10;
const INTERVALO_ATUALIZACAO_MS = 30 * 1000;
const DESTAQUE_PEDIDO_NOVO_MS = 8 * 1000;

let listaCompleta = [];
let filtroBusca = "";
let limiteEntregues = LIMITE_HISTORICO;
let limiteCancelados = LIMITE_HISTORICO;
let timerAtualizacao = null;
let idsEmAnalise = null;
const idsDestacados = new Set();

// Para a atualização automática.
export function pararAtualizacaoPedidosPetshop() {
    if (timerAtualizacao) {
        clearInterval(timerAtualizacao);
        timerAtualizacao = null;
    }
}

export async function montarPaginaPedidosPetshop(container) {
    pararAtualizacaoPedidosPetshop();
    idsEmAnalise = null;

    container.innerHTML = `
        <div id="painel-lateral-pedido" class="painel-lateral">
            <button id="btnFecharPainelPedido">✕ Fechar</button>
            <div id="conteudo-lateral-pedido"></div>
        </div>

        <div class="painel painel-topo-pedidos">
            <div class="topo-tabela-container" style="justify-content: space-between; align-items: center; margin-bottom: 0;">
                <input type="text" id="buscaPedidos" class="input-busca-compacta" placeholder="Buscar por cliente ou nº do pedido...">
                <span class="contador-pedidos-ativos" id="contadorPedidosAtivos">Carregando...</span>
            </div>
        </div>

        <div class="kanban-container">
            <div class="kanban-coluna">
                <div class="kanban-cabecalho kanban-cabecalho-roxo">
                    <h3>🐾 Em Análise</h3>
                    <div class="kanban-contador" id="contadorNovos">0 pedidos</div>
                </div>
                <div class="kanban-corpo" id="colunaNovos"><p class="kanban-vazio">Carregando...</p></div>
            </div>

            <div class="kanban-coluna">
                <div class="kanban-cabecalho kanban-cabecalho-laranja">
                    <h3>🦴 Em Preparo</h3>
                    <div class="kanban-contador" id="contadorPreparo">0 pedidos</div>
                </div>
                <div class="kanban-corpo" id="colunaEmPreparo"><p class="kanban-vazio">Carregando...</p></div>
            </div>

            <div class="kanban-coluna">
                <div class="kanban-cabecalho kanban-cabecalho-verde">
                    <h3>🚚 Saiu para Entrega</h3>
                    <div class="kanban-contador" id="contadorEntrega">0 pedidos</div>
                </div>
                <div class="kanban-corpo" id="colunaSaiuParaEntrega"><p class="kanban-vazio">Carregando...</p></div>
            </div>
        </div>

        <div class="painel" style="margin-top:20px;">
            <button id="btnToggleEntregues" class="btn-toggle-colapsavel">
                ✅ Entregues (<span id="contadorEntregues">0</span>) <span id="setaEntregues">▾</span>
            </button>
            <div id="listaEntregues" class="lista-historico" style="display:none;"></div>
        </div>

        <div class="painel" style="margin-top:20px;">
            <button id="btnToggleCancelados" class="btn-toggle-colapsavel">
                🗑️ Cancelados (<span id="contadorCancelados">0</span>) <span id="setaCancelados">▾</span>
            </button>
            <div id="listaCancelados" class="lista-historico" style="display:none;"></div>
        </div>
    `;

    document.getElementById("btnFecharPainelPedido").addEventListener("click", fecharPainelPedido);

    const inputBusca = document.getElementById("buscaPedidos");
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        limiteEntregues = LIMITE_HISTORICO;
        limiteCancelados = LIMITE_HISTORICO;
        renderizarTudo();
    });

    ligarSecaoRecolhivel("btnToggleEntregues", "listaEntregues", "setaEntregues");
    ligarSecaoRecolhivel("btnToggleCancelados", "listaCancelados", "setaCancelados");

    await carregarLista();
    timerAtualizacao = setInterval(carregarLista, INTERVALO_ATUALIZACAO_MS);
}

// Abre/fecha uma seção recolhível (Entregues, Cancelados) e vira a seta.
function ligarSecaoRecolhivel(idBotao, idLista, idSeta) {
    document.getElementById(idBotao).addEventListener("click", () => {
        const lista = document.getElementById(idLista);
        const seta = document.getElementById(idSeta);
        const aberto = lista.style.display !== "none";
        lista.style.display = aberto ? "none" : "block";
        seta.innerText = aberto ? "▾" : "▴";
    });
}

// Busca os pedidos e redesenha a tela.
async function carregarLista() {
    if (!document.getElementById("colunaNovos")) {
        pararAtualizacaoPedidosPetshop();
        return;
    }

    try {
        listaCompleta = await window.api.listarPedidosPetshop({ status: "todos" });
        avisarPedidosNovos();
        renderizarTudo();
    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
        ["colunaNovos", "colunaEmPreparo", "colunaSaiuParaEntrega"].forEach((id) => {
            const corpo = document.getElementById(id);
            if (corpo) corpo.innerHTML = `<p class="kanban-vazio" style="color:#e53935;">Erro ao carregar pedidos.</p>`;
        });
    }
}

// Destaca os pedidos novos em "Em Análise".
function avisarPedidosNovos() {
    const idsAgora = listaCompleta.filter((p) => p.etapa === 0).map((p) => p.id);

    if (idsEmAnalise) {
        const novos = idsAgora.filter((id) => !idsEmAnalise.has(id));
        if (novos.length > 0) {
            novos.forEach((id) => {
                idsDestacados.add(id);
                setTimeout(() => {
                    idsDestacados.delete(id);
                    document.querySelector(`[data-pedido-id="${id}"]`)?.classList.remove("kanban-card-novo");
                }, DESTAQUE_PEDIDO_NOVO_MS);
            });
            mostrarNotificacao("Novo pedido recebido!");
        }
    }

    idsEmAnalise = new Set(idsAgora);
}

// "há 5 min", "há 2 h", "há 3 dias" desde a chegada do pedido (criado_em).
function tempoDesde(valor) {
    if (!valor) return "";
    const minutos = Math.max(0, Math.floor((Date.now() - new Date(valor).getTime()) / 60000));
    if (minutos < 1) return "agora mesmo";
    if (minutos < 60) return `há ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `há ${horas} h`;
    const dias = Math.floor(horas / 24);
    return `há ${dias} dia${dias > 1 ? "s" : ""}`;
}

function aplicarFiltroBusca(lista) {
    const termo = filtroBusca.trim().toLowerCase();
    if (!termo) return lista;

    const termoNumerico = termo.replace("#", "");
    return lista.filter((p) => {
        const nome = (p.cliente_nome || "").toLowerCase();
        const numeroFormatado = `#${String(p.id).padStart(4, "0")}`.toLowerCase();
        return nome.includes(termo) || numeroFormatado.includes(termo) || String(p.id).includes(termoNumerico);
    });
}

function renderizarTudo() {
    const filtrada = aplicarFiltroBusca(listaCompleta);

    const novos = filtrada.filter((p) => p.etapa === 0);
    const emPreparo = filtrada.filter((p) => p.etapa === 1);
    const saiuParaEntrega = filtrada.filter((p) => p.etapa === 2);
    const entregues = filtrada.filter((p) => p.etapa === 3);
    const cancelados = filtrada
        .filter((p) => p.etapa === 4)
        .sort((a, b) => new Date(b.cancelado_em || b.criado_em) - new Date(a.cancelado_em || a.criado_em));

    const ativos = novos.length + emPreparo.length + saiuParaEntrega.length;
    document.getElementById("contadorPedidosAtivos").innerText =
        `${ativos} pedido(s) ativo(s) · ${entregues.length} entregues · ${cancelados.length} cancelados`;
    document.getElementById("contadorNovos").innerText = `${novos.length} pedido(s)`;
    document.getElementById("contadorPreparo").innerText = `${emPreparo.length} pedido(s)`;
    document.getElementById("contadorEntrega").innerText = `${saiuParaEntrega.length} pedido(s)`;
    document.getElementById("contadorEntregues").innerText = entregues.length;
    document.getElementById("contadorCancelados").innerText = cancelados.length;

    renderizarColuna("colunaNovos", novos, "novos");
    renderizarColuna("colunaEmPreparo", emPreparo, "preparo");
    renderizarColuna("colunaSaiuParaEntrega", saiuParaEntrega, "entrega");

    renderizarHistorico("listaEntregues", entregues, {
        limite: limiteEntregues,
        mensagemVazia: "Nenhum pedido entregue.",
        dataTexto: (p) => formatarData(p.criado_em),
        aoVerMais: () => {
            limiteEntregues += LIMITE_HISTORICO;
            renderizarTudo();
        }
    });
    renderizarHistorico("listaCancelados", cancelados, {
        limite: limiteCancelados,
        mensagemVazia: "Nenhum pedido cancelado.",
        dataTexto: (p) => p.cancelado_em
            ? `cancelado em ${formatarData(p.cancelado_em)}`
            : `${formatarData(p.criado_em)} (data do pedido)`,
        detalheHtml: (p) => `<p class="item-historico-detalhe">Motivo: ${escaparHtml(p.motivo_cancelamento || "Não informado")}</p>`,
        aoVerMais: () => {
            limiteCancelados += LIMITE_HISTORICO;
            renderizarTudo();
        }
    });
}

function formatarData(valor) {
    return valor ? new Date(valor).toLocaleDateString("pt-BR") : "—";
}

function cardPedido(p, tipoColuna) {
    const numero = `#${String(p.id).padStart(4, "0")}`;
    let acoes = "";

    if (tipoColuna === "novos") {
        acoes = `
            <button class="btn-aprovar btn-avancar-kanban" data-avancar="${p.id}" data-nova-etapa="1">✅ Aceitar → Em Preparo</button>
            <button class="btn-cancelar-kanban" data-cancelar="${p.id}">❌ Cancelar</button>
        `;
    } else if (tipoColuna === "preparo") {
        acoes = `
            <button class="btn-aprovar btn-avancar-kanban" data-avancar="${p.id}" data-nova-etapa="2">✅ Pronto → Saiu para Entrega</button>
            <button class="btn-cancelar-kanban" data-cancelar="${p.id}">❌ Cancelar</button>
        `;
    } else if (tipoColuna === "entrega") {
        acoes = `<button class="btn-aprovar btn-avancar-kanban" data-avancar="${p.id}" data-nova-etapa="3">✅ Confirmar Entrega</button>`;
    }

    const quantidade = Number(p.quantidade_itens) || 0;
    const chegada = tipoColuna === "novos" && p.criado_em ? ` · chegou ${tempoDesde(p.criado_em)}` : "";
    const classeDestaque = idsDestacados.has(p.id) ? " kanban-card-novo" : "";

    return `
        <div class="kanban-card${classeDestaque}" data-pedido-id="${p.id}">
            <div>
                <button class="kanban-card-numero" data-abrir-painel="${p.id}">${numero}</button>
                <button class="kanban-card-cliente" data-abrir-painel="${p.id}">${escaparHtml(p.cliente_nome || "Cliente removido")}</button>
                <p class="kanban-card-info">${formatarMoeda(p.total)} · ${quantidade} ${quantidade === 1 ? "item" : "itens"}${chegada}</p>
            </div>
            <div class="kanban-card-acoes">${acoes}</div>
        </div>
    `;
}

function renderizarColuna(idCorpo, lista, tipoColuna) {
    const corpo = document.getElementById(idCorpo);
    if (!corpo) return;

    if (lista.length === 0) {
        corpo.innerHTML = `<p class="kanban-vazio">Nenhum pedido aqui.</p>`;
        return;
    }

    corpo.innerHTML = lista.map((p) => cardPedido(p, tipoColuna)).join("");

    corpo.querySelectorAll("[data-abrir-painel]").forEach((elemento) => {
        elemento.addEventListener("click", () => abrirPainelDetalhes(Number(elemento.dataset.abrirPainel)));
    });
    corpo.querySelectorAll("[data-avancar]").forEach((botao) => {
        botao.addEventListener("click", () => avancarStatus(Number(botao.dataset.avancar), Number(botao.dataset.novaEtapa)));
    });
    corpo.querySelectorAll("[data-cancelar]").forEach((botao) => {
        botao.addEventListener("click", () => cancelarPedido(Number(botao.dataset.cancelar)));
    });
}

// Lista de uma seção recolhível (Entregues, Cancelados).
function renderizarHistorico(idLista, pedidos, opcoes) {
    const lista = document.getElementById(idLista);
    if (!lista) return;

    if (pedidos.length === 0) {
        lista.innerHTML = `<p class="kanban-vazio">${opcoes.mensagemVazia}</p>`;
        return;
    }

    const visiveis = pedidos.slice(0, opcoes.limite);
    const restantes = pedidos.length - visiveis.length;

    lista.innerHTML = visiveis.map((p) => `
        <div class="item-historico">
            <div class="item-historico-linha-principal">
                <span><strong>#${String(p.id).padStart(4, "0")}</strong> — ${escaparHtml(p.cliente_nome || "Cliente removido")}</span>
                <span class="item-historico-acoes">
                    <span>${formatarMoeda(p.total)} · ${opcoes.dataTexto(p)}</span>
                    <button class="btn-roxo-discreto btn-acao-tabela" data-abrir-painel="${p.id}">Ver detalhes</button>
                </span>
            </div>
            ${opcoes.detalheHtml ? opcoes.detalheHtml(p) : ""}
        </div>
    `).join("") + (restantes > 0
        ? `<button class="btn-secundario btn-ver-mais" data-ver-mais>Ver mais (${restantes} restante(s))</button>`
        : "");

    lista.querySelectorAll("[data-abrir-painel]").forEach((botao) => {
        botao.addEventListener("click", () => abrirPainelDetalhes(Number(botao.dataset.abrirPainel)));
    });
    const botaoVerMais = lista.querySelector("[data-ver-mais]");
    if (botaoVerMais) botaoVerMais.addEventListener("click", opcoes.aoVerMais);
}

async function avancarStatus(id, novaEtapa) {
    const confirmado = await confirmarAcao({
        titulo: "Atualizar status do pedido",
        mensagem: `Confirma avançar o pedido #${String(id).padStart(4, "0")} para "${ETAPA_LABELS[novaEtapa]}"?`,
        textoConfirmar: "Confirmar"
    });
    if (!confirmado) return;

    try {
        const resultado = await window.api.atualizarStatusPedidoPetshop(id, novaEtapa);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(`Pedido #${String(id).padStart(4, "0")} atualizado para ${ETAPA_LABELS[novaEtapa]}!`);
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao atualizar status do pedido:", erro);
        mostrarNotificacao("Erro ao atualizar status do pedido.", false);
    }
}

async function cancelarPedido(id) {
    const numeroFormatado = `#${String(id).padStart(4, "0")}`;
    const motivo = await solicitarMotivoCancelamento(numeroFormatado);
    if (!motivo) return;

    try {
        const resultado = await window.api.atualizarStatusPedidoPetshop(id, 4, motivo);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(`Pedido ${numeroFormatado} cancelado.`);
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao cancelar pedido:", erro);
        mostrarNotificacao("Erro ao cancelar pedido.", false);
    }
}

function fecharPainelPedido() {
    const lateral = document.getElementById("painel-lateral-pedido");
    if (lateral) lateral.classList.remove("ativo");
}

async function abrirPainelDetalhes(id) {
    const pedido = listaCompleta.find((p) => p.id === id);
    if (!pedido) return;

    const lateral = document.getElementById("painel-lateral-pedido");
    const conteudo = document.getElementById("conteudo-lateral-pedido");
    const numeroFormatado = `#${String(pedido.id).padStart(4, "0")}`;

    conteudo.innerHTML = `<h2>Pedido ${numeroFormatado}</h2><p>Carregando detalhes...</p>`;
    lateral.classList.add("ativo");

    let itens = [];
    let endereco = null;
    try {
        [itens, endereco] = await Promise.all([
            window.api.obterItensPedidoPetshop(id),
            window.api.obterEnderecoUsuarioPetshop(pedido.usuario_id)
        ]);
    } catch (erro) {
        console.error("Erro ao carregar detalhes do pedido:", erro);
    }

    if (!lateral.classList.contains("ativo")) return;

    const itensHtml = itens.length === 0
        ? "<p>Nenhum item registrado para este pedido.</p>"
        : itens.map((i) => `<p>${escaparHtml(i.quantidade)}x <strong>${escaparHtml(i.nome)}</strong> — ${formatarMoeda(i.preco_unitario)} cada</p>`).join("");

    conteudo.innerHTML = `
        <h2>Pedido ${numeroFormatado}</h2>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">👤 Cliente</h3>
            <p><strong>Nome:</strong> ${escaparHtml(pedido.cliente_nome || "Cliente removido")}</p>
            <p><strong>Telefone:</strong> ${escaparHtml(pedido.cliente_telefone || "Não informado")}</p>
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">📍 Endereço de Entrega</h3>
            ${enderecoHtml(endereco)}
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">📦 Itens</h3>
            ${itensHtml}
            <p style="margin-top:10px;"><strong>Total:</strong> ${formatarMoeda(pedido.total)}</p>
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">⚙️ Status Atual</h3>
            ${criarBadgeStatus(ETAPA_LABELS[pedido.etapa] || "Confirmado")}
        </div>
    `;
}
