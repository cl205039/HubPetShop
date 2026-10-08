import { mostrarNotificacao } from "../shared/notificacao.js";
import { confirmarAcao } from "../shared/confirmacao.js";
import { paginar, renderizarControlesPaginacao, ligarControlesPaginacao } from "../shared/paginacao.js";

const ITENS_POR_PAGINA = 10;

let filtroStatus = "todos";
let filtroData = "";
let filtroBusca = "";
let filtroEstabelecimento = "todos";
let listaAtual = [];
let paginaAtual = 1;

export async function montarPaginaAgendamentosAdmin(container) {
    container.innerHTML = `
        <div class="painel">
            <div class="topo-tabela-container">
                <input type="text" id="buscaAgendamentoAdmin" class="input-busca-moderno" placeholder="Buscar por tutor ou pet..." value="${filtroBusca}">
                <select id="filtroStatusAgendamentoAdmin" class="select-filtro">
                    <option value="todos" ${filtroStatus === "todos" ? "selected" : ""}>Todos os Status</option>
                    <option value="Pendente" ${filtroStatus === "Pendente" ? "selected" : ""}>Pendente</option>
                    <option value="Confirmado" ${filtroStatus === "Confirmado" ? "selected" : ""}>Confirmado</option>
                    <option value="Concluído" ${filtroStatus === "Concluído" ? "selected" : ""}>Concluído</option>
                    <option value="Cancelado" ${filtroStatus === "Cancelado" ? "selected" : ""}>Cancelado</option>
                </select>
                <select id="filtroEstabelecimentoAdmin" class="select-filtro">
                    <option value="todos">Todos os Estabelecimentos</option>
                </select>
                <input type="date" id="filtroDataAgendamentoAdmin" class="select-filtro" value="${filtroData}">
            </div>
            <table class="tabela-sem-quebra tabela-agendamentos-admin">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Pet (Tutor)</th>
                        <th>Serviço</th>
                        <th>Estabelecimento</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabela-agendamentos-admin-corpo"></tbody>
            </table>
            <div id="paginacao-agendamentos-admin"></div>
        </div>
    `;

    const selectStatus = document.getElementById("filtroStatusAgendamentoAdmin");
    const inputData = document.getElementById("filtroDataAgendamentoAdmin");
    const inputBusca = document.getElementById("buscaAgendamentoAdmin");
    const selectEstabelecimento = document.getElementById("filtroEstabelecimentoAdmin");

    selectStatus.addEventListener("change", () => {
        filtroStatus = selectStatus.value;
        paginaAtual = 1;
        carregarLista();
    });
    inputData.addEventListener("change", () => {
        filtroData = inputData.value;
        paginaAtual = 1;
        carregarLista();
    });
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        paginaAtual = 1;
        renderizarTabela();
    });
    selectEstabelecimento.addEventListener("change", () => {
        filtroEstabelecimento = selectEstabelecimento.value;
        paginaAtual = 1;
        renderizarTabela();
    });

    await carregarLista();
}

async function carregarLista() {
    const tbody = document.getElementById("tabela-agendamentos-admin-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7">Carregando...</td></tr>`;

    try {
        listaAtual = await window.api.listarAgendamentos({ status: filtroStatus, data: filtroData });
        atualizarOpcoesEstabelecimento();
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar agendamentos:", erro);
        tbody.innerHTML = `<tr><td colspan="7" style="color:red;">Erro ao carregar agendamentos do banco.</td></tr>`;
    }
}

function atualizarOpcoesEstabelecimento() {
    const select = document.getElementById("filtroEstabelecimentoAdmin");
    if (!select) return;

    const nomes = Array.from(new Set(listaAtual.map((ag) => ag.petshop_nome).filter(Boolean))).sort();
    const valorAtual = filtroEstabelecimento;

    select.innerHTML = `
        <option value="todos">Todos os Estabelecimentos</option>
        ${nomes.map((nome) => `<option value="${nome}" ${valorAtual === nome ? "selected" : ""}>${nome}</option>`).join("")}
    `;

    if (!nomes.includes(valorAtual) && valorAtual !== "todos") {
        filtroEstabelecimento = "todos";
        select.value = "todos";
    }
}

// Extrai { data: "DD/MM/AAAA", hora: "HH:MM" } de um jeito tolerante a
// formatos diferentes — `data_hora` (DATETIME real) é a fonte confiável,
// mas alguns agendamentos só têm `data` como texto, às vezes já incluindo
// hora embutida (ex.: "2026-08-31 10:40:00" em vez de só a data), o que
// antes quebrava a exibição ("31 10:40:00/08/2026").
function dataHoraExibicao(ag) {
    if (ag.data_hora) {
        const d = new Date(ag.data_hora);
        if (!Number.isNaN(d.getTime())) {
            return {
                data: d.toLocaleDateString("pt-BR"),
                hora: ag.hora || d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            };
        }
    }

    if (ag.data) {
        const [dataPura, horaEmbutida] = String(ag.data).split(/[T ]/);
        const [ano, mes, dia] = (dataPura || "").split("-");
        const data = (ano && mes && dia) ? `${dia}/${mes}/${ano}` : "—";
        const hora = ag.hora || (horaEmbutida ? horaEmbutida.slice(0, 5) : "—");
        return { data, hora };
    }

    return { data: "—", hora: ag.hora || "—" };
}

// Alguns pets vêm com emoji no nome (cadastro do app do consumidor) — some
// só o emoji na exibição da tabela, sem mexer no dado salvo.
function removerEmoji(texto) {
    return (texto || "").replace(/[\u{1F300}-\u{1FFFF}]/gu, "").trim();
}

function badgeStatusAgendamento(status) {
    const mapa = {
        "Pendente": "status-agendamento-pendente",
        "Confirmado": "status-agendamento-confirmado",
        "Concluído": "status-agendamento-concluido",
        "Cancelado": "status-agendamento-cancelado"
    };
    const classe = mapa[status] || "status-neutro";
    return `<span class="status-badge ${classe}">${status}</span>`;
}

function botoesAcao(ag) {
    if (ag.status === "Pendente") {
        return `
            <button class="btn-aprovar btn-acao-tabela" data-acao="Confirmado" data-id="${ag.id}">Confirmar</button>
            <button class="btn-desativar btn-acao-tabela" data-acao="Cancelado" data-id="${ag.id}">Cancelar</button>
        `;
    }
    if (ag.status === "Confirmado") {
        return `
            <button class="btn-aprovar btn-acao-tabela" data-acao="Concluído" data-id="${ag.id}">Concluir</button>
            <button class="btn-vermelho-discreto btn-acao-tabela" data-acao="Cancelado" data-id="${ag.id}">Cancelar</button>
        `;
    }
    return "—";
}

function aplicarFiltrosLocais(lista) {
    let filtrada = lista;

    if (filtroEstabelecimento !== "todos") {
        filtrada = filtrada.filter((ag) => ag.petshop_nome === filtroEstabelecimento);
    }

    const termo = filtroBusca.trim().toLowerCase();
    if (termo) {
        filtrada = filtrada.filter((ag) => {
            const pet = removerEmoji(ag.pet).toLowerCase();
            const tutor = (ag.tutor_nome || "").toLowerCase();
            return pet.includes(termo) || tutor.includes(termo);
        });
    }

    return filtrada;
}

function renderizarTabela() {
    const tbody = document.getElementById("tabela-agendamentos-admin-corpo");
    const areaPaginacao = document.getElementById("paginacao-agendamentos-admin");
    if (!tbody) return;

    const filtrada = aplicarFiltrosLocais(listaAtual);

    if (filtrada.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;">Nenhum agendamento encontrado.</td></tr>`;
        areaPaginacao.innerHTML = "";
        return;
    }

    const { itens, totalPaginas, totalItens } = paginar(filtrada, paginaAtual, ITENS_POR_PAGINA);

    tbody.innerHTML = itens.map((ag) => {
        const { data, hora } = dataHoraExibicao(ag);
        const petLimpo = removerEmoji(ag.pet) || "—";

        return `
            <tr>
                <td class="celula-data">${data}</td>
                <td class="celula-data">${hora}</td>
                <td class="celula-truncar" title="${petLimpo} (${ag.tutor_nome || "Tutor removido"})">${petLimpo} (${ag.tutor_nome || "Tutor removido"})</td>
                <td class="celula-truncar" title="${ag.servico || "—"}">${ag.servico || "—"}</td>
                <td class="celula-truncar" title="${ag.petshop_nome || ag.local || "Não vinculado"}">${ag.petshop_nome || (ag.local ? ag.local : `<span class="texto-nao-vinculado">Não vinculado</span>`)}</td>
                <td>${badgeStatusAgendamento(ag.status)}</td>
                <td>${botoesAcao(ag)}</td>
            </tr>
        `;
    }).join("");

    tbody.querySelectorAll("button[data-acao]").forEach((botao) => {
        const id = Number(botao.dataset.id);
        const novoStatus = botao.dataset.acao;
        botao.addEventListener("click", () => alterarStatus(id, novoStatus));
    });

    areaPaginacao.innerHTML = renderizarControlesPaginacao(paginaAtual, totalPaginas, totalItens);
    ligarControlesPaginacao(areaPaginacao, (novaPagina) => {
        paginaAtual = novaPagina;
        renderizarTabela();
    });
}

async function alterarStatus(id, novoStatus) {
    const rotulos = {
        Confirmado: { titulo: "Confirmar agendamento", mensagem: "Confirma este agendamento?", perigo: false },
        Cancelado: { titulo: "Cancelar agendamento", mensagem: "O tutor será considerado sem atendimento. Deseja cancelar?", perigo: true },
        "Concluído": { titulo: "Concluir agendamento", mensagem: "Marca este agendamento como concluído?", perigo: false }
    };
    const info = rotulos[novoStatus] || { titulo: "Confirmar ação", mensagem: "Deseja continuar?" };

    const confirmado = await confirmarAcao({
        titulo: info.titulo,
        mensagem: info.mensagem,
        textoConfirmar: novoStatus === "Cancelado" ? "Cancelar Agendamento" : "Confirmar",
        perigo: info.perigo
    });
    if (!confirmado) return;

    try {
        const resultado = await window.api.atualizarStatusAgendamento(id, novoStatus);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(`Agendamento atualizado para ${novoStatus}!`);
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao atualizar status do agendamento:", erro);
        mostrarNotificacao("Erro ao atualizar status do agendamento.", false);
    }
}
