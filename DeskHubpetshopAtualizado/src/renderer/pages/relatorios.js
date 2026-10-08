import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus, ETAPA_LABELS } from "../shared/ui.js";

let dataInicioAtual = "";
let dataFimAtual = "";

export async function montarPaginaRelatorios(container) {
    container.innerHTML = template();

    document.getElementById("btnGerarRelatorio").addEventListener("click", gerarRelatorio);
    document.getElementById("btnExportarPdf").addEventListener("click", exportarPdf);

    await gerarRelatorio();
}

function template() {
    return `
        <div class="painel">
            <div class="relatorios-filtros">
                <div class="grupo-filtro">
                    <label style="font-size: 0.8rem; font-weight: bold; color: var(--roxo-principal);">Data Início</label>
                    <input type="date" id="reportDataInicio" class="select-filtro" value="${dataInicioAtual}">
                </div>
                <div class="grupo-filtro">
                    <label style="font-size: 0.8rem; font-weight: bold; color: var(--roxo-principal);">Data Fim</label>
                    <input type="date" id="reportDataFim" class="select-filtro" value="${dataFimAtual}">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="btnGerarRelatorio" class="btn-editar">Gerar Relatório</button>
                    <button id="btnExportarPdf" class="btn-exportar">📄 Exportar PDF</button>
                </div>
            </div>
        </div>

        <div id="area-documento-relatorio" class="painel" style="min-height: 600px; border: 1px solid #ddd; padding: 40px; background: #fff;">
            <div class="report-header-doc">
                <div class="report-info-doc">
                    <h2>Relatório de Vendas e Serviços</h2>
                    <p>HubPet Shop - Gestão de Ecossistema Pet</p>
                </div>
                <div class="report-meta-doc">
                    <p><strong>Emissão:</strong> <span id="doc-data-geracao"></span></p>
                    <p><strong>Período:</strong> <span id="doc-periodo"></span></p>
                </div>
            </div>

            <div class="resumo-financeiro-mini" id="doc-resumo-mini"></div>

            <h3 style="margin-top: 25px; color: var(--roxo-principal);">Pedidos por Status</h3>
            <table class="tabela-relatorio">
                <thead><tr><th>Status</th><th>Quantidade</th><th>Total</th></tr></thead>
                <tbody id="doc-tabela-status"></tbody>
            </table>

            <h3 style="margin-top: 30px; color: var(--roxo-principal);">Produtos Mais Vendidos</h3>
            <table class="tabela-relatorio">
                <thead><tr><th>Produto</th><th>Quantidade Vendida</th><th>Receita</th></tr></thead>
                <tbody id="doc-tabela-produtos"></tbody>
            </table>

            <h3 style="margin-top: 30px; color: var(--roxo-principal);">Serviços Cadastrados (por preço)</h3>
            <p style="font-size: 0.8rem; color: #888;">Ainda não há vínculo entre agendamentos e o catálogo de serviços do petshop no banco, então esta lista mostra o catálogo cadastrado, não volume de vendas.</p>
            <table class="tabela-relatorio">
                <thead><tr><th>Serviço</th><th>Petshop</th><th>Preço</th></tr></thead>
                <tbody id="doc-tabela-servicos"></tbody>
            </table>

            <div style="margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 0.8rem; color: #999; text-align: center;">
                Este documento é gerado automaticamente a partir dos dados reais do banco hubpetshop.
            </div>
        </div>
    `;
}

async function gerarRelatorio() {
    dataInicioAtual = document.getElementById("reportDataInicio").value;
    dataFimAtual = document.getElementById("reportDataFim").value;

    const botao = document.getElementById("btnGerarRelatorio");
    const areaRelatorio = document.getElementById("area-documento-relatorio");
    botao.disabled = true;
    botao.innerText = "Gerando...";
    areaRelatorio.style.opacity = "0.5";

    try {
        const dados = await window.api.obterRelatorioVendas({ dataInicio: dataInicioAtual, dataFim: dataFimAtual });
        preencherRelatorio(dados);
    } catch (erro) {
        console.error("Erro ao gerar relatório:", erro);
        mostrarNotificacao("Erro ao gerar relatório.", false);
    } finally {
        botao.disabled = false;
        botao.innerText = "Gerar Relatório";
        areaRelatorio.style.opacity = "1";
    }
}

function preencherRelatorio(dados) {
    document.getElementById("doc-data-geracao").innerText = new Date().toLocaleString("pt-BR");
    document.getElementById("doc-periodo").innerText = (dataInicioAtual && dataFimAtual)
        ? `${dataInicioAtual} até ${dataFimAtual}`
        : "Todo o período";

    document.getElementById("doc-resumo-mini").innerHTML = `
        <div class="resumo-item-mini"><span>Faturamento</span><strong>R$ ${dados.faturamento.total.toFixed(2)}</strong></div>
        <div class="resumo-item-mini"><span>Pedidos no Período</span><strong>${dados.faturamento.quantidade}</strong></div>
    `;

    const tbodyStatus = document.getElementById("doc-tabela-status");
    tbodyStatus.innerHTML = dados.pedidosPorStatus.length === 0
        ? `<tr><td colspan="3" style="text-align:center;">Nenhum pedido no período.</td></tr>`
        : dados.pedidosPorStatus.map((p) => `
            <tr>
                <td>${criarBadgeStatus(ETAPA_LABELS[p.etapa] || "Confirmado")}</td>
                <td>${p.quantidade}</td>
                <td>R$ ${p.total.toFixed(2)}</td>
            </tr>
        `).join("");

    const tbodyProdutos = document.getElementById("doc-tabela-produtos");
    tbodyProdutos.innerHTML = dados.ranking.produtosMaisVendidos.length === 0
        ? `<tr><td colspan="3" style="text-align:center;">Nenhuma venda registrada ainda.</td></tr>`
        : dados.ranking.produtosMaisVendidos.map((p) => `
            <tr><td>${p.nome}</td><td>${p.quantidade}</td><td>R$ ${p.receita.toFixed(2)}</td></tr>
        `).join("");

    const tbodyServicos = document.getElementById("doc-tabela-servicos");
    tbodyServicos.innerHTML = dados.ranking.servicosCadastrados.length === 0
        ? `<tr><td colspan="3" style="text-align:center;">Nenhum serviço cadastrado ainda.</td></tr>`
        : dados.ranking.servicosCadastrados.map((s) => `
            <tr><td>${s.nome}</td><td>${s.petshop || "—"}</td><td>R$ ${s.preco.toFixed(2)}</td></tr>
        `).join("");
}

async function exportarPdf() {
    const botao = document.getElementById("btnExportarPdf");
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
