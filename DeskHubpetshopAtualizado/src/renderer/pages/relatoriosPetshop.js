import { mostrarNotificacao } from "../shared/notificacao.js";

let petshopIdAtual = null;
let periodoAtivo = "mes-atual";
let dataInicioCustom = "";
let dataFimCustom = "";

export async function montarPaginaRelatoriosPetshop(container, petshopId) {
    petshopIdAtual = petshopId;

    container.innerHTML = `
        <div class="painel">
            <div class="topo-tabela-container" style="justify-content: space-between; align-items: center;">
                <h2 style="margin:0;">📊 Relatórios</h2>
                <button id="btnExportarPdfPetshop" class="btn-exportar">📄 Exportar PDF</button>
            </div>

            <div class="relatorios-filtros">
                <div class="filtro-categorias-pills" id="pillsPeriodoRelatorio" style="margin-bottom:0;">
                    <button class="pill-filtro ativo" data-periodo="mes-atual">Este Mês</button>
                    <button class="pill-filtro" data-periodo="mes-passado">Mês Passado</button>
                    <button class="pill-filtro" data-periodo="ultimos-3-meses">Últimos 3 Meses</button>
                    <button class="pill-filtro" data-periodo="personalizado">Personalizado</button>
                </div>
                <div class="filtro-datas-personalizadas" id="filtroDatasPersonalizadas" style="display:none;">
                    <div class="grupo-filtro">
                        <label style="font-size:0.8rem; font-weight:bold; color: var(--roxo-principal);">De</label>
                        <input type="date" id="relatorioDataInicio" class="select-filtro">
                    </div>
                    <div class="grupo-filtro">
                        <label style="font-size:0.8rem; font-weight:bold; color: var(--roxo-principal);">Até</label>
                        <input type="date" id="relatorioDataFim" class="select-filtro">
                    </div>
                </div>
                <button id="btnGerarRelatorioPetshop" class="btn-laranja">Gerar Relatório</button>
            </div>
        </div>

        <div id="conteudoRelatorioPetshop"></div>
    `;

    document.getElementById("pillsPeriodoRelatorio").querySelectorAll(".pill-filtro").forEach((pill) => {
        pill.addEventListener("click", () => {
            periodoAtivo = pill.dataset.periodo;
            document.querySelectorAll("#pillsPeriodoRelatorio .pill-filtro").forEach((p) => p.classList.remove("ativo"));
            pill.classList.add("ativo");

            const camposData = document.getElementById("filtroDatasPersonalizadas");
            camposData.style.display = periodoAtivo === "personalizado" ? "flex" : "none";
        });
    });

    document.getElementById("relatorioDataInicio").addEventListener("change", (e) => { dataInicioCustom = e.target.value; });
    document.getElementById("relatorioDataFim").addEventListener("change", (e) => { dataFimCustom = e.target.value; });

    document.getElementById("btnGerarRelatorioPetshop").addEventListener("click", gerarRelatorio);
    document.getElementById("btnExportarPdfPetshop").addEventListener("click", exportarPdf);

    await gerarRelatorio();
}

// =========================
// Período
// =========================
function inicioDia(data) {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
}

function fimDia(data) {
    const d = new Date(data);
    d.setHours(23, 59, 59, 999);
    return d;
}

function inicioMes(data) {
    return new Date(data.getFullYear(), data.getMonth(), 1);
}

function fimMes(data) {
    return new Date(data.getFullYear(), data.getMonth() + 1, 0, 23, 59, 59, 999);
}

function resolverPeriodo() {
    const hoje = new Date();

    if (periodoAtivo === "personalizado") {
        if (!dataInicioCustom || !dataFimCustom) return null;
        return { inicio: inicioDia(`${dataInicioCustom}T00:00:00`), fim: fimDia(`${dataFimCustom}T00:00:00`) };
    }

    if (periodoAtivo === "mes-passado") {
        const mesPassado = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        return { inicio: inicioMes(mesPassado), fim: fimMes(mesPassado) };
    }

    if (periodoAtivo === "ultimos-3-meses") {
        return { inicio: inicioMes(new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1)), fim: fimDia(hoje) };
    }

    // "mes-atual" (padrão)
    return { inicio: inicioMes(hoje), fim: fimDia(hoje) };
}

function periodoAnterior(periodo) {
    const duracaoMs = periodo.fim.getTime() - periodo.inicio.getTime();
    const fimAnterior = new Date(periodo.inicio.getTime() - 1000);
    const inicioAnterior = new Date(fimAnterior.getTime() - duracaoMs);
    return { inicio: inicioAnterior, fim: fimAnterior };
}

function dentroDoPeriodo(dataStr, periodo) {
    if (!dataStr) return false;
    const data = new Date(dataStr);
    if (Number.isNaN(data.getTime())) return false;
    return data >= periodo.inicio && data <= periodo.fim;
}

function formatarDataCurta(data) {
    return `${String(data.getDate()).padStart(2, "0")}/${String(data.getMonth() + 1).padStart(2, "0")}`;
}

// =========================
// Cálculos (tudo client-side, a partir dos dados já trazidos pelo window.api)
// =========================
function calcularResumoFinanceiro(pedidosPeriodo, pedidosPeriodoAnterior) {
    const validos = pedidosPeriodo.filter((p) => p.etapa !== 4);
    const receita = validos.reduce((soma, p) => soma + Number(p.total), 0);
    const ticketMedio = validos.length > 0 ? receita / validos.length : 0;
    const concluidos = pedidosPeriodo.filter((p) => p.etapa === 3).length;
    const cancelados = pedidosPeriodo.filter((p) => p.etapa === 4).length;

    const validosAnterior = pedidosPeriodoAnterior.filter((p) => p.etapa !== 4);
    const receitaAnterior = validosAnterior.reduce((soma, p) => soma + Number(p.total), 0);

    let variacao = null;
    if (receitaAnterior > 0) {
        variacao = ((receita - receitaAnterior) / receitaAnterior) * 100;
    } else if (receita > 0) {
        variacao = 100;
    }

    return { receita, ticketMedio, concluidos, cancelados, variacao };
}

function calcularReceitaPorSemana(pedidosPeriodo, periodo) {
    const validos = pedidosPeriodo.filter((p) => p.etapa !== 4 && p.criado_em);
    if (validos.length === 0) return [];

    const semanas = [];
    const cursor = new Date(periodo.inicio);
    while (cursor <= periodo.fim) {
        const inicioSemana = new Date(cursor);
        let fimSemana = new Date(cursor);
        fimSemana.setDate(fimSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);
        if (fimSemana > periodo.fim) fimSemana = new Date(periodo.fim);
        semanas.push({ inicio: inicioSemana, fim: fimSemana, total: 0 });
        cursor.setDate(cursor.getDate() + 7);
    }

    validos.forEach((p) => {
        const data = new Date(p.criado_em);
        const semana = semanas.find((s) => data >= s.inicio && data <= s.fim);
        if (semana) semana.total += Number(p.total);
    });

    return semanas.map((s) => ({ label: formatarDataCurta(s.inicio), total: s.total }));
}

async function buscarItensVendidos(pedidosPeriodo) {
    const validos = pedidosPeriodo.filter((p) => p.etapa !== 4);
    const listas = await Promise.all(
        validos.map((p) => window.api.obterItensPedidoPetshop(p.id, petshopIdAtual).catch(() => []))
    );
    return listas.flat();
}

function calcularRankingProdutos(itens) {
    const mapa = new Map();
    itens.forEach((i) => {
        const atual = mapa.get(i.nome) || { nome: i.nome, quantidade: 0, receita: 0 };
        atual.quantidade += Number(i.quantidade);
        atual.receita += Number(i.quantidade) * Number(i.preco_unitario);
        mapa.set(i.nome, atual);
    });
    return Array.from(mapa.values()).sort((a, b) => b.receita - a.receita).slice(0, 10);
}

function calcularResumoAgendamentos(agendamentosPeriodo) {
    const total = agendamentosPeriodo.length;
    const confirmados = agendamentosPeriodo.filter((a) => a.status === "Confirmado" || a.status === "Concluído").length;
    const cancelados = agendamentosPeriodo.filter((a) => a.status === "Cancelado").length;
    const pctConfirmados = total > 0 ? Math.round((confirmados / total) * 100) : 0;
    const pctCancelados = total > 0 ? Math.round((cancelados / total) * 100) : 0;
    return { total, pctConfirmados, pctCancelados };
}

function renderizarEstrelas(media) {
    const cheias = Math.round(media || 0);
    let html = "";
    for (let i = 1; i <= 5; i++) {
        html += i <= cheias ? "★" : "☆";
    }
    return html;
}

function formatarMoeda(valor) {
    return `R$ ${Number(valor).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// =========================
// Geração do relatório
// =========================
async function gerarRelatorio() {
    const periodo = resolverPeriodo();
    if (!periodo) {
        mostrarNotificacao("Selecione as duas datas do período personalizado.", false);
        return;
    }

    const botao = document.getElementById("btnGerarRelatorioPetshop");
    const areaConteudo = document.getElementById("conteudoRelatorioPetshop");
    botao.disabled = true;
    botao.innerText = "Gerando...";
    areaConteudo.innerHTML = `<div class="painel"><p class="mensagem-lista-vazia" style="padding:30px;">Carregando relatório...</p></div>`;

    try {
        const [pedidos, agendamentos, perfil] = await Promise.all([
            window.api.listarPedidosPetshop(petshopIdAtual, { status: "todos" }),
            window.api.listarAgendamentosPetshop(petshopIdAtual, { status: "todos" }),
            window.api.obterPerfilPetshop(petshopIdAtual)
        ]);

        const pedidosPeriodo = pedidos.filter((p) => dentroDoPeriodo(p.criado_em, periodo));
        const pedidosPeriodoAnterior = pedidos.filter((p) => dentroDoPeriodo(p.criado_em, periodoAnterior(periodo)));
        const agendamentosPeriodo = agendamentos.filter((a) => dentroDoPeriodo(a.data_hora || a.data, periodo));

        if (pedidosPeriodo.length === 0 && agendamentosPeriodo.length === 0) {
            areaConteudo.innerHTML = `
                <div class="painel">
                    <div class="estado-vazio-tabela">
                        <span class="estado-vazio-icone">📊</span>
                        <p>Sem movimentação no período. Comece a vender para ver seus relatórios! 🐾</p>
                    </div>
                </div>
            `;
            return;
        }

        const resumoFinanceiro = calcularResumoFinanceiro(pedidosPeriodo, pedidosPeriodoAnterior);
        const graficoSemanal = calcularReceitaPorSemana(pedidosPeriodo, periodo);
        const itensVendidos = await buscarItensVendidos(pedidosPeriodo);
        const rankingProdutos = calcularRankingProdutos(itensVendidos);
        const resumoAgendamentos = calcularResumoAgendamentos(agendamentosPeriodo);

        areaConteudo.innerHTML = template({ resumoFinanceiro, graficoSemanal, rankingProdutos, resumoAgendamentos, perfil });
    } catch (erro) {
        console.error("Erro ao gerar relatório:", erro);
        areaConteudo.innerHTML = `<div class="painel"><p style="color:red; padding:30px;">Erro ao gerar relatório.</p></div>`;
    } finally {
        botao.disabled = false;
        botao.innerText = "Gerar Relatório";
    }
}

function template({ resumoFinanceiro, graficoSemanal, rankingProdutos, resumoAgendamentos, perfil }) {
    const temReceitaNoGrafico = graficoSemanal.some((s) => s.total > 0);
    const maiorValorSemana = Math.max(1, ...graficoSemanal.map((s) => s.total));

    const variacaoHtml = resumoFinanceiro.variacao === null
        ? `<p class="comparativo-periodo-anterior">Sem dados do período anterior para comparar.</p>`
        : `<p class="comparativo-periodo-anterior ${resumoFinanceiro.variacao >= 0 ? "positivo" : "negativo"}">
             ${resumoFinanceiro.variacao >= 0 ? "▲" : "▼"} ${Math.abs(resumoFinanceiro.variacao).toFixed(0)}% em relação ao período anterior
           </p>`;

    const rankingHtml = rankingProdutos.length === 0
        ? `<p class="mensagem-lista-vazia">Nenhum produto vendido no período.</p>`
        : `
            <table>
                <thead>
                    <tr><th>#</th><th>Produto</th><th>Qtd. Vendida</th><th>Receita</th></tr>
                </thead>
                <tbody>
                    ${rankingProdutos.map((p, i) => `
                        <tr>
                            <td>${i + 1}º</td>
                            <td>${p.nome}</td>
                            <td>${p.quantidade}</td>
                            <td>${formatarMoeda(p.receita)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;

    const avaliacoes = perfil?.avaliacoes || [];
    const ultimasAvaliacoesHtml = avaliacoes.length === 0
        ? `<p class="mensagem-lista-vazia">Nenhuma avaliação recebida ainda.</p>`
        : avaliacoes.slice(0, 5).map((a) => `
            <div class="item-avaliacao">
                <div class="item-avaliacao-topo">
                    <span class="item-avaliacao-estrelas">${renderizarEstrelas(a.nota)}</span>
                    <strong>${a.usuario_nome || "Cliente"}</strong>
                </div>
                <p class="item-avaliacao-comentario">${a.comentario || "(sem comentário)"}</p>
            </div>
        `).join("");

    return `
        <div class="grid-indicadores-petshop">
            <div class="card-indicador card-indicador-verde">
                <div class="card-indicador-icone">💰</div>
                <div class="card-indicador-numero">${formatarMoeda(resumoFinanceiro.receita)}</div>
                <div class="card-indicador-label">Receita do Período</div>
            </div>
            <div class="card-indicador card-indicador-azul">
                <div class="card-indicador-icone">🎫</div>
                <div class="card-indicador-numero">${formatarMoeda(resumoFinanceiro.ticketMedio)}</div>
                <div class="card-indicador-label">Ticket Médio por Pedido</div>
            </div>
            <div class="card-indicador card-indicador-roxo">
                <div class="card-indicador-icone">📦</div>
                <div class="card-indicador-numero">${resumoFinanceiro.concluidos}</div>
                <div class="card-indicador-label">Pedidos Concluídos</div>
            </div>
            <div class="card-indicador ${resumoFinanceiro.cancelados > 0 ? "card-indicador-vermelho" : "card-indicador-cinza"}">
                <div class="card-indicador-icone">❌</div>
                <div class="card-indicador-numero">${resumoFinanceiro.cancelados}</div>
                <div class="card-indicador-label">Pedidos Cancelados</div>
            </div>
        </div>
        ${variacaoHtml}

        <div class="painel">
            <h3>📈 Receita por Semana</h3>
            ${temReceitaNoGrafico ? `
                <div class="grafico-container">
                    ${graficoSemanal.map((s) => `
                        <div class="barra-container">
                            <span>${formatarMoeda(s.total)}</span>
                            <div class="barra" style="height:${Math.max(4, (s.total / maiorValorSemana) * 100)}%">
                                <span class="label-barra">${s.label}</span>
                            </div>
                        </div>
                    `).join("")}
                </div>
            ` : `<p class="mensagem-grafico-vazio">Nenhuma movimentação no período selecionado.</p>`}
        </div>

        <div class="painel">
            <h3>🏆 Produtos Mais Vendidos</h3>
            ${rankingHtml}
        </div>

        <div class="painel">
            <h3>⭐ Avaliações (Geral)</h3>
            <div class="avaliacoes-resumo">
                <span class="avaliacoes-estrelas">${renderizarEstrelas(perfil?.mediaAvaliacoes)}</span>
                <span class="avaliacoes-media-numero">${Number(perfil?.mediaAvaliacoes || 0).toFixed(1)}</span>
                <span class="avaliacoes-total">(${perfil?.quantidadeAvaliacoes || 0} avaliação(ões))</span>
            </div>
            <div class="lista-avaliacoes-relatorio">
                ${ultimasAvaliacoesHtml}
            </div>
        </div>

        <div class="painel">
            <h3>📅 Agendamentos</h3>
            <p>${resumoAgendamentos.total} agendamento(s) no período</p>
            <p class="taxa-confirmacao-agendamentos">${resumoAgendamentos.pctConfirmados}% confirmados, ${resumoAgendamentos.pctCancelados}% cancelados</p>
            <div class="barra-progresso-agendamentos">
                <div class="segmento-confirmado" style="width:${resumoAgendamentos.pctConfirmados}%"></div>
                <div class="segmento-cancelado" style="width:${resumoAgendamentos.pctCancelados}%"></div>
            </div>
        </div>
    `;
}

async function exportarPdf() {
    const botao = document.getElementById("btnExportarPdfPetshop");
    botao.disabled = true;
    botao.innerText = "Exportando...";

    try {
        const resultado = await window.api.exportarRelatorioPDF();
        if (resultado.cancelado) {
            // usuário fechou o diálogo de salvar sem escolher local — não é erro
        } else if (!resultado.sucesso) {
            throw new Error(resultado.mensagem);
        } else {
            mostrarNotificacao(`PDF salvo em: ${resultado.caminho}`);
        }
    } catch (erro) {
        console.error("Erro ao exportar PDF:", erro);
        mostrarNotificacao("Erro ao exportar PDF.", false);
    } finally {
        botao.disabled = false;
        botao.innerText = "📄 Exportar PDF";
    }
}
