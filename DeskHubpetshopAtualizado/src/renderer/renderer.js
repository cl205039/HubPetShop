import { iniciarTelaLogin, exibirTelaLogin } from "./pages/login.js";
import { montarPaginaPetshops } from "./pages/petshops.js";
import { montarPaginaUsuarios } from "./pages/usuarios.js";
import { montarPaginaPedidosAdmin } from "./pages/pedidosAdmin.js";
import { montarPaginaAgendamentosAdmin } from "./pages/agendamentosAdmin.js";
import { montarDashboardAdmin } from "./pages/dashboardAdmin.js";
import { montarDashboardPetshop } from "./pages/dashboardPetshop.js";
import { montarPaginaProdutos } from "./pages/produtos.js";
import { montarPaginaServicos } from "./pages/servicos.js";
import { montarPaginaPedidosPetshop, pararAtualizacaoPedidosPetshop } from "./pages/pedidosPetshop.js";
import { montarPaginaAgendamentosPetshop } from "./pages/agendamentosPetshop.js";
import { montarPaginaPerfil } from "./pages/perfil.js";
import { montarPaginaRelatorios } from "./pages/relatorios.js";
import { montarPaginaRelatoriosPetshop } from "./pages/relatoriosPetshop.js";
import { iniciarTelaCadastro } from "./pages/cadastroPetshop.js";
import { configurarTogglesSenha } from "./shared/ui.js";

// Sessão do usuário logado (preenchida após login bem-sucedido)
let sessaoAtual = null;
let timerInatividade = null;
const TIMEOUT_INATIVIDADE_MS = 60 * 60 * 1000;

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
    pararAtualizacaoPedidosPetshop();

    switch (nome) {
        case "dashboard":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarDashboardPetshop(container, sessaoAtual.nome);
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
            await montarPaginaProdutos(container);
            break;
        case "pedidos":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarPaginaPedidosPetshop(container);
            } else {
                await montarPaginaPedidosAdmin(container);
            }
            break;
        case "servicos":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarPaginaServicos(container);
            } else {
                await montarPaginaAgendamentosAdmin(container);
            }
            break;
        case "agendamentos":
            await montarPaginaAgendamentosPetshop(container);
            break;
        case "perfil":
            await montarPaginaPerfil(container);
            break;
        case "relatorios":
            if (sessaoAtual && sessaoAtual.tipo === "petshop") {
                await montarPaginaRelatoriosPetshop(container);
            } else {
                await montarPaginaRelatorios(container);
            }
            break;
    }
}

// Páginas restritas por papel.
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

        if (pagina === "servicos") {
            botao.innerText = papel === "petshop" ? "Serviços" : "Agenda";
        }
    });
}

// Liga os cliques do menu (chamada uma vez, no DOMContentLoaded).
function configurarCliquesMenu() {
    const botoes = document.querySelectorAll(".menu-btn");
    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            if (!sessaoAtual) return;
            botoes.forEach(btn => btn.classList.remove("active"));
            botao.classList.add("active");
            carregarPagina(botao.dataset.page);
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
        document.addEventListener(evento, () => {
            if (sessaoAtual) reiniciarTimerInatividade();
        });
    });
}

function encerrarSessao(mensagemAviso) {
    pararTimerInatividade();
    pararAtualizacaoPedidosPetshop();
    sessaoAtual = null;
    window.api.logout();
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
    configurarCliquesMenu();
    monitorarAtividade();

    const btnSair = document.getElementById("btnSairSidebar");
    btnSair.addEventListener("click", () => encerrarSessao());
});
