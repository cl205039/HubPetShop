export async function montarDashboardAdmin(container) {
    container.innerHTML = "<p style='padding:20px;'>Carregando dashboard...</p>";

    try {
        const dados = await window.api.obterDashboardAdmin();
        container.innerHTML = template(dados);
    } catch (erro) {
        console.error("Erro ao carregar dashboard admin:", erro);
        container.innerHTML = "<p style='color:red; padding:20px;'>Erro ao carregar dashboard.</p>";
    }
}

function formatarMoeda(valor) {
    return `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Os alertas vêm prontos do backend como texto ("N petshop(s) aguardando
// aprovação") — como não dá pra mexer no backend aqui, o ajuste de
// nomenclatura pra "parceiro" é feito só na exibição, por texto mesmo.
function ajustarTextoParceiro(texto) {
    return texto.replace(/petshop\(s\)/gi, "parceiro(s)").replace(/\bpetshop\b/gi, "parceiro");
}

function template(d) {
    const dataAtual = new Date().toLocaleDateString("pt-BR");
    const maiorValor = Math.max(1, ...d.graficoReceitaMensal.map((m) => m.total));
    const temPendentes = d.petshopsPendentes > 0;

    return `
        <div class="dashboard-header">
            <h2 class="dashboard-title">Olá, Administrador 👋</h2>
            <small class="dashboard-date">Hoje é ${dataAtual}</small>
        </div>

        <div class="cards-grid">
            <div class="card-indicador ${temPendentes ? "card-indicador-laranja-intenso" : "card-indicador-laranja"}">
                <div class="card-indicador-icone">⏳</div>
                <div class="card-indicador-numero">${d.petshopsPendentes}</div>
                <div class="card-indicador-label">Parceiros Pendentes</div>
            </div>
            <div class="card-indicador card-indicador-roxo">
                <div class="card-indicador-icone">🛒</div>
                <div class="card-indicador-numero">${d.pedidosHoje}</div>
                <div class="card-indicador-label">Pedidos do Dia</div>
            </div>
            <div class="card-indicador card-indicador-verde">
                <div class="card-indicador-icone">💰</div>
                <div class="card-indicador-numero">${formatarMoeda(d.receitaMes)}</div>
                <div class="card-indicador-label">Receita do Mês</div>
            </div>
            <div class="card-indicador card-indicador-azul">
                <div class="card-indicador-icone">👥</div>
                <div class="card-indicador-numero">${d.usuariosAtivos}</div>
                <div class="card-indicador-label">Usuários Ativos</div>
            </div>
        </div>

        <div class="painel">
            <h3>Receita por Mês</h3>
            <div class="grafico-container">
                ${d.graficoReceitaMensal.map((m) => `
                    <div class="barra-container">
                        <span>${formatarMoeda(m.total)}</span>
                        <div class="barra" style="height:${Math.max(4, (m.total / maiorValor) * 100)}%">
                            <span class="label-barra">${m.label}</span>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>

        <div class="painel">
            <h3>Alertas</h3>
            <ul class="alerta-lista">
                ${d.alertas.map((a) => `<li class="alerta-item">⚠️ ${ajustarTextoParceiro(a)}</li>`).join("")}
            </ul>
            <div class="dashboard-actions">
                <button class="btn-aprovar" onclick="carregarPagina('petshops')">Ver Parceiros</button>
                <button class="btn-secundario" onclick="carregarPagina('relatorios')">Ver Relatórios</button>
            </div>
        </div>
    `;
}
