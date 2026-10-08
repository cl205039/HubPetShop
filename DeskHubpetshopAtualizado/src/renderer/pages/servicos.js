import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";

const CATEGORIAS_PRESET = ["Banho e Tosa", "Consulta Veterinária", "Hospedagem", "Passeio", "Adestramento"];
const CATEGORIAS_SERVICO = [...CATEGORIAS_PRESET, "Outro"];

let filtroBusca = "";
let filtroCategoria = "todos";
let listaAtual = [];
let petshopIdAtual = null;

export async function montarPaginaServicos(container, petshopId) {
    petshopIdAtual = petshopId;

    const opcoesFiltroCategoria = CATEGORIAS_SERVICO.map((c) => `<option value="${c}">${c}</option>`).join("");

    container.innerHTML = `
        <div class="painel">
            <div class="topo-tabela-container" style="justify-content: space-between; align-items: center;">
                <h2 style="margin:0;">🛠️ Meus Serviços</h2>
                <div style="display:flex; align-items:center; gap:12px;">
                    <span class="contador-pedidos-ativos" id="contadorServicosAtivos">Carregando...</span>
                    <button id="btnNovoServico" class="btn-laranja">+ Novo Serviço</button>
                </div>
            </div>
            <div class="topo-tabela-container">
                <input type="text" id="buscaServicoPetshop" class="input-busca-moderno" placeholder="Buscar por nome..." value="${filtroBusca}">
                <select id="filtroCategoriaServico" class="select-filtro">
                    <option value="todos">Todos</option>
                    ${opcoesFiltroCategoria}
                </select>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Categoria</th>
                        <th>Descrição</th>
                        <th>Preço</th>
                        <th>Duração</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabela-servicos-petshop-corpo">
                    <tr><td colspan="7" style="text-align:center; padding:30px;">Carregando serviços...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    document.getElementById("btnNovoServico").addEventListener("click", abrirCadastro);

    const inputBusca = document.getElementById("buscaServicoPetshop");
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        carregarLista();
    });

    const selectCategoria = document.getElementById("filtroCategoriaServico");
    selectCategoria.addEventListener("change", () => {
        filtroCategoria = selectCategoria.value;
        carregarLista();
    });

    await carregarLista();
}

async function carregarLista() {
    const tbody = document.getElementById("tabela-servicos-petshop-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">Carregando serviços...</td></tr>`;

    try {
        listaAtual = await window.api.listarServicos(petshopIdAtual, { busca: filtroBusca, categoria: filtroCategoria });
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar serviços:", erro);
        tbody.innerHTML = `<tr><td colspan="7" style="color:red; text-align:center; padding:30px;">Erro ao carregar serviços do banco.</td></tr>`;
    }
}

function truncarTexto(texto, tamanho = 60) {
    if (!texto) return "—";
    return texto.length > tamanho ? `${texto.slice(0, tamanho)}…` : texto;
}

function renderizarTabela() {
    const tbody = document.getElementById("tabela-servicos-petshop-corpo");
    if (!tbody) return;

    const ativos = listaAtual.filter((s) => s.ativo).length;
    document.getElementById("contadorServicosAtivos").innerText = `${ativos} serviço(s) ativo(s)`;

    if (listaAtual.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="estado-vazio-tabela">
                        <span class="estado-vazio-icone">🛠️</span>
                        <p>Nenhum serviço cadastrado ainda. Clique em + Novo Serviço para começar.</p>
                        <button id="btnPrimeiroServico" class="btn-laranja">+ Novo Serviço</button>
                    </div>
                </td>
            </tr>
        `;
        document.getElementById("btnPrimeiroServico").addEventListener("click", abrirCadastro);
        return;
    }

    tbody.innerHTML = listaAtual.map((s) => `
        <tr>
            <td><strong>${s.nome}</strong></td>
            <td>${s.categoria || "—"}</td>
            <td>${truncarTexto(s.descricao)}</td>
            <td>R$ ${Number(s.preco).toFixed(2)}</td>
            <td>${s.duracao || "Não informado"}</td>
            <td>${criarBadgeStatus(s.ativo ? "Ativo" : "Inativo")}</td>
            <td>
                <div class="acoes-tabela-linha">
                    <button class="btn-editar btn-acao-tabela" data-acao="editar" data-id="${s.id}">✏️ Editar</button>
                    ${s.ativo
                        ? `<button class="btn-desativar btn-acao-tabela" data-acao="desativar" data-id="${s.id}">🚫 Desativar</button>`
                        : `<button class="btn-aprovar btn-acao-tabela" data-acao="ativar" data-id="${s.id}">✅ Ativar</button>`}
                </div>
            </td>
        </tr>
    `).join("");

    tbody.querySelectorAll("button[data-acao]").forEach((botao) => {
        const id = Number(botao.dataset.id);
        const acao = botao.dataset.acao;
        botao.addEventListener("click", () => {
            if (acao === "ativar") alterarStatus(id, true);
            if (acao === "desativar") alterarStatus(id, false);
            if (acao === "editar") abrirEdicao(id);
        });
    });
}

async function alterarStatus(id, ativar) {
    const confirmado = await confirmarAcao({
        titulo: ativar ? "Ativar serviço" : "Desativar serviço",
        mensagem: ativar
            ? "O serviço volta a ficar disponível para agendamento. Deseja continuar?"
            : "O serviço deixa de ficar disponível para agendamento. Deseja continuar?",
        textoConfirmar: ativar ? "Ativar" : "Desativar",
        perigo: !ativar
    });
    if (!confirmado) return;

    try {
        const resultado = ativar
            ? await window.api.ativarServico(id, petshopIdAtual)
            : await window.api.desativarServico(id, petshopIdAtual);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao(ativar ? "Serviço ativado." : "Serviço desativado.");
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao alterar status do serviço:", erro);
        mostrarNotificacao("Erro ao alterar status do serviço.", false);
    }
}

// =========================
// Validação visual (borda verde/vermelha), mesmo padrão do cadastro de petshop
// =========================
function marcarValido(campo) {
    campo.classList.remove("campo-invalido");
    campo.classList.add("campo-valido");
}

function marcarInvalido(campo) {
    campo.classList.remove("campo-valido");
    campo.classList.add("campo-invalido");
}

function limparValidacao(campo) {
    campo.classList.remove("campo-valido", "campo-invalido");
}

function configurarValidacao(campo, ehValido) {
    const verificar = () => {
        const valor = campo.value.trim();
        if (!valor) {
            limparValidacao(campo);
            return;
        }
        if (ehValido(valor)) marcarValido(campo);
        else marcarInvalido(campo);
    };
    campo.addEventListener("blur", verificar);
    campo.addEventListener("input", verificar);
}

// =========================
// Modal de cadastro/edição
// =========================
function fecharModal() {
    const overlay = document.getElementById("overlay-servico");
    if (overlay) overlay.remove();
}

function templateFormulario(s) {
    const categoriaAtual = s?.categoria || "";
    const ehPreset = CATEGORIAS_PRESET.includes(categoriaAtual);
    const categoriaSelectValue = s ? (ehPreset ? categoriaAtual : "Outro") : "";
    const categoriaOutroValor = s && !ehPreset ? categoriaAtual : "";
    const ativoAtual = s ? !!s.ativo : true;

    const opcoesCategoria = CATEGORIAS_SERVICO.map((c) => `
        <option value="${c}" ${categoriaSelectValue === c ? "selected" : ""}>${c}</option>
    `).join("");

    return `
        <div class="grupo-formulario">
            <label>📋 Nome do Serviço:</label>
            <input type="text" id="servicoNome" value="${s?.nome || ""}" class="input-formulario" required>
        </div>
        <div class="grupo-formulario">
            <label>🏷️ Categoria:</label>
            <select id="servicoCategoria" class="input-formulario select-formulario-edicao">
                <option value="" disabled ${!categoriaSelectValue ? "selected" : ""}>Selecione uma categoria</option>
                ${opcoesCategoria}
            </select>
            <input
                type="text"
                id="servicoCategoriaOutro"
                class="input-formulario"
                style="margin-top:8px; ${categoriaSelectValue === "Outro" ? "" : "display:none;"}"
                placeholder="Digite a categoria personalizada"
                value="${categoriaOutroValor}"
            >
        </div>
        <div class="grupo-formulario">
            <label>💰 Preço (R$):</label>
            <input type="number" min="0" step="0.01" id="servicoPreco" value="${s?.preco ?? ""}" class="input-formulario" required>
        </div>
        <div class="grupo-formulario">
            <label>⏱️ Duração:</label>
            <input type="text" id="servicoDuracao" value="${s?.duracao || ""}" class="input-formulario" placeholder="Ex.: 30 min, 1h, 2h30">
        </div>
        <div class="grupo-formulario">
            <label>📝 Descrição (opcional):</label>
            <textarea id="servicoDescricao" class="textarea-formulario" placeholder="Detalhes sobre o serviço...">${s?.descricao || ""}</textarea>
        </div>
        <div class="grupo-formulario toggle-ativo-wrapper">
            <label class="toggle-switch">
                <input type="checkbox" id="servicoAtivo" ${ativoAtual ? "checked" : ""}>
                <span class="toggle-switch-slider"></span>
            </label>
            <span class="toggle-ativo-label" id="servicoAtivoLabel">${ativoAtual ? "Ativo" : "Inativo"}</span>
        </div>
        <button id="btnSalvarServico" class="btn-laranja" style="width:100%; margin-top:10px;">${s ? "Salvar Alterações" : "Cadastrar Serviço"}</button>
    `;
}

function configurarInteracoesFormulario() {
    const campoNome = document.getElementById("servicoNome");
    const campoCategoria = document.getElementById("servicoCategoria");
    const campoCategoriaOutro = document.getElementById("servicoCategoriaOutro");
    const campoPreco = document.getElementById("servicoPreco");
    const campoAtivo = document.getElementById("servicoAtivo");
    const labelAtivo = document.getElementById("servicoAtivoLabel");

    configurarValidacao(campoNome, (v) => v.length > 0);
    configurarValidacao(campoPreco, (v) => !isNaN(Number(v)) && Number(v) > 0);
    configurarValidacao(campoCategoriaOutro, (v) => v.length > 0);

    campoCategoria.addEventListener("change", () => {
        const ehOutro = campoCategoria.value === "Outro";
        campoCategoriaOutro.style.display = ehOutro ? "block" : "none";
        if (ehOutro) campoCategoriaOutro.focus();
        else limparValidacao(campoCategoriaOutro);

        if (campoCategoria.value) marcarValido(campoCategoria);
        else marcarInvalido(campoCategoria);
    });

    campoAtivo.addEventListener("change", () => {
        labelAtivo.innerText = campoAtivo.checked ? "Ativo" : "Inativo";
    });
}

function abrirModal(titulo, servico, aoSalvar) {
    fecharModal();

    const overlay = document.createElement("div");
    overlay.id = "overlay-servico";
    overlay.className = "overlay-confirmacao";
    overlay.innerHTML = `
        <div class="card-confirmacao card-formulario-modal">
            <button type="button" class="btn-fechar-modal" id="btnFecharModalServico">✕</button>
            <h3>${titulo}</h3>
            ${templateFormulario(servico)}
        </div>
    `;

    overlay.addEventListener("click", (evento) => {
        if (evento.target === overlay) fecharModal();
    });
    document.body.appendChild(overlay);

    document.getElementById("btnFecharModalServico").addEventListener("click", fecharModal);
    configurarInteracoesFormulario();
    document.getElementById("btnSalvarServico").addEventListener("click", aoSalvar);
}

function abrirCadastro() {
    abrirModal("Novo Serviço", null, salvarNovo);
}

function abrirEdicao(id) {
    const servico = listaAtual.find((s) => s.id === id);
    if (!servico) return;
    abrirModal("Editar Serviço", servico, () => salvarEdicao(id));
}

function lerFormulario() {
    const categoriaSelecionada = document.getElementById("servicoCategoria").value;
    const categoriaOutro = document.getElementById("servicoCategoriaOutro").value.trim();
    const categoriaFinal = categoriaSelecionada === "Outro" ? categoriaOutro : categoriaSelecionada;

    return {
        nome: document.getElementById("servicoNome").value.trim(),
        categoria: categoriaFinal || null,
        descricao: document.getElementById("servicoDescricao").value.trim(),
        preco: document.getElementById("servicoPreco").value,
        duracao: document.getElementById("servicoDuracao").value.trim(),
        ativo: document.getElementById("servicoAtivo").checked ? 1 : 0
    };
}

function validarFormulario(dados) {
    if (!dados.nome) {
        mostrarNotificacao("Informe o nome do serviço.", false);
        return false;
    }
    if (!dados.categoria) {
        mostrarNotificacao("Selecione ou informe uma categoria.", false);
        return false;
    }
    if (dados.preco === "" || isNaN(Number(dados.preco)) || Number(dados.preco) <= 0) {
        mostrarNotificacao("Informe um preço válido.", false);
        return false;
    }
    return true;
}

async function salvarNovo() {
    const dados = lerFormulario();
    if (!validarFormulario(dados)) return;

    const botao = document.getElementById("btnSalvarServico");
    botao.disabled = true;
    botao.innerText = "Salvando...";

    try {
        const resultado = await window.api.cadastrarServico(petshopIdAtual, dados);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Serviço cadastrado com sucesso!");
        fecharModal();
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao cadastrar serviço:", erro);
        mostrarNotificacao("Erro ao cadastrar serviço.", false);
        botao.disabled = false;
        botao.innerText = "Cadastrar Serviço";
    }
}

async function salvarEdicao(id) {
    const dados = lerFormulario();
    if (!validarFormulario(dados)) return;

    const botao = document.getElementById("btnSalvarServico");
    botao.disabled = true;
    botao.innerText = "Salvando...";

    try {
        const resultado = await window.api.editarServico(id, petshopIdAtual, dados);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Serviço atualizado com sucesso!");
        fecharModal();
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao editar serviço:", erro);
        mostrarNotificacao("Erro ao editar serviço.", false);
        botao.disabled = false;
        botao.innerText = "Salvar Alterações";
    }
}
