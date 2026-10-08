import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";

const LIMITE_ESTOQUE_BAIXO = 5;

// Rótulo curto exibido na pill -> nome real da categoria no banco (algumas
// categorias têm nome mais longo, ex.: "Higiene e Limpeza").
const FILTROS_CATEGORIA = [
    { rotulo: "Todos", valor: "todos" },
    { rotulo: "Rações", valor: "Rações" },
    { rotulo: "Brinquedos", valor: "Brinquedos" },
    { rotulo: "Acessórios", valor: "Acessórios" },
    { rotulo: "Higiene", valor: "Higiene e Limpeza" },
    { rotulo: "Medicamentos", valor: "Medicamentos e Suplementos" },
    { rotulo: "Petiscos", valor: "Petiscos" }
];

let filtroBusca = "";
let filtroCategoriaAtiva = "todos";
let listaAtual = [];
let categoriasCache = [];
let petshopIdAtual = null;

export async function montarPaginaProdutos(container, petshopId) {
    petshopIdAtual = petshopId;

    const pillsHtml = FILTROS_CATEGORIA.map((f) => `
        <button class="pill-categoria ${f.valor === filtroCategoriaAtiva ? "ativo" : ""}" data-categoria="${f.valor}">${f.rotulo}</button>
    `).join("");

    container.innerHTML = `
        <div class="painel">
            <div class="topo-tabela-container" style="justify-content: space-between;">
                <h2 style="margin:0;">Meus Produtos</h2>
                <button id="btnNovoProduto" class="btn-laranja">+ Novo Produto</button>
            </div>
            <p class="resumo-produtos-topo" id="resumoProdutosTopo">Carregando...</p>
            <div class="topo-tabela-container">
                <input type="text" id="buscaProduto" class="input-busca-moderno input-busca-largura-total" placeholder="Buscar produto..." value="${filtroBusca}">
            </div>
            <div class="filtro-categorias-pills" id="filtroCategoriasPills">
                ${pillsHtml}
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabela-produtos-corpo">
                    <tr><td colspan="6" style="text-align:center; padding:30px;">Carregando produtos...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById("btnNovoProduto").addEventListener("click", abrirCadastro);

    const inputBusca = document.getElementById("buscaProduto");
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        carregarLista();
    });

    document.getElementById("filtroCategoriasPills").querySelectorAll(".pill-categoria").forEach((pill) => {
        pill.addEventListener("click", () => {
            filtroCategoriaAtiva = pill.dataset.categoria;
            document.querySelectorAll(".pill-categoria").forEach((p) => p.classList.remove("ativo"));
            pill.classList.add("ativo");
            renderizarTabela();
        });
    });

    try {
        categoriasCache = await window.api.listarCategorias("produto");
    } catch (erro) {
        console.error("Erro ao carregar categorias:", erro);
        categoriasCache = [];
    }

    await carregarLista();
}

async function carregarLista() {
    const tbody = document.getElementById("tabela-produtos-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">Carregando produtos...</td></tr>`;

    try {
        listaAtual = await window.api.listarProdutos(petshopIdAtual, { busca: filtroBusca });
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);
        tbody.innerHTML = `<tr><td colspan="6" style="color:red; text-align:center; padding:30px;">Erro ao carregar produtos do banco.</td></tr>`;
    }
}

function aplicarFiltroCategoria(lista) {
    if (filtroCategoriaAtiva === "todos") return lista;
    return lista.filter((p) => p.categoria_nome === filtroCategoriaAtiva);
}

function atualizarResumoTopo() {
    const resumo = document.getElementById("resumoProdutosTopo");
    if (!resumo) return;

    const totalAtivos = listaAtual.filter((p) => p.ativo).length;
    const totalBaixoEstoque = listaAtual.filter((p) => p.estoque < LIMITE_ESTOQUE_BAIXO).length;

    resumo.innerHTML = `${totalAtivos} produto(s) ativo(s) · `
        + `<span class="${totalBaixoEstoque > 0 ? "texto-alerta-vermelho" : ""}">${totalBaixoEstoque}</span> com estoque baixo ⚠️`;
}

function renderizarTabela() {
    const tbody = document.getElementById("tabela-produtos-corpo");
    if (!tbody) return;

    atualizarResumoTopo();

    if (listaAtual.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="estado-vazio-tabela">
                        <span class="estado-vazio-icone">📦</span>
                        <p>Nenhum produto cadastrado ainda.</p>
                        <button id="btnPrimeiroProduto" class="btn-laranja">+ Cadastrar meu primeiro produto</button>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById("btnPrimeiroProduto").addEventListener("click", abrirCadastro);
        return;
    }

    const listaFiltrada = aplicarFiltroCategoria(listaAtual);

    if (listaFiltrada.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="estado-vazio-tabela">
                        <span class="estado-vazio-icone">📦</span>
                        <p>Nenhum produto encontrado nessa categoria.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = listaFiltrada.map((p) => {
        const estoqueBaixo = p.estoque < LIMITE_ESTOQUE_BAIXO;
        return `
            <tr>
                <td><strong>${p.nome}</strong></td>
                <td>${p.categoria_nome || "Sem categoria"}</td>
                <td class="celula-preco">R$ ${Number(p.preco).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>
                    <div style="display:flex; align-items:center; gap:6px;">
                        <input type="number" min="0" class="input-formulario input-estoque-inline ${estoqueBaixo ? "input-estoque-baixo" : ""}" data-id="${p.id}" value="${p.estoque}" style="width:70px;">
                        <button class="btn-salvar-estoque-inline" data-acao="salvar-estoque" data-id="${p.id}" title="Salvar estoque">✓</button>
                    </div>
                </td>
                <td>${criarBadgeStatus(p.ativo ? "Ativo" : "Inativo")}</td>
                <td>
                    <div class="acoes-tabela-linha">
                        <button class="btn-editar btn-acao-tabela" data-acao="editar" data-id="${p.id}">Editar</button>
                        ${p.ativo
                            ? `<button class="btn-cinza-discreto btn-acao-tabela" data-acao="desativar" data-id="${p.id}">Desativar</button>`
                            : `<button class="btn-aprovar btn-acao-tabela" data-acao="ativar" data-id="${p.id}">Ativar</button>`}
                    </div>
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
            if (acao === "editar") abrirEdicao(id);
            if (acao === "salvar-estoque") salvarEstoque(id);
        });
    });
}

async function salvarEstoque(id) {
    const input = document.querySelector(`.input-estoque-inline[data-id="${id}"]`);
    const novoEstoque = Number(input.value);

    try {
        const resultado = await window.api.atualizarEstoqueProduto(id, petshopIdAtual, novoEstoque);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Estoque atualizado!");
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao atualizar estoque:", erro);
        mostrarNotificacao("Erro ao atualizar estoque.", false);
    }
}

async function alterarStatus(id, ativar) {
    const confirmado = await confirmarAcao({
        titulo: ativar ? "Ativar produto" : "Desativar produto",
        mensagem: ativar
            ? "O produto volta a aparecer disponível para venda. Deseja continuar?"
            : "O produto deixa de aparecer disponível para venda. Deseja continuar?",
        textoConfirmar: ativar ? "Ativar" : "Desativar",
        perigo: !ativar
    });
    if (!confirmado) return;

    try {
        const resultado = ativar
            ? await window.api.ativarProduto(id, petshopIdAtual)
            : await window.api.desativarProduto(id, petshopIdAtual);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(ativar ? "Produto ativado." : "Produto desativado.");
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao alterar status do produto:", erro);
        mostrarNotificacao("Erro ao alterar status do produto.", false);
    }
}

function fecharModal() {
    const overlay = document.getElementById("overlay-produto");
    if (overlay) overlay.remove();
}

function templateFormulario(p) {
    const opcoesCategorias = categoriasCache.map((c) => `
        <option value="${c.id}" ${p?.categoria_id === c.id ? "selected" : ""}>${c.nome}</option>
    `).join("");

    return `
        <div class="grupo-formulario">
            <label>Nome do Produto:</label>
            <input type="text" id="produtoNome" value="${p?.nome || ""}" class="input-formulario" required>
        </div>
        <div class="grupo-formulario">
            <label>Descrição:</label>
            <textarea id="produtoDescricao" class="textarea-formulario">${p?.descricao || ""}</textarea>
        </div>
        <div class="grupo-formulario">
            <label>Categoria:</label>
            <select id="produtoCategoria" class="input-formulario select-formulario-edicao">
                <option value="">Sem categoria</option>
                ${opcoesCategorias}
            </select>
        </div>
        <div class="grupo-formulario">
            <label>Preço (R$):</label>
            <input type="number" min="0" step="0.01" id="produtoPreco" value="${p?.preco ?? ""}" class="input-formulario" required>
        </div>
        ${!p ? `
            <div class="grupo-formulario">
                <label>Estoque Inicial:</label>
                <input type="number" min="0" id="produtoEstoque" value="0" class="input-formulario">
            </div>
        ` : ""}
        <button id="btnSalvarProduto" class="btn-editar" style="width:100%; margin-top:10px;">${p ? "Salvar Alterações" : "Cadastrar Produto"}</button>
    `;
}

function abrirModal(titulo, conteudoHtml, aoSalvar) {
    fecharModal();

    const overlay = document.createElement("div");
    overlay.id = "overlay-produto";
    overlay.className = "overlay-confirmacao";
    overlay.innerHTML = `
        <div class="card-confirmacao card-formulario-modal">
            <button type="button" class="btn-fechar-modal" id="btnFecharModalProduto">✕</button>
            <h3>${titulo}</h3>
            ${conteudoHtml}
        </div>
    `;

    overlay.addEventListener("click", (evento) => {
        if (evento.target === overlay) fecharModal();
    });
    document.body.appendChild(overlay);

    document.getElementById("btnFecharModalProduto").addEventListener("click", fecharModal);
    document.getElementById("btnSalvarProduto").addEventListener("click", aoSalvar);
}

function abrirCadastro() {
    abrirModal("Novo Produto", templateFormulario(null), salvarNovo);
}

function abrirEdicao(id) {
    const produto = listaAtual.find((p) => p.id === id);
    if (!produto) return;
    abrirModal("Editar Produto", templateFormulario(produto), () => salvarEdicao(id));
}

function lerFormulario() {
    return {
        nome: document.getElementById("produtoNome").value,
        descricao: document.getElementById("produtoDescricao").value,
        categoriaId: document.getElementById("produtoCategoria").value ? Number(document.getElementById("produtoCategoria").value) : null,
        preco: document.getElementById("produtoPreco").value
    };
}

async function salvarNovo() {
    const dados = lerFormulario();
    dados.estoque = document.getElementById("produtoEstoque").value;

    if (!dados.nome.trim() || dados.preco === "") {
        mostrarNotificacao("Preencha nome e preço do produto.", false);
        return;
    }

    try {
        const resultado = await window.api.cadastrarProduto(petshopIdAtual, dados);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Produto cadastrado com sucesso!");
        fecharModal();
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao cadastrar produto:", erro);
        mostrarNotificacao("Erro ao cadastrar produto.", false);
    }
}

async function salvarEdicao(id) {
    const dados = lerFormulario();

    if (!dados.nome.trim() || dados.preco === "") {
        mostrarNotificacao("Preencha nome e preço do produto.", false);
        return;
    }

    try {
        const resultado = await window.api.editarProduto(id, petshopIdAtual, dados);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Produto atualizado com sucesso!");
        fecharModal();
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao editar produto:", erro);
        mostrarNotificacao("Erro ao editar produto.", false);
    }
}
