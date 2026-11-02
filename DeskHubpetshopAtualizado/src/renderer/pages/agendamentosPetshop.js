import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus, escaparHtml, formatarDataAgendamento, dataISO, DIAS_SEMANA } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";

let filtroStatus = "todos";
let filtroData = "";
let listaAtual = [];

// Agenda do dia
let abaAtual = "agenda";
let dataAgenda = dataISO(new Date());
let agendaAtual = null;

export async function montarPaginaAgendamentosPetshop(container) {
    container.innerHTML = `
        <div class="painel">
            <h2>Meus Agendamentos</h2>
            <div class="abas-agenda">
                <button class="pill-filtro" data-aba="agenda">📅 Agenda do dia</button>
                <button class="pill-filtro" data-aba="lista">📋 Lista</button>
            </div>

            <div id="abaAgenda">
                <div class="topo-agenda">
                    <div class="navegacao-data">
                        <button class="btn-secundario" id="btnDiaAnterior">← Dia anterior</button>
                        <button class="btn-secundario" id="btnHoje">Hoje</button>
                        <button class="btn-secundario" id="btnProximoDia">Próximo dia →</button>
                        <input type="date" id="dataAgenda" class="select-filtro">
                    </div>
                </div>
                <h3 id="tituloDiaAgenda" class="titulo-dia-agenda"></h3>
                <div id="contadoresAgenda" class="contadores-agenda"></div>
                <div id="gradeAgenda"><p>Carregando agenda...</p></div>
            </div>

            <div id="abaLista" style="display:none;">
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

    document.querySelectorAll(".abas-agenda [data-aba]").forEach((botao) => {
        botao.addEventListener("click", () => trocarAba(botao.dataset.aba));
    });
    document.getElementById("btnDiaAnterior").addEventListener("click", () => mudarDia(-1));
    document.getElementById("btnProximoDia").addEventListener("click", () => mudarDia(1));
    document.getElementById("btnHoje").addEventListener("click", () => irParaData(dataISO(new Date())));
    document.getElementById("dataAgenda").addEventListener("change", (evento) => {
        if (evento.target.value) irParaData(evento.target.value);
    });

    await trocarAba(abaAtual);
}

async function trocarAba(aba) {
    abaAtual = aba;
    document.querySelectorAll(".abas-agenda [data-aba]").forEach((b) => b.classList.toggle("ativo", b.dataset.aba === aba));
    document.getElementById("abaAgenda").style.display = aba === "agenda" ? "block" : "none";
    document.getElementById("abaLista").style.display = aba === "lista" ? "block" : "none";
    await recarregarAbaAtual();
}

async function recarregarAbaAtual() {
    if (abaAtual === "agenda") await carregarAgenda();
    else await carregarLista();
}

// =========================
// Agenda do dia
// =========================

function mudarDia(dias) {
    const data = new Date(`${dataAgenda}T12:00:00`);
    data.setDate(data.getDate() + dias);
    irParaData(dataISO(data));
}

function irParaData(data) {
    dataAgenda = data;
    carregarAgenda();
}

async function carregarAgenda() {
    const grade = document.getElementById("gradeAgenda");
    if (!grade) return;
    document.getElementById("dataAgenda").value = dataAgenda;

    const titulo = new Date(`${dataAgenda}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" });
    document.getElementById("tituloDiaAgenda").innerText = titulo.charAt(0).toUpperCase() + titulo.slice(1);

    agendaAtual = await window.api.obterAgendaDoDia(dataAgenda);
    if (!agendaAtual) {
        grade.innerHTML = `<p style="color:#e53935;">Erro ao carregar a agenda.</p>`;
        return;
    }
    renderizarAgenda();
}

function textoHora(minutos) {
    return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

function minutosDe(hora) {
    const [h, m] = String(hora).split(":").map(Number);
    return h * 60 + m;
}

function cartaoAgendamento(ag) {
    const horario = ag.inicio === null
        ? escaparHtml(ag.hora || "Sem horário")
        : `${textoHora(ag.inicio)} – ${textoHora(ag.fim)}`;
    const classes = ["agenda-item"];
    if (ag.conflito) classes.push("agenda-item-conflito");
    if (ag.status === "Cancelado") classes.push("agenda-item-cancelado");

    return `
        <div class="${classes.join(" ")}">
            <div class="agenda-item-linha">
                <span><strong>${horario}</strong> · ${escaparHtml(ag.pet || "Pet")} (${escaparHtml(ag.tutor_nome || "Tutor removido")}) · ${escaparHtml(ag.servico || "—")} · ${ag.duracao} min</span>
                <span class="agenda-item-acoes">${criarBadgeStatus(ag.status)} ${botoesAcao(ag) === "—" ? "" : botoesAcao(ag)}</span>
            </div>
            ${ag.conflito ? `<p class="agenda-aviso-conflito">⚠️ Conflito de horário</p>` : ""}
        </div>
    `;
}

function renderizarAgenda() {
    const { horario, agendamentos, intervaloMinutos } = agendaAtual;
    const grade = document.getElementById("gradeAgenda");

    const contar = (status) => agendamentos.filter((a) => a.status === status).length;
    const conflitos = agendamentos.filter((a) => a.conflito).length;
    document.getElementById("contadoresAgenda").innerHTML = `
        <span class="contador-agenda">Total: <strong>${agendamentos.length}</strong></span>
        <span class="contador-agenda">Pendentes: <strong>${contar("Pendente")}</strong></span>
        <span class="contador-agenda">Confirmados: <strong>${contar("Confirmado")}</strong></span>
        <span class="contador-agenda ${conflitos > 0 ? "contador-agenda-conflito" : ""}">Conflitos: <strong>${conflitos}</strong></span>
    `;

    if (horario.fechado) {
        grade.innerHTML = `
            <p class="agenda-fechado">🔒 Fechado neste dia (${DIAS_SEMANA[agendaAtual.diaSemana]}).</p>
            ${agendamentos.length ? agendamentos.map(cartaoAgendamento).join("") : "<p>Nenhum agendamento.</p>"}
        `;
        ligarBotoesAgenda(grade);
        return;
    }

    const abertura = minutosDe(horario.hora_abertura);
    const fechamento = minutosDe(horario.hora_fechamento);
    const ocupando = agendamentos.filter((a) => a.status !== "Cancelado" && a.inicio !== null);
    const linhas = [];

    // Uma linha a cada 30 min, da abertura ao fechamento.
    for (let inicio = abertura; inicio < fechamento; inicio += intervaloMinutos) {
        const fimLinha = inicio + intervaloMinutos;
        const comecamAqui = agendamentos.filter((a) => a.inicio !== null && a.inicio >= inicio && a.inicio < fimLinha);
        const emAndamento = ocupando.find((a) => a.inicio < inicio && a.fim > inicio);

        let conteudo;
        if (comecamAqui.length) {
            conteudo = comecamAqui.map(cartaoAgendamento).join("");
        } else if (emAndamento) {
            conteudo = `<span class="agenda-ocupado">Ocupado · ${escaparHtml(emAndamento.pet || "Pet")} (até ${textoHora(emAndamento.fim)})</span>`;
        } else {
            conteudo = `<span class="agenda-livre">Livre</span>`;
        }

        linhas.push(`
            <div class="agenda-linha">
                <span class="agenda-hora">${textoHora(inicio)}</span>
                <div class="agenda-conteudo">${conteudo}</div>
            </div>
        `);
    }

    // Agendamentos sem hora ou fora do horário de funcionamento.
    const foraDoHorario = agendamentos.filter((a) => a.inicio === null || a.inicio < abertura || a.inicio >= fechamento);

    grade.innerHTML = linhas.join("") + (foraDoHorario.length
        ? `<h4 class="agenda-fora-titulo">Fora do horário de funcionamento</h4>${foraDoHorario.map(cartaoAgendamento).join("")}`
        : "");
    ligarBotoesAgenda(grade);
}

function ligarBotoesAgenda(grade) {
    grade.querySelectorAll("button[data-acao]").forEach((botao) => {
        botao.addEventListener("click", () => alterarStatus(Number(botao.dataset.id), botao.dataset.acao));
    });
}

// =========================
// Lista (tabela com filtros)
// =========================

async function carregarLista() {
    const tbody = document.getElementById("tabela-agendamentos-petshop-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        listaAtual = await window.api.listarAgendamentosPetshop({ status: filtroStatus, data: filtroData });
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar agendamentos:", erro);
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Erro ao carregar agendamentos do banco.</td></tr>`;
    }
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
            <td>${escaparHtml(formatarDataAgendamento(ag))}</td>
            <td>${escaparHtml(ag.hora || "—")}</td>
            <td>${escaparHtml(ag.pet || "—")} (${escaparHtml(ag.tutor_nome || "Tutor removido")})</td>
            <td>${escaparHtml(ag.servico || "—")}</td>
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
        const resultado = await window.api.atualizarStatusAgendamentoPetshop(id, novoStatus);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(`Agendamento atualizado para ${novoStatus}!`);
        await recarregarAbaAtual();
    } catch (erro) {
        console.error("Erro ao atualizar status do agendamento:", erro);
        mostrarNotificacao("Erro ao atualizar status do agendamento.", false);
    }
}
