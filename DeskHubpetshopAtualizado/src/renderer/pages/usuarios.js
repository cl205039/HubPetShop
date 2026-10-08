import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";
import { paginar, renderizarControlesPaginacao, ligarControlesPaginacao } from "../shared/paginacao.js";

const ITENS_POR_PAGINA = 10;

// Formatação manual (em vez de toLocaleString) pra garantir "R$ X.XXX,XX"
// (ponto como milhar, vírgula como decimal) mesmo se o runtime não tiver os
// dados de localidade pt-BR carregados.
function formatarMoeda(valor) {
    const [inteiro, decimal] = (Number(valor) || 0).toFixed(2).split(".");
    const inteiroComMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `R$ ${inteiroComMilhar},${decimal}`;
}

function truncarEmail(email) {
    if (!email) return "";
    return email.length > 25 ? `${email.slice(0, 25)}…` : email;
}

let filtroBusca = "";
let listaAtual = [];
let paginaAtual = 1;

export async function montarPaginaUsuarios(container) {
    container.innerHTML = `
        <div id="painel-lateral-usuario" class="painel-lateral">
            <button id="btnFecharPainelUsuario">✕ Fechar</button>
            <div id="conteudo-lateral-usuario"></div>
        </div>

        <div class="painel">
            <h2>Usuários e Pets</h2>
            <div class="topo-tabela-container">
                <input type="text" id="buscaUsuario" class="input-busca-moderno" placeholder="Buscar por nome, e-mail ou CPF..." value="${filtroBusca}">
            </div>
            <table class="tabela-sem-quebra tabela-usuarios">
                <thead>
                    <tr>
                        <th>Usuário</th>
                        <th>E-mail</th>
                        <th>Pets</th>
                        <th>Total Gasto</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabela-usuarios-corpo"></tbody>
            </table>
            <div id="paginacao-usuarios"></div>
        </div>
    `;

    document.getElementById("btnFecharPainelUsuario").addEventListener("click", fecharPainel);

    const inputBusca = document.getElementById("buscaUsuario");
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        paginaAtual = 1;
        carregarLista();
    });

    await carregarLista();
}

async function carregarLista() {
    const tbody = document.getElementById("tabela-usuarios-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        listaAtual = await window.api.listarUsuarios({ busca: filtroBusca });
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar usuários:", erro);
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Erro ao carregar usuários do banco.</td></tr>`;
    }
}

function renderizarTabela() {
    const tbody = document.getElementById("tabela-usuarios-corpo");
    const areaPaginacao = document.getElementById("paginacao-usuarios");
    if (!tbody) return;

    if (listaAtual.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum usuário encontrado.</td></tr>`;
        areaPaginacao.innerHTML = "";
        return;
    }

    const { itens, totalPaginas, totalItens } = paginar(listaAtual, paginaAtual, ITENS_POR_PAGINA);

    tbody.innerHTML = itens.map((u) => {
        const status = u.ativo ? "Ativo" : "Inativo";
        const acaoStatus = u.ativo
            ? `<button class="btn-desativar btn-acao-tabela" data-acao="desativar" data-id="${u.id}">Desativar</button>`
            : `<button class="btn-aprovar btn-acao-tabela" data-acao="ativar" data-id="${u.id}">Ativar</button>`;

        return `
            <tr>
                <td class="celula-truncar" title="${u.nome}"><strong>${u.nome}</strong></td>
                <td class="celula-truncar" title="${u.email}">${truncarEmail(u.email)}</td>
                <td>${u.quantidade_pets}</td>
                <td class="celula-preco">${formatarMoeda(u.total_gasto)}</td>
                <td>${criarBadgeStatus(status)}</td>
                <td>
                    ${acaoStatus}
                    <button class="btn-editar btn-acao-tabela" data-acao="ver" data-id="${u.id}">Ver</button>
                </td>
            </tr>
        `;
    }).join("");

    tbody.querySelectorAll("button[data-acao]").forEach((botao) => {
        const id = Number(botao.dataset.id);
        const acao = botao.dataset.acao;
        botao.addEventListener("click", () => {
            if (acao === "ativar") alterarStatus(id, true);
            if (acao === "desativar") alterarStatus(id, false);
            if (acao === "ver") abrirPerfil(id);
        });
    });

    areaPaginacao.innerHTML = renderizarControlesPaginacao(paginaAtual, totalPaginas, totalItens);
    ligarControlesPaginacao(areaPaginacao, (novaPagina) => {
        paginaAtual = novaPagina;
        renderizarTabela();
    });
}

async function alterarStatus(id, ativar) {
    const confirmado = await confirmarAcao({
        titulo: ativar ? "Ativar usuário" : "Desativar usuário",
        mensagem: ativar
            ? "O usuário volta a ter acesso normal na plataforma. Deseja continuar?"
            : "O usuário perde o acesso à plataforma. Deseja continuar?",
        textoConfirmar: ativar ? "Ativar" : "Desativar",
        perigo: !ativar
    });
    if (!confirmado) return;

    try {
        const resultado = ativar ? await window.api.ativarUsuario(id) : await window.api.desativarUsuario(id);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(ativar ? "Usuário ativado." : "Usuário desativado.");
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao alterar status do usuário:", erro);
        mostrarNotificacao("Erro ao alterar status do usuário.", false);
    }
}

function fecharPainel() {
    const lateral = document.getElementById("painel-lateral-usuario");
    if (lateral) lateral.classList.remove("ativo");
}

async function abrirPerfil(id) {
    const usuario = listaAtual.find((item) => item.id === id);
    if (!usuario) return;

    const lateral = document.getElementById("painel-lateral-usuario");
    const conteudo = document.getElementById("conteudo-lateral-usuario");
    conteudo.innerHTML = "<p>Carregando...</p>";
    lateral.classList.add("ativo");

    try {
        const pets = await window.api.obterPetsUsuario(id);
        const petsHtml = pets.length === 0
            ? "<p>Nenhum pet cadastrado.</p>"
            : pets.map((p) => `<p>🐾 <strong>${p.nome}</strong> — ${p.tipo || "?"} ${p.raca ? `(${p.raca})` : ""}</p>`).join("");

        conteudo.innerHTML = `
            <div class="header-lateral-detalhes"><h2>${usuario.nome}</h2></div>

            <div class="secao-detalhes-lateral">
                <h3 class="titulo-secao-detalhes">📋 Dados Gerais</h3>
                <p><strong>E-mail:</strong> ${usuario.email}</p>
                <p><strong>Telefone:</strong> ${usuario.telefone || "Não informado"}</p>
                <p><strong>CPF:</strong> ${usuario.cpf}</p>
                <p><strong>Status:</strong> ${usuario.ativo ? "Ativo" : "Inativo"}</p>
                <p><strong>Total Gasto:</strong> ${formatarMoeda(usuario.total_gasto)}</p>
            </div>

            <div class="secao-detalhes-lateral">
                <h3 class="titulo-secao-detalhes">🐾 Pets</h3>
                ${petsHtml}
            </div>
        `;
    } catch (erro) {
        console.error("Erro ao carregar perfil do usuário:", erro);
        conteudo.innerHTML = "<p style='color:red;'>Erro ao carregar dados do usuário.</p>";
    }
}
