import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus, ETAPA_LABELS } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";

let listaCompleta = [];
let filtroBusca = "";
let petshopIdAtual = null;

export async function montarPaginaPedidosPetshop(container, petshopId) {
    petshopIdAtual = petshopId;

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
                    <h3>🏠 Pronto para Entrega</h3>
                    <div class="kanban-contador" id="contadorEntrega">0 pedidos</div>
                </div>
                <div class="kanban-corpo" id="colunaSaiuEntregue"><p class="kanban-vazio">Carregando...</p></div>
            </div>
        </div>

        <div class="painel" style="margin-top:20px;">
            <button id="btnToggleCancelados" class="btn-toggle-colapsavel">
                🗑️ Cancelados (<span id="contadorCancelados">0</span>) <span id="setaCancelados">▾</span>
            </button>
            <div id="listaCancelados" class="lista-cancelados" style="display:none;"></div>
        </div>
    `;

    document.getElementById("btnFecharPainelPedido").addEventListener("click", fecharPainelPedido);

    const inputBusca = document.getElementById("buscaPedidos");
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        renderizarTudo();
    });

    document.getElementById("btnToggleCancelados").addEventListener("click", () => {
        const lista = document.getElementById("listaCancelados");
        const seta = document.getElementById("setaCancelados");
        const aberto = lista.style.display !== "none";
        lista.style.display = aberto ? "none" : "block";
        seta.innerText = aberto ? "▾" : "▴";
    });

    await carregarLista();
}

async function carregarLista() {
    try {
        listaCompleta = await window.api.listarPedidosPetshop(petshopIdAtual, { status: "todos" });
        renderizarTudo();
    } catch (erro) {
        console.error("Erro ao carregar pedidos:", erro);
        ["colunaNovos", "colunaEmPreparo", "colunaSaiuEntregue"].forEach((id) => {
            const corpo = document.getElementById(id);
            if (corpo) corpo.innerHTML = `<p class="kanban-vazio" style="color:#e53935;">Erro ao carregar pedidos.</p>`;
        });
    }
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
    const saiuEntregue = filtrada.filter((p) => p.etapa === 2 || p.etapa === 3).sort((a, b) => a.etapa - b.etapa);
    const cancelados = filtrada.filter((p) => p.etapa === 4);

    document.getElementById("contadorPedidosAtivos").innerText = `${novos.length + emPreparo.length + saiuEntregue.length} pedido(s) ativo(s)`;
    document.getElementById("contadorNovos").innerText = `${novos.length} pedido(s)`;
    document.getElementById("contadorPreparo").innerText = `${emPreparo.length} pedido(s)`;
    document.getElementById("contadorEntrega").innerText = `${saiuEntregue.length} pedido(s)`;
    document.getElementById("contadorCancelados").innerText = cancelados.length;

    renderizarColuna("colunaNovos", novos, "novos");
    renderizarColuna("colunaEmPreparo", emPreparo, "preparo");
    renderizarColuna("colunaSaiuEntregue", saiuEntregue, "entrega");
    renderizarCancelados(cancelados);
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
        acoes = p.etapa === 2
            ? `<button class="btn-aprovar btn-avancar-kanban" data-avancar="${p.id}" data-nova-etapa="3">✅ Confirmar Entrega</button>`
            : `${criarBadgeStatus("Entregue")}`;
    }

    return `
        <div class="kanban-card">
            <div>
                <button class="kanban-card-numero" data-abrir-painel="${p.id}">${numero}</button>
                <button class="kanban-card-cliente" data-abrir-painel="${p.id}">${p.cliente_nome || "Cliente removido"}</button>
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

function renderizarCancelados(cancelados) {
    const lista = document.getElementById("listaCancelados");
    if (!lista) return;

    if (cancelados.length === 0) {
        lista.innerHTML = `<p class="kanban-vazio">Nenhum pedido cancelado.</p>`;
        return;
    }

    lista.innerHTML = cancelados.map((p) => {
        const dataCancelamento = p.cancelado_em
            ? new Date(p.cancelado_em).toLocaleDateString("pt-BR")
            : (p.criado_em ? new Date(p.criado_em).toLocaleDateString("pt-BR") : "—");

        return `
            <div class="item-cancelado">
                <div class="item-cancelado-linha-principal">
                    <span><strong>#${String(p.id).padStart(4, "0")}</strong> — ${p.cliente_nome || "Cliente removido"}</span>
                    <span>${dataCancelamento}</span>
                </div>
                <p class="item-cancelado-motivo">Motivo: ${p.motivo_cancelamento || "Não informado"}</p>
            </div>
        `;
    }).join("");
}

async function avancarStatus(id, novaEtapa) {
    const confirmado = await confirmarAcao({
        titulo: "Atualizar status do pedido",
        mensagem: `Confirma avançar o pedido #${String(id).padStart(4, "0")} para "${ETAPA_LABELS[novaEtapa]}"?`,
        textoConfirmar: "Confirmar"
    });
    if (!confirmado) return;

    try {
        const resultado = await window.api.atualizarStatusPedidoPetshop(id, petshopIdAtual, novaEtapa);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(`Pedido #${String(id).padStart(4, "0")} atualizado para ${ETAPA_LABELS[novaEtapa]}!`);
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao atualizar status do pedido:", erro);
        mostrarNotificacao("Erro ao atualizar status do pedido.", false);
    }
}

// Modal próprio (não usa confirmarAcao porque precisa de um textarea
// obrigatório) — mesma linguagem visual do modal de confirmação genérico
// (overlay + card-confirmacao), só com um campo de motivo no meio.
function solicitarMotivoCancelamento(numeroFormatado) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "overlay-confirmacao";
        overlay.innerHTML = `
            <div class="card-confirmacao">
                <h3>Cancelar pedido</h3>
                <p>Informe o motivo do cancelamento do pedido ${numeroFormatado}. Essa ação não pode ser desfeita.</p>
                <textarea id="motivoCancelamentoTexto" class="textarea-formulario" placeholder="Ex.: Produto fora de estoque, cliente desistiu..."></textarea>
                <small class="mensagem-erro-campo" id="motivoCancelamentoErro" style="display:none;">Informe o motivo do cancelamento.</small>
                <div class="acoes-confirmacao">
                    <button class="btn-secundario" data-acao="voltar">Voltar</button>
                    <button class="btn-desativar" data-acao="confirmar">Cancelar Pedido</button>
                </div>
            </div>
        `;

        function fechar(resultado) {
            overlay.remove();
            resolve(resultado);
        }

        const textarea = overlay.querySelector("#motivoCancelamentoTexto");
        const mensagemErro = overlay.querySelector("#motivoCancelamentoErro");

        overlay.addEventListener("click", (evento) => {
            if (evento.target === overlay) fechar(null);
        });
        overlay.querySelector('[data-acao="voltar"]').addEventListener("click", () => fechar(null));
        overlay.querySelector('[data-acao="confirmar"]').addEventListener("click", () => {
            const motivo = textarea.value.trim();
            if (!motivo) {
                textarea.classList.add("campo-invalido");
                mensagemErro.style.display = "block";
                textarea.focus();
                return;
            }
            fechar(motivo);
        });
        textarea.addEventListener("input", () => {
            textarea.classList.remove("campo-invalido");
            mensagemErro.style.display = "none";
        });

        document.body.appendChild(overlay);
        setTimeout(() => textarea.focus(), 100);
    });
}

async function cancelarPedido(id) {
    const numeroFormatado = `#${String(id).padStart(4, "0")}`;
    const motivo = await solicitarMotivoCancelamento(numeroFormatado);
    if (!motivo) return;

    try {
        const resultado = await window.api.atualizarStatusPedidoPetshop(id, petshopIdAtual, 4, motivo);
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
            window.api.obterItensPedidoPetshop(id, petshopIdAtual),
            window.api.obterEnderecoUsuarioPetshop(pedido.usuario_id)
        ]);
    } catch (erro) {
        console.error("Erro ao carregar detalhes do pedido:", erro);
    }

    if (!lateral.classList.contains("ativo")) return; // usuário já fechou antes da resposta chegar

    const itensHtml = itens.length === 0
        ? "<p>Nenhum item registrado para este pedido.</p>"
        : itens.map((i) => `<p>${i.quantidade}x <strong>${i.nome}</strong> — R$ ${Number(i.preco_unitario).toFixed(2)} cada</p>`).join("");

    const enderecoHtml = endereco
        ? `<p>${endereco.rua}, ${endereco.numero} — ${endereco.bairro}</p><p>${endereco.cidade} / ${endereco.estado} — CEP ${endereco.cep}</p>`
        : "<p>Endereço não cadastrado.</p>";

    conteudo.innerHTML = `
        <h2>Pedido ${numeroFormatado}</h2>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">👤 Cliente</h3>
            <p><strong>Nome:</strong> ${pedido.cliente_nome || "Cliente removido"}</p>
            <p><strong>Telefone:</strong> ${pedido.cliente_telefone || "Não informado"}</p>
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">📍 Endereço de Entrega</h3>
            ${enderecoHtml}
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">📦 Itens</h3>
            ${itensHtml}
            <p style="margin-top:10px;"><strong>Total:</strong> R$ ${Number(pedido.total).toFixed(2)}</p>
        </div>

        <div class="secao-detalhes-lateral">
            <h3 class="titulo-secao-detalhes">⚙️ Status Atual</h3>
            ${criarBadgeStatus(ETAPA_LABELS[pedido.etapa] || "Confirmado")}
        </div>
    `;
}
