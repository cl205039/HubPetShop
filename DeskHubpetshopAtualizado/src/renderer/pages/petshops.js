import { mostrarNotificacao } from "../shared/notificacao.js";
import { criarBadgeStatus } from "../shared/ui.js";
import { confirmarAcao } from "../shared/confirmacao.js";
import { paginar, renderizarControlesPaginacao, ligarControlesPaginacao } from "../shared/paginacao.js";

const ITENS_POR_PAGINA = 10;

let filtroBusca = "";
let filtroStatus = "todos";
let listaAtual = [];
let paginaAtual = 1;

function statusDoPetshop(p) {
    if (p.bloqueado) return "Bloqueado";
    if (p.aprovado) return "Aprovado";
    return "Pendente";
}

function formatarCnpj(valor) {
    const digitos = (valor || "").replace(/\D/g, "");
    if (!digitos) return "—";
    if (digitos.length !== 14) return valor;
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

function formatarTelefone(valor) {
    const digitos = (valor || "").replace(/\D/g, "");
    if (!digitos) return "—";
    if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    return valor;
}

export async function montarPaginaPetshops(container) {
    container.innerHTML = `
        <div id="painel-lateral-petshop" class="painel-lateral">
            <button id="btnFecharPainelPetshop">✕ Fechar</button>
            <div id="conteudo-lateral-petshop"></div>
        </div>

        <div class="painel">
            <div class="topo-tabela-container">
                <input type="text" id="buscaPetshop" class="input-busca-moderno" placeholder="Buscar por nome ou CNPJ..." value="${filtroBusca}">
                <select id="filtroStatusPetshop" class="select-filtro">
                    <option value="todos" ${filtroStatus === "todos" ? "selected" : ""}>Todos os Status</option>
                    <option value="pendente" ${filtroStatus === "pendente" ? "selected" : ""}>Pendentes</option>
                    <option value="aprovado" ${filtroStatus === "aprovado" ? "selected" : ""}>Aprovados</option>
                    <option value="bloqueado" ${filtroStatus === "bloqueado" ? "selected" : ""}>Bloqueados</option>
                </select>
            </div>
            <table class="tabela-sem-quebra tabela-petshops">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>CNPJ</th>
                        <th>Telefone</th>
                        <th>Tipo</th>
                        <th>Status</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody id="tabela-petshops-corpo"></tbody>
            </table>
            <div id="paginacao-petshops"></div>
        </div>
    `;

    document.getElementById("btnFecharPainelPetshop").addEventListener("click", fecharPainel);

    const inputBusca = document.getElementById("buscaPetshop");
    const selectStatus = document.getElementById("filtroStatusPetshop");
    inputBusca.addEventListener("input", () => {
        filtroBusca = inputBusca.value;
        paginaAtual = 1;
        carregarLista();
    });
    selectStatus.addEventListener("change", () => {
        filtroStatus = selectStatus.value;
        paginaAtual = 1;
        carregarLista();
    });

    await carregarLista();
}

async function carregarLista() {
    const tbody = document.getElementById("tabela-petshops-corpo");
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="6">Carregando...</td></tr>`;

    try {
        listaAtual = await window.api.listarPetshops({ busca: filtroBusca, status: filtroStatus });
        renderizarTabela();
    } catch (erro) {
        console.error("Erro ao carregar petshops:", erro);
        tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Erro ao carregar parceiros do banco.</td></tr>`;
    }
}

function botoesAcaoStatus(status, id) {
    if (status === "Pendente") {
        return `<button class="btn-aprovar btn-acao-tabela" data-acao="aprovar" data-id="${id}">✅ Aprovar</button>`;
    }
    if (status === "Aprovado") {
        return `<button class="btn-cinza-discreto btn-acao-tabela" data-acao="bloquear" data-id="${id}">Bloquear</button>`;
    }
    return `<button class="btn-aprovar btn-acao-tabela" data-acao="desbloquear" data-id="${id}">✅ Desbloquear</button>`;
}

function renderizarTabela() {
    const tbody = document.getElementById("tabela-petshops-corpo");
    const areaPaginacao = document.getElementById("paginacao-petshops");
    if (!tbody) return;

    if (listaAtual.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Nenhum parceiro encontrado.</td></tr>`;
        areaPaginacao.innerHTML = "";
        return;
    }

    const { itens, totalPaginas, totalItens } = paginar(listaAtual, paginaAtual, ITENS_POR_PAGINA);

    tbody.innerHTML = itens.map((p) => {
        const status = statusDoPetshop(p);

        return `
            <tr>
                <td class="celula-truncar" title="${p.nome || "Sem Nome"}"><strong>${p.nome || "Sem Nome"}</strong></td>
                <td>${formatarCnpj(p.cnpj)}</td>
                <td>${formatarTelefone(p.telefone)}</td>
                <td class="celula-truncar" title="${p.tipo || "Pet Shop"}">${p.tipo || "Pet Shop"}</td>
                <td>${criarBadgeStatus(status)}</td>
                <td>
                    ${botoesAcaoStatus(status, p.id)}
                    <button class="btn-roxo-discreto btn-acao-tabela" data-acao="detalhes" data-id="${p.id}">Detalhes</button>
                    <button class="btn-roxo-discreto btn-acao-tabela" data-acao="editar" data-id="${p.id}">Editar</button>
                </td>
            </tr>
        `;
    }).join("");

    tbody.querySelectorAll("button[data-acao]").forEach((botao) => {
        const id = Number(botao.dataset.id);
        const acao = botao.dataset.acao;
        botao.addEventListener("click", () => {
            if (acao === "aprovar") aprovar(id);
            if (acao === "bloquear") bloquear(id);
            if (acao === "desbloquear") desbloquear(id);
            if (acao === "detalhes") abrirDetalhes(id);
            if (acao === "editar") abrirEdicao(id);
        });
    });

    areaPaginacao.innerHTML = renderizarControlesPaginacao(paginaAtual, totalPaginas, totalItens);
    ligarControlesPaginacao(areaPaginacao, (novaPagina) => {
        paginaAtual = novaPagina;
        renderizarTabela();
    });
}

async function aprovar(id) {
    try {
        const resultado = await window.api.aprovarPetshop(id);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Parceiro aprovado com sucesso!");
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao aprovar petshop:", erro);
        mostrarNotificacao("Erro ao aprovar parceiro.", false);
    }
}

async function bloquear(id) {
    const confirmado = await confirmarAcao({
        titulo: "Bloquear parceiro",
        mensagem: "O parceiro perde o acesso ao sistema imediatamente. Deseja continuar?",
        textoConfirmar: "Bloquear",
        perigo: true
    });
    if (!confirmado) return;

    try {
        const resultado = await window.api.bloquearPetshop(id);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Parceiro bloqueado.");
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao bloquear petshop:", erro);
        mostrarNotificacao("Erro ao bloquear parceiro.", false);
    }
}

async function desbloquear(id) {
    const confirmado = await confirmarAcao({
        titulo: "Desbloquear parceiro",
        mensagem: "O parceiro volta a ter acesso ao sistema. Deseja continuar?",
        textoConfirmar: "Desbloquear"
    });
    if (!confirmado) return;

    try {
        const resultado = await window.api.desbloquearPetshop(id);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Parceiro desbloqueado.");
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao desbloquear petshop:", erro);
        mostrarNotificacao("Erro ao desbloquear parceiro.", false);
    }
}

function fecharPainel() {
    const lateral = document.getElementById("painel-lateral-petshop");
    if (lateral) lateral.classList.remove("ativo");
}

async function abrirDetalhes(id) {
    const lateral = document.getElementById("painel-lateral-petshop");
    const conteudo = document.getElementById("conteudo-lateral-petshop");
    conteudo.innerHTML = "<p>Carregando detalhes...</p>";
    lateral.classList.add("ativo");

    try {
        const p = await window.api.obterPetshopDetalhes(id);
        if (!p) {
            conteudo.innerHTML = "<p>Parceiro não encontrado.</p>";
            return;
        }

        const horariosHtml = p.horarios.length === 0
            ? "<p>Sem horários de funcionamento cadastrados.</p>"
            : p.horarios.map((h) => `<p><strong>${h.dia_nome}:</strong> ${h.fechado ? "Fechado" : `${h.hora_abertura || "?"} às ${h.hora_fechamento || "?"}`}</p>`).join("");

        const avaliacoesHtml = p.avaliacoes.length === 0
            ? "<p>Nenhuma avaliação ainda.</p>"
            : p.avaliacoes.map((a) => `<p>⭐ ${a.nota} — <strong>${a.usuario_nome || "Cliente"}</strong>: ${a.comentario || "(sem comentário)"}</p>`).join("");

        conteudo.innerHTML = `
            <div class="header-lateral-detalhes"><h2>${p.nome}</h2></div>

            <div class="secao-detalhes-lateral">
                <h3 class="titulo-secao-detalhes">📋 Dados Gerais</h3>
                <p><strong>Status:</strong> ${statusDoPetshop(p)}</p>
                <p><strong>E-mail:</strong> ${p.email}</p>
                <p><strong>CNPJ:</strong> ${formatarCnpj(p.cnpj)}</p>
                <p><strong>Telefone:</strong> ${formatarTelefone(p.telefone)}</p>
                <p><strong>Tipo:</strong> ${p.tipo || "Não informado"}</p>
                <p><strong>Descrição:</strong> ${p.descricao || "Sem descrição."}</p>
                <p><strong>Cadastrado em:</strong> ${p.criado_em ? new Date(p.criado_em).toLocaleDateString("pt-BR") : "Não informado"}</p>
            </div>

            <div class="secao-detalhes-lateral">
                <h3 class="titulo-secao-detalhes">📍 Endereço</h3>
                <p>${p.rua || "Sem rua"}, ${p.numero || "S/N"} — ${p.bairro || ""}</p>
                <p>${p.cidade || ""} / ${p.estado || ""} — CEP ${p.cep || "Não informado"}</p>
            </div>

            <div class="secao-detalhes-lateral">
                <h3 class="titulo-secao-detalhes">🕒 Horários de Funcionamento</h3>
                ${horariosHtml}
            </div>

            <div class="secao-detalhes-lateral">
                <h3 class="titulo-secao-detalhes">⭐ Avaliações (${p.quantidadeAvaliacoes}, média ${p.mediaAvaliacoes.toFixed(1)})</h3>
                ${avaliacoesHtml}
            </div>
        `;
    } catch (erro) {
        console.error("Erro ao carregar detalhes do petshop:", erro);
        conteudo.innerHTML = "<p style='color:red;'>Erro ao carregar detalhes.</p>";
    }
}

function abrirEdicao(id) {
    const p = listaAtual.find((item) => item.id === id);
    if (!p) return;

    const lateral = document.getElementById("painel-lateral-petshop");
    const conteudo = document.getElementById("conteudo-lateral-petshop");

    conteudo.innerHTML = `
        <h2>${p.nome || "Editar Parceiro"}</h2>
        <p><strong>ID da Conta:</strong> #${p.id}</p>

        <h3 class="divisor-formulario">🔒 Dados de Acesso (Somente Leitura)</h3>
        <div class="grupo-formulario">
            <label>CNPJ:</label>
            <input type="text" id="editCnpj" value="${formatarCnpj(p.cnpj)}" class="input-formulario input-bloqueado" readonly>
        </div>
        <div class="grupo-formulario">
            <label>E-mail:</label>
            <input type="text" id="editEmail" value="${p.email || ""}" class="input-formulario input-bloqueado" readonly>
        </div>

        <h3 class="divisor-formulario">📝 Dados Gerais</h3>
        <div class="grupo-formulario">
            <label>Nome do Estabelecimento:</label>
            <input type="text" id="editNome" value="${p.nome || ""}" class="input-formulario">
        </div>
        <div class="grupo-formulario">
            <label>Telefone Comercial:</label>
            <input type="text" id="editTelefone" value="${p.telefone || ""}" class="input-formulario">
        </div>
        <div class="grupo-formulario">
            <label>Tipo de Estabelecimento:</label>
            <input type="text" id="editTipo" value="${p.tipo || ""}" class="input-formulario" placeholder="Ex.: Pet Shop, Clínica Veterinária, Creche Pet...">
        </div>
        <div class="grupo-formulario">
            <label>Descrição:</label>
            <textarea id="editDescricao" class="textarea-formulario">${p.descricao || ""}</textarea>
        </div>

        <h3 class="divisor-formulario">📍 Endereço</h3>
        <div class="grupo-formulario">
            <label>CEP:</label>
            <input type="text" id="editCep" value="${p.cep || ""}" class="input-formulario">
        </div>
        <div class="grupo-formulario">
            <label>Rua:</label>
            <input type="text" id="editRua" value="${p.rua || ""}" class="input-formulario">
        </div>
        <div class="grupo-formulario">
            <label>Número:</label>
            <input type="text" id="editNumero" value="${p.numero || ""}" class="input-formulario">
        </div>
        <div class="grupo-formulario">
            <label>Bairro:</label>
            <input type="text" id="editBairro" value="${p.bairro || ""}" class="input-formulario">
        </div>
        <div class="grupo-formulario">
            <label>Cidade:</label>
            <input type="text" id="editCidade" value="${p.cidade || ""}" class="input-formulario">
        </div>
        <div class="grupo-formulario">
            <label>Estado (UF):</label>
            <input type="text" id="editEstado" value="${p.estado || ""}" class="input-formulario" maxlength="2">
        </div>

        <button id="btnSalvarPetshop" class="btn-editar btn-salvar-lateral">Salvar Alterações</button>
    `;

    document.getElementById("btnSalvarPetshop").addEventListener("click", () => salvar(id));

    lateral.classList.add("ativo");
    setTimeout(() => {
        const campoNome = document.getElementById("editNome");
        if (campoNome) {
            campoNome.focus();
            campoNome.select();
        }
    }, 350);
}

async function salvar(id) {
    const dados = {
        nome: document.getElementById("editNome").value,
        telefone: document.getElementById("editTelefone").value,
        tipo: document.getElementById("editTipo").value,
        descricao: document.getElementById("editDescricao").value,
        endereco: {
            cep: document.getElementById("editCep").value,
            rua: document.getElementById("editRua").value,
            numero: document.getElementById("editNumero").value,
            bairro: document.getElementById("editBairro").value,
            cidade: document.getElementById("editCidade").value,
            estado: document.getElementById("editEstado").value
        }
    };

    try {
        const resultado = await window.api.salvarPetshop(id, dados);
        if (!resultado.sucesso) throw new Error(resultado.mensagem);
        mostrarNotificacao("Dados do parceiro atualizados com sucesso!");
        fecharPainel();
        await carregarLista();
    } catch (erro) {
        console.error("Erro ao salvar petshop:", erro);
        mostrarNotificacao("Erro ao salvar alterações do parceiro.", false);
    }
}
