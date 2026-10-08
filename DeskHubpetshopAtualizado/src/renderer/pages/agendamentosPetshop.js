import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";

let filtroStatus = "todos";
let filtroData = "";
let listaAtual = [];
let petshopIdAtual = null;

export async function montarPaginaAgendamentosPetshop(container, petshopId) {
    petshopIdAtual = petshopId;

    container.innerHTML = `
        <div class="painel">
            <h2>Meus Agendamentos</h2>
            <div class="topo-tabela-container">
                <select id="filtroStatusAgendamentoPetshop" class="select-filtro">
                    <option value="todos" ${filtroStatus === "todos" ? "selected" : ""}>Todos os Status</option>
                    <option value="Pendente" ${filtroStatus === "Pendente" ? "selected" : ""}>Pendente</option>
                    <option value="Confirmado" ${filtroStatus === "Confirmado" ? "selected" : ""}>Confirmado</option>
                    <option value="Concluído" ${filtroStatus === "Concluído" ? "selected" : ""}>Concluído</option>
                    <option value="Cancelado" ${filtroStatus === "Cancelado" ? "selected" : ""}>Cancelado</option>
                </select>
                <input type="date" id="filtroDataAgendamentoPetshop" class="select-filtro" value="${filtroData}">
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Pet (Tutor)</th>
                        <th>Serviço</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabela-agendamentos-petshop-corpo"></tbody>
            </table>
        </div>
    `;

    const selectStatus = document.getElementById("filtroStatusAgendamentoPetshop");
    const inputData = document.getElementById("filtroDataAgendamentoPetshop");

    selectStatus.addEventListener("change", () => {
        filtroStatus = selectStatus.value;
        carregarLista();
    });
    inputData.addEventListener("change", () => {
        filtroData = inputData.value;
        carregarLista();
    });

    await carregarLista();
}

async function carregarLista() {
    const tbody = document.getElementById("tabela-agendamentos-petshop-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        listaAtual = await window.api.listarAgendamentosPetshop(petshopIdAtual, { status: filtroStatus, data: filtroData });
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar agendamentos:", erro);
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Erro ao carregar agendamentos do banco.</td></tr>`;
    }
}

function dataExibicao(ag) {
    if (ag.data_hora) return new Date(ag.data_hora).toLocaleDateString("pt-BR");
    if (ag.data) return ag.data.split("T")[0].split("-").reverse().join("/");
    return "—";
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
            <button class="btn-desativar btn-acao-tabela" data-acao="Cancelado" data-id="${ag.id}">Cancelar</button>
        `;
    }
    return "—";
}

function renderizarTabela() {
    const tbody = document.getElementById("tabela-agendamentos-petshop-corpo");
    if (!tbody) return;

    if (listaAtual.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum agendamento encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaAtual.map((ag) => `
        <tr>
            <td>${dataExibicao(ag)}</td>
            <td>${ag.hora || "—"}</td>
            <td>${ag.pet || "—"} (${ag.tutor_nome || "Tutor removido"})</td>
            <td>${ag.servico || "—"}</td>
            <td>${criarBadgeStatus(ag.status)}</td>
            <td>${botoesAcao(ag)}</td>
        </tr>
    `).join("");

    tbody.querySelectorAll("button[data-acao]").forEach((botao) => {
        const id = Number(botao.dataset.id);
        const novoStatus = botao.dataset.acao;
        botao.addEventListener("click", () => alterarStatus(id, novoStatus));
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
        const resultado = await window.api.atualizarStatusAgendamentoPetshop(id, petshopIdAtual, novoStatus);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(`Agendamento atualizado para ${novoStatus}!`);
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao atualizar status do agendamento:", erro);
        mostrarNotificacao("Erro ao atualizar status do agendamento.", false);
    }
}
