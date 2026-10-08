import { iniciarTelaLogin, exibirTelaLogin } from "./pages/login.js";
import { montarPaginaPetshops } from "./pages/petshops.js";
import { montarPaginaUsuarios } from "./pages/usuarios.js";
import { montarPaginaPedidosAdmin } from "./pages/pedidosAdmin.js";
import { montarPaginaAgendamentosAdmin } from "./pages/agendamentosAdmin.js";
import { montarDashboardAdmin } from "./pages/dashboardAdmin.js";
import { montarDashboardPetshop } from "./pages/dashboardPetshop.js";
import { montarPaginaProdutos } from "./pages/produtos.js";
import { montarPaginaServicos } from "./pages/servicos.js";
import { montarPaginaPedidosPetshop } from "./pages/pedidosPetshop.js";
import { montarPaginaAgendamentosPetshop } from "./pages/agendamentosPetshop.js";
import { montarPaginaPerfil } from "./pages/perfil.js";
import { montarPaginaRelatorios } from "./pages/relatorios.js";
import { montarPaginaRelatoriosPetshop } from "./pages/relatoriosPetshop.js";
import { iniciarTelaCadastro } from "./pages/cadastroPetshop.js";
import { configurarTogglesSenha } from "./shared/ui.js";
// Compatibilidade com onclick="..." inline no HTML do dashboard (só o
// dashboard ainda faz isso — os botões "Ver Petshops"/"Ver Relatórios" em
// pages/dashboardAdmin.js). Um <script type="module"> não expõe suas
// declarações em `window` automaticamente, daí a atribuição explícita.
window.carregarPagina = (nome) => carregarPagina(nome);

// Sessão do usuário logado (preenchida após login bem-sucedido)
let sessaoAtual = null;
let timerInatividade = null;
const TIMEOUT_INATIVIDADE_MS = 30 * 60 * 1000; // 30 minutos

function atualizarTitulo(nome) {
    const tituloPagina = document.getElementById("titulo-pagina");
    const ehPetshop = sessaoAtual && sessaoAtual.tipo === "petshop";
    const nomesPaginas = {
        dashboard: "Painel Administrativo",
        petshops: "🏬 Gestão de Parceiros",
        produtos: "📦 Meus Produtos",
        pedidos: ehPetshop ? "📦 Meus Pedidos" : "📦 Lista de Pedidos",
        servicos: ehPetshop ? "🛠️ Meus Serviços" : "🩺 Agenda de Serviços",
        agendamentos: "📅 Meus Agendamentos",
        perfil: "👤 Meu Perfil",
        usuarios: "👥 Usuários e Pets",
        relatorios: "📊 Relatórios Analíticos"
    };
    tituloPagina.innerText = nomesPaginas[nome] || "HubPet";
}

async function carregarPagina(nome) {
    const container = document.getElementById("conteudo-principal");
    atualizarTitulo(nome);

    switch (nome) {
        case "dashboard":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarDashboardPetshop(container, sessaoAtual.id, sessaoAtual.nome);
            } else {
                await montarDashboardAdmin(container);
            }
            break;
        case "petshops":
            await montarPaginaPetshops(container);
            break;
        case "usuarios":
            await montarPaginaUsuarios(container);
            break;
        case "produtos":
            await montarPaginaProdutos(container, sessaoAtual.id);
            break;
        case "pedidos":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarPaginaPedidosPetshop(container, sessaoAtual.id);
            } else {
                await montarPaginaPedidosAdmin(container);
            }
            break;
        case "servicos":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarPaginaServicos(container, sessaoAtual.id);
            } else {
                await montarPaginaAgendamentosAdmin(container);
            }
            break;
        case "agendamentos":
            await montarPaginaAgendamentosPetshop(container, sessaoAtual.id);
            break;
        case "perfil":
            await montarPaginaPerfil(container, sessaoAtual.id);
            break;
        case "relatorios":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarPaginaRelatoriosPetshop(container, sessaoAtual.id);
            } else {
                await montarPaginaRelatorios(container);
            }
            break;
    }
}

// Páginas do menu lateral restritas por papel: petshop não vê gestão de
// outros petshops/usuários; admin não vê o catálogo de produtos do petshop.
// "relatorios" não entra em nenhuma das duas listas de propósito — os dois
// papéis acessam a página, e o case "relatorios" acima decide qual versão
// (própria do petshop vs. agregada do admin) montar.
const PAGINAS_SOMENTE_ADMIN = ["petshops", "usuarios"];
const PAGINAS_SOMENTE_PETSHOP = ["produtos", "agendamentos", "perfil"];

function configurarMenu(papel) {
    const botoes = document.querySelectorAll(".menu-btn");
    botoes.forEach(botao => {
        const pagina = botao.dataset.page;
        const somenteAdmin = PAGINAS_SOMENTE_ADMIN.includes(pagina);
        const somentePetshop = PAGINAS_SOMENTE_PETSHOP.includes(pagina);
        const escondida = (somenteAdmin && papel !== "admin") || (somentePetshop && papel !== "petshop");
        botao.style.display = escondida ? "none" : "";

        // O botão "servicos" aponta pra páginas bem diferentes por papel
        // (agenda geral da plataforma pro admin, catálogo próprio pro
        // petshop) — o rótulo muda junto pra não confundir.
        if (pagina === "servicos") {
            botao.innerText = papel === "petshop" ? "Serviços" : "Agenda";
        }

        botao.addEventListener("click", () => {
            botoes.forEach(btn => btn.classList.remove("active"));
            botao.classList.add("active");
            carregarPagina(pagina);
        });
    });
}

function pararTimerInatividade() {
    if (timerInatividade) {
        clearTimeout(timerInatividade);
        timerInatividade = null;
    }
}

function reiniciarTimerInatividade() {
    pararTimerInatividade();
    timerInatividade = setTimeout(() => {
        encerrarSessao("Sessão expirada por inatividade.");
    }, TIMEOUT_INATIVIDADE_MS);
}

function monitorarAtividade() {
    ["mousemove", "keydown", "click", "scroll"].forEach(evento => {
        document.addEventListener(evento, reiniciarTimerInatividade);
    });
}

function encerrarSessao(mensagemAviso) {
    pararTimerInatividade();
    sessaoAtual = null;
    exibirTelaLogin(mensagemAviso);
}

function iniciarSessao(usuario) {
    sessaoAtual = usuario;

    const appPrincipal = document.getElementById("app-principal");
    appPrincipal.style.display = "flex";

    const nomeSpan = document.getElementById("nome-sessao-atual");
    const avatar = document.getElementById("avatar-sessao-atual");
    const rotuloPapel = usuario.tipo === "admin" ? "Admin" : "Petshop";
    nomeSpan.innerText = `${usuario.nome} (${rotuloPapel})`;
    avatar.innerText = (usuario.nome || "?").trim().charAt(0).toUpperCase();

    configurarMenu(usuario.tipo);
    reiniciarTimerInatividade();
    carregarPagina("dashboard");
}

document.addEventListener("DOMContentLoaded", () => {
    iniciarTelaLogin(iniciarSessao);
    iniciarTelaCadastro();
    configurarTogglesSenha();
    monitorarAtividade();

    const btnSair = document.getElementById("btnSairSidebar");
    btnSair.addEventListener("click", () => encerrarSessao());
});
