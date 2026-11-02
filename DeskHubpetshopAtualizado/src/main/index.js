const { app, BrowserWindow, Menu, dialog, ipcMain, Tray, nativeImage } = require("electron");
const path = require("path");
const fs = require("fs/promises");
const pool = require("./db/database");
const auth = require("./db/auth");
const admin = require("./db/admin");
const petshop = require("./db/petshop");

const CAMINHO_LOGO = path.join(__dirname, "../../../Logos/logopata.png");
const INTERVALO_VERIFICACAO_BADGE_MS = 60 * 1000;

let janelaPrincipal = null;
let tray = null;

function criarJanela() {
    const janela = new BrowserWindow({
        width: 1400,
        height: 900,
        icon: CAMINHO_LOGO,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    });

    // Fechar a janela minimiza para a bandeja.
    janela.on("close", (evento) => {
        if (!app.isQuitting) {
            evento.preventDefault();
            janela.hide();
        }
    });

    janela.loadFile(path.join(__dirname, "../renderer/index.html"));

    return janela;
}

function criarTray() {
    const icone = nativeImage.createFromPath(CAMINHO_LOGO).resize({ width: 16, height: 16 });
    tray = new Tray(icone);
    tray.setToolTip("HubPet Shop");

    tray.setContextMenu(Menu.buildFromTemplate([
        { label: "Abrir HubPet Shop", click: () => mostrarJanelaPrincipal() },
        { type: "separator" },
        { label: "Sair", click: () => { app.isQuitting = true; app.quit(); } }
    ]));

    tray.on("click", () => mostrarJanelaPrincipal());
    tray.on("double-click", () => mostrarJanelaPrincipal());
}

function mostrarJanelaPrincipal() {
    if (!janelaPrincipal) return;
    if (janelaPrincipal.isMinimized()) janelaPrincipal.restore();
    janelaPrincipal.show();
    janelaPrincipal.focus();
}

// Verifica petshops pendentes e atualiza o tooltip da bandeja.
async function atualizarBadgePetshopsPendentes() {
    if (!tray) return;

    try {
        const dashboard = await admin.obterDashboardAdmin();
        const pendentes = dashboard.petshopsPendentes;

        tray.setToolTip(pendentes > 0
            ? `HubPet Shop — ${pendentes} petshop(s) pendente(s)`
            : "HubPet Shop");
    } catch (erro) {
        console.error("Erro ao atualizar tooltip de petshops pendentes:", erro);
    }
}

function criarMenuNativo() {
    const template = [
        {
            label: "Arquivo",
            submenu: [{ role: "quit", label: "Sair" }]
        },
        {
            label: "Editar",
            submenu: [
                { role: "undo", label: "Desfazer" },
                { role: "redo", label: "Refazer" },
                { type: "separator" },
                { role: "cut", label: "Recortar" },
                { role: "copy", label: "Copiar" },
                { role: "paste", label: "Colar" },
                { role: "selectAll", label: "Selecionar tudo" }
            ]
        },
        {
            label: "Ver",
            submenu: [
                { role: "reload", label: "Recarregar" },
                ...(app.isPackaged ? [] : [{ role: "toggledevtools", label: "Ferramentas do desenvolvedor" }]),
                { type: "separator" },
                { role: "resetzoom", label: "Zoom padrão" },
                { role: "zoomin", label: "Aumentar zoom" },
                { role: "zoomout", label: "Diminuir zoom" },
                { type: "separator" },
                { role: "togglefullscreen", label: "Tela cheia" }
            ]
        },
        {
            label: "Ajuda",
            submenu: [
                {
                    label: "Sobre o HubPet Shop",
                    click: () => {
                        dialog.showMessageBox({
                            title: "Sobre",
                            message: "HubPet Shop — Painel de Gestão",
                            detail: "Desktop de administração e petshops.\nVersão 1.0.0"
                        });
                    }
                }
            ]
        }
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// Sessão do usuário logado (preenchida no login, limpa no logout).
let sessao = null;

const ADMIN = ["admin"];
const PETSHOP = ["petshop"];
const ADMIN_OU_PETSHOP = ["admin", "petshop"];

function exigirPerfil(perfis) {
    if (!sessao || !perfis.includes(sessao.tipo)) {
        throw new Error("Acesso negado.");
    }
}

function handlerConsulta(canal, fn, valorPadrao, perfis) {
    ipcMain.handle(canal, async (_event, ...args) => {
        try {
            exigirPerfil(perfis);
            return await fn(...args);
        } catch (erro) {
            console.error(`Erro em ${canal}:`, erro);
            return valorPadrao;
        }
    });
}

function handlerMutacao(canal, fn, mensagemErro, perfis) {
    ipcMain.handle(canal, async (_event, ...args) => {
        try {
            exigirPerfil(perfis);
            await fn(...args);
            return { sucesso: true };
        } catch (erro) {
            console.error(`Erro em ${canal}:`, erro);
            return { sucesso: false, mensagem: erro.mensagemParaUsuario || mensagemErro };
        }
    });
}

function registrarHandlersAdmin() {
    handlerConsulta("listarPetshops", admin.listarPetshops, [], ADMIN);
    handlerConsulta("obterPetshopDetalhes", admin.obterPetshopDetalhes, null, ADMIN);
    handlerMutacao("aprovarPetshop", admin.aprovarPetshop, "Erro ao aprovar petshop.", ADMIN);
    handlerMutacao("bloquearPetshop", admin.bloquearPetshop, "Erro ao bloquear petshop.", ADMIN);
    handlerMutacao("desbloquearPetshop", admin.desbloquearPetshop, "Erro ao desbloquear petshop.", ADMIN);
    handlerMutacao("salvarPetshop", ({ id, dados }) => admin.salvarPetshop(id, dados), "Erro ao salvar alterações do petshop.", ADMIN);

    handlerConsulta("listarUsuarios", admin.listarUsuarios, [], ADMIN);
    handlerConsulta("obterPetsUsuario", admin.obterPetsUsuario, [], ADMIN);
    handlerMutacao("ativarUsuario", admin.ativarUsuario, "Erro ao ativar usuário.", ADMIN);
    handlerMutacao("desativarUsuario", admin.desativarUsuario, "Erro ao desativar usuário.", ADMIN);

    handlerConsulta("listarPedidos", admin.listarPedidos, [], ADMIN);
    handlerConsulta("obterItensPedido", admin.obterItensPedido, [], ADMIN);
    handlerConsulta("obterEnderecoUsuario", petshop.obterEnderecoPrincipalUsuario, null, ADMIN);
    handlerMutacao("atualizarStatusPedido", ({ id, etapa, motivo }) => admin.atualizarStatusPedido(id, etapa, motivo),
        "Erro ao atualizar status do pedido.", ADMIN);

    handlerConsulta("listarAgendamentos", admin.listarAgendamentos, [], ADMIN);
    handlerMutacao("atualizarStatusAgendamento", ({ id, status }) => admin.atualizarStatusAgendamento(id, status),
        "Erro ao atualizar status do agendamento.", ADMIN);

    handlerConsulta("obterDashboardAdmin", admin.obterDashboardAdmin, null, ADMIN);

    registrarHandlersPetshop();
}

// Canais do petshop: sempre usam o id da sessão.
function registrarHandlersPetshop() {
    handlerConsulta("obterDashboardPetshop", () => petshop.obterDashboardPetshop(sessao.id), null, PETSHOP);
    handlerConsulta("listarCategorias", petshop.listarCategorias, [], PETSHOP);

    handlerConsulta("listarProdutos", (filtros) => petshop.listarProdutos(sessao.id, filtros), [], PETSHOP);
    handlerMutacao("cadastrarProduto", (dados) => petshop.cadastrarProduto(sessao.id, dados), "Erro ao cadastrar produto.", PETSHOP);
    handlerMutacao("editarProduto", ({ id, dados }) => petshop.editarProduto(id, sessao.id, dados), "Erro ao editar produto.", PETSHOP);
    handlerMutacao("ativarProduto", (id) => petshop.ativarProduto(id, sessao.id), "Erro ao ativar produto.", PETSHOP);
    handlerMutacao("desativarProduto", (id) => petshop.desativarProduto(id, sessao.id), "Erro ao desativar produto.", PETSHOP);
    handlerMutacao("atualizarEstoqueProduto", ({ id, estoque }) => petshop.atualizarEstoqueProduto(id, sessao.id, estoque),
        "Erro ao atualizar estoque.", PETSHOP);

    handlerConsulta("listarServicos", (filtros) => petshop.listarServicos(sessao.id, filtros), [], PETSHOP);
    handlerMutacao("cadastrarServico", (dados) => petshop.cadastrarServico(sessao.id, dados), "Erro ao cadastrar serviço.", PETSHOP);
    handlerMutacao("editarServico", ({ id, dados }) => petshop.editarServico(id, sessao.id, dados), "Erro ao editar serviço.", PETSHOP);
    handlerMutacao("ativarServico", (id) => petshop.ativarServico(id, sessao.id), "Erro ao ativar serviço.", PETSHOP);
    handlerMutacao("desativarServico", (id) => petshop.desativarServico(id, sessao.id), "Erro ao desativar serviço.", PETSHOP);

    handlerConsulta("listarPedidosPetshop", (filtros) => petshop.listarPedidos(sessao.id, filtros), [], PETSHOP);
    handlerConsulta("obterItensPedidoPetshop", (pedidoId) => petshop.obterItensPedido(pedidoId, sessao.id), [], PETSHOP);
    handlerMutacao("atualizarStatusPedidoPetshop", ({ id, etapa, motivo }) => petshop.atualizarStatusPedido(id, sessao.id, etapa, motivo),
        "Erro ao atualizar status do pedido.", PETSHOP);

    handlerConsulta("listarAgendamentosPetshop", (filtros) => petshop.listarAgendamentos(sessao.id, filtros), [], PETSHOP);
    handlerConsulta("obterAgendaDoDia", (data) => petshop.obterAgendaDoDia(sessao.id, data), null, PETSHOP);
    handlerMutacao("atualizarStatusAgendamentoPetshop", ({ id, status }) => petshop.atualizarStatusAgendamento(id, sessao.id, status),
        "Erro ao atualizar status do agendamento.", PETSHOP);

    handlerConsulta("obterPerfilPetshop", () => petshop.obterPerfil(sessao.id), null, PETSHOP);
    handlerMutacao("salvarPerfilPetshop", (dados) => petshop.salvarPerfil(sessao.id, dados), "Erro ao salvar perfil.", PETSHOP);
    handlerMutacao("salvarHorariosPetshop", (horarios) => petshop.salvarHorariosFuncionamento(sessao.id, horarios),
        "Erro ao salvar horários.", PETSHOP);

    handlerConsulta("obterEnderecoUsuarioPetshop", async (usuarioId) => {
        const [pedidos] = await pool.query(
            "SELECT 1 FROM pedidos WHERE usuario_id = ? AND petshop_id = ? LIMIT 1",
            [usuarioId, sessao.id]
        );
        return pedidos.length > 0 ? petshop.obterEnderecoPrincipalUsuario(usuarioId) : null;
    }, null, PETSHOP);
}

function registrarHandlersRelatorios() {
    handlerConsulta("obterRelatorioVendas", admin.obterRelatorioVendas, null, ADMIN);

    ipcMain.handle("exportarRelatorioPDF", async (event) => {
        try {
            exigirPerfil(ADMIN_OU_PETSHOP);
            const janela = BrowserWindow.fromWebContents(event.sender);
            const buffer = await janela.webContents.printToPDF({ printBackground: true });

            const { canceled, filePath } = await dialog.showSaveDialog(janela, {
                title: "Salvar relatório em PDF",
                defaultPath: `relatorio-hubpet-${Date.now()}.pdf`,
                filters: [{ name: "PDF", extensions: ["pdf"] }]
            });

            if (canceled || !filePath) {
                return { sucesso: false, cancelado: true };
            }

            await fs.writeFile(filePath, buffer);
            return { sucesso: true, caminho: filePath };
        } catch (erro) {
            console.error("Erro ao exportar relatório em PDF:", erro);
            return { sucesso: false, mensagem: "Erro ao gerar o PDF." };
        }
    });
}

app.on("before-quit", () => {
    app.isQuitting = true;
});

app.whenReady().then(async () => {
    janelaPrincipal = criarJanela();
    criarMenuNativo();
    criarTray();

    try {
        await pool.query("SELECT 1");
        const { database, port } = pool.pool.config.connectionConfig;
        console.log(`Conectado ao banco ${database} (porta ${port}).`);
    } catch (erro) {
        console.error("Falha ao conectar no banco hubpetshop:", erro.message);
    }

    ipcMain.handle("login", async (_event, credenciais) => {
        try {
            const resultado = await auth.login(credenciais);
            sessao = resultado.sucesso ? resultado.usuario : null;
            return resultado;
        } catch (erro) {
            console.error("Erro no login:", erro);
            sessao = null;
            return { sucesso: false, mensagem: "Erro interno ao tentar entrar. Tente novamente." };
        }
    });

    ipcMain.handle("logout", () => {
        sessao = null;
    });

    ipcMain.handle("cadastrarPetshop", async (_event, dados) => {
        try {
            return await auth.cadastrarPetshop(dados);
        } catch (erro) {
            console.error("Erro ao cadastrar petshop:", erro);
            return { sucesso: false, mensagem: "Erro interno ao cadastrar. Tente novamente." };
        }
    });

    registrarHandlersAdmin();
    registrarHandlersRelatorios();

    atualizarBadgePetshopsPendentes();
    setInterval(atualizarBadgePetshopsPendentes, INTERVALO_VERIFICACAO_BADGE_MS);
});
