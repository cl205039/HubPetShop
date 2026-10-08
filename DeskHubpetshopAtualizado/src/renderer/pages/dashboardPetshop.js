import { criarBadgeStatus } from "../shared/ui.js";

const LIMITE_ESTOQUE_BAIXO = 5;

const FRASES_MOTIVACIONAIS = [
    "Vamos ter um ótimo dia!",
    "Seu pet shop está online!",
    "Pronto para atender?"
];

export async function montarDashboardPetshop(container, petshopId, nomePetshop) {
    container.innerHTML = "<p style='padding:20px;'>Carregando dashboard...</p>";

    try {
        const [dados, agendamentosHoje, produtos] = await Promise.all([
            window.api.obterDashboardPetshop(petshopId),
            window.api.listarAgendamentosPetshop(petshopId, { status: "todos", data: dataHojeISO() }),
            window.api.listarProdutos(petshopId, {})
        ]);

        const produtosEstoqueBaixo = produtos.filter((p) => p.estoque < LIMITE_ESTOQUE_BAIXO);

        container.innerHTML = template(dados, nomePetshop, agendamentosHoje, produtosEstoqueBaixo);
        ligarNavegacao(container);
    } catch (erro) {
        console.error("Erro ao carregar dashboard do petshop:", erro);
        container.innerHTML = "<p style='color:red; padding:20px;'>Erro ao carregar dashboard.</p>";
    }
}

function dataHojeISO() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

function ligarNavegacao(container) {
    container.querySelectorAll("[data-pagina]").forEach((elemento) => {
        elemento.addEventListener("click", () => window.carregarPagina(elemento.dataset.pagina));
    });
}

function template(d, nomePetshop, agendamentosHoje, produtosEstoqueBaixo) {
    const dataFormatada = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
    const frase = FRASES_MOTIVACIONAIS[Math.floor(Math.random() * FRASES_MOTIVACIONAIS.length)];
    const maiorValor = Math.max(1, ...d.graficoReceitaMensal.map((m) => m.total));
    const temReceita = d.graficoReceitaMensal.some((m) => m.total > 0);

    return `
        <div class="dashboard-header">
            <h2 class="dashboard-title">Olá, ${nomePetshop || "Petshop"}! 👋</h2>
            <small class="dashboard-date">Hoje é ${dataFormatada}</small>
            <p class="dashboard-frase-motivacional">${frase}</p>
        </div>

        <div class="grid-indicadores-petshop">
            <div class="card-indicador card-indicador-roxo">
                <div class="card-indicador-icone">🛒</div>
                <div class="card-indicador-numero">${d.pedidosHoje}</div>
                <div class="card-indicador-label">Pedidos Hoje</div>
                <button class="card-indicador-link" data-pagina="pedidos">Ver todos →</button>
            </div>
            <div class="card-indicador card-indicador-azul">
                <div class="card-indicador-icone">📅</div>
                <div class="card-indicador-numero">${d.agendamentosHoje}</div>
                <div class="card-indicador-label">Agendamentos Hoje</div>
                <button class="card-indicador-link" data-pagina="agendamentos">Ver todos →</button>
            </div>
            <div class="card-indicador card-indicador-verde">
                <div class="card-indicador-icone">📦</div>
                <div class="card-indicador-numero">${d.produtosAtivos}</div>
                <div class="card-indicador-label">Produtos Ativos</div>
                <button class="card-indicador-link" data-pagina="produtos">Ver todos →</button>
            </div>
            <div class="card-indicador ${d.estoqueBaixo > 0 ? "card-indicador-vermelho" : "card-indicador-cinza"}">
                <div class="card-indicador-icone">⚠️</div>
                <div class="card-indicador-numero">${d.estoqueBaixo}</div>
                <div class="card-indicador-label">Estoque Crítico</div>
                <button class="card-indicador-link" data-pagina="produtos">Ver todos →</button>
            </div>
        </div>

        <div class="grid-dashboard-petshop">
            <div class="coluna-dashboard-esquerda">
                <div class="painel card-receita-unificado">
                    <h3>💰 Receita do Mês</h3>
                    <p class="valor-receita-destaque ${d.receitaMes > 0 ? "valor-positivo" : "valor-neutro"}">R$ ${d.receitaMes.toFixed(2)}</p>

                    ${temReceita ? `
                        <div class="grafico-container">
                            ${d.graficoReceitaMensal.map((m) => `
                                <div class="barra-container">
                                    <span>R$ ${m.total.toFixed(0)}</span>
                                    <div class="barra" style="height:${Math.max(4, (m.total / maiorValor) * 100)}%">
                                        <span class="label-barra">${m.label}</span>
                                    </div>
                                </div>
                            `).join("")}
                        </div>
                    ` : `
                        <p class="mensagem-grafico-vazio">O gráfico será preenchido conforme novos pedidos forem realizados.</p>
                    `}
                </div>

                <div class="painel">
                    <div class="cabecalho-card-com-link">
                        <h3>📅 Agendamentos de Hoje</h3>
                        <button class="link-ver-todos" data-pagina="agendamentos">Ver todos →</button>
                    </div>
                    ${agendamentosHoje.length === 0
                        ? `<p class="mensagem-lista-vazia">Nenhum agendamento para hoje.</p>`
                        : `<ul class="lista-agendamentos-dia">
                            ${agendamentosHoje.map((ag) => `
                                <li>
                                    <span class="agendamento-hora">${ag.hora || "—"}</span>
                                    <span class="agendamento-info"><strong>${ag.pet || "Pet"}</strong> (${ag.tutor_nome || "Tutor"}) — ${ag.servico || "Serviço"}</span>
                                    ${criarBadgeStatus(ag.status)}
                                </li>
                            `).join("")}
                        </ul>`
                    }
                </div>
            </div>

            <div class="coluna-dashboard-direita">
                <div class="painel">
                    <h3>⚠️ Alertas</h3>
                    ${produtosEstoqueBaixo.length === 0
                        ? `<p class="mensagem-lista-vazia">Tudo em ordem! ✅</p>`
                        : `<ul class="alerta-lista">
                            ${produtosEstoqueBaixo.map((p) => `<li class="alerta-item">⚠️ ${p.nome} — ${p.estoque} unidade(s)</li>`).join("")}
                        </ul>`
                    }
                </div>

                <div class="painel">
                    <h3>⚡ Atalhos Rápidos</h3>
                    <div class="atalhos-rapidos">
                        <button class="btn-laranja btn-atalho-largo" data-pagina="pedidos">📦 Ver Pedidos Pendentes</button>
                        <button class="btn-laranja btn-atalho-largo" data-pagina="agendamentos">📅 Ver Agendamentos</button>
                        <button class="btn-laranja btn-atalho-largo" data-pagina="produtos">🗃️ Gerenciar Estoque</button>
                    </div>
                </div>
            </div>
        </div>
    `;
}
