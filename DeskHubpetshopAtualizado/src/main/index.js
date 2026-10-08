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
            nodeIntegration: false
        }
    });

    // Minimizar pro tray em vez de fechar de verdade — só sai mesmo quando
    // o usuário escolhe "Sair" (menu nativo, tray ou Alt+F4 tratado pelo
    // before-quit abaixo).
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

// Confere periodicamente se há petshop pendente e reflete isso só no
// tooltip do tray (sem badge visual sobre o ícone).
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
                { role: "toggledevtools", label: "Ferramentas do desenvolvedor" },
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

function handlerConsulta(canal, fn, valorPadrao) {
    ipcMain.handle(canal, async (_event, ...args) => {
        try {
            return await fn(...args);
        } catch (erro) {
            console.error(`Erro em ${canal}:`, erro);
            return valorPadrao;
        }
    });
}

function handlerMutacao(canal, fn, mensagemErro) {
    ipcMain.handle(canal, async (_event, ...args) => {
        try {
            await fn(...args);
            return { sucesso: true };
        } catch (erro) {
            console.error(`Erro em ${canal}:`, erro);
            return { sucesso: false, mensagem: mensagemErro };
        }
    });
}

function registrarHandlersAdmin() {
    handlerConsulta("listarPetshops", admin.listarPetshops, []);
    handlerConsulta("obterPetshopDetalhes", admin.obterPetshopDetalhes, null);
    handlerMutacao("aprovarPetshop", admin.aprovarPetshop, "Erro ao aprovar petshop.");
    handlerMutacao("bloquearPetshop", admin.bloquearPetshop, "Erro ao bloquear petshop.");
    handlerMutacao("desbloquearPetshop", admin.desbloquearPetshop, "Erro ao desbloquear petshop.");

    ipcMain.handle("salvarPetshop", async (_event, { id, dados }) => {
        try {
            await admin.salvarPetshop(id, dados);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro ao salvar petshop:", erro);
            return { sucesso: false, mensagem: "Erro ao salvar alterações do petshop." };
        }
    });

    handlerConsulta("listarUsuarios", admin.listarUsuarios, []);
    handlerConsulta("obterPetsUsuario", admin.obterPetsUsuario, []);
    handlerMutacao("ativarUsuario", admin.ativarUsuario, "Erro ao ativar usuário.");
    handlerMutacao("desativarUsuario", admin.desativarUsuario, "Erro ao desativar usuário.");

    handlerConsulta("listarPedidos", admin.listarPedidos, []);
    handlerConsulta("obterItensPedido", admin.obterItensPedido, []);
    ipcMain.handle("atualizarStatusPedido", async (_event, { id, etapa }) => {
        try {
            await admin.atualizarStatusPedido(id, etapa);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro ao atualizar status do pedido:", erro);
            return { sucesso: false, mensagem: "Erro ao atualizar status do pedido." };
        }
    });

    handlerConsulta("listarAgendamentos", admin.listarAgendamentos, []);
    ipcMain.handle("atualizarStatusAgendamento", async (_event, { id, status }) => {
        try {
            await admin.atualizarStatusAgendamento(id, status);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro ao atualizar status do agendamento:", erro);
            return { sucesso: false, mensagem: "Erro ao atualizar status do agendamento." };
        }
    });

    handlerConsulta("obterDashboardAdmin", admin.obterDashboardAdmin, null);
    handlerConsulta("obterDashboardPetshop", petshop.obterDashboardPetshop, null);

    registrarHandlersPetshop();
}

function registrarHandlersPetshop() {
    handlerConsulta("listarCategorias", petshop.listarCategorias, []);

    ipcMain.handle("listarProdutos", async (_event, { petshopId, filtros }) => {
        try {
            return await petshop.listarProdutos(petshopId, filtros);
        } catch (erro) {
            console.error("Erro em listarProdutos:", erro);
            return [];
        }
    });

    ipcMain.handle("cadastrarProduto", async (_event, { petshopId, dados }) => {
        try {
            await petshop.cadastrarProduto(petshopId, dados);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em cadastrarProduto:", erro);
            return { sucesso: false, mensagem: "Erro ao cadastrar produto." };
        }
    });

    ipcMain.handle("editarProduto", async (_event, { id, petshopId, dados }) => {
        try {
            await petshop.editarProduto(id, petshopId, dados);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em editarProduto:", erro);
            return { sucesso: false, mensagem: "Erro ao editar produto." };
        }
    });

    ipcMain.handle("ativarProduto", async (_event, { id, petshopId }) => {
        try {
            await petshop.ativarProduto(id, petshopId);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em ativarProduto:", erro);
            return { sucesso: false, mensagem: "Erro ao ativar produto." };
        }
    });

    ipcMain.handle("desativarProduto", async (_event, { id, petshopId }) => {
        try {
            await petshop.desativarProduto(id, petshopId);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em desativarProduto:", erro);
            return { sucesso: false, mensagem: "Erro ao desativar produto." };
        }
    });

    ipcMain.handle("atualizarEstoqueProduto", async (_event, { id, petshopId, estoque }) => {
        try {
            await petshop.atualizarEstoqueProduto(id, petshopId, estoque);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em atualizarEstoqueProduto:", erro);
            return { sucesso: false, mensagem: "Erro ao atualizar estoque." };
        }
    });

    ipcMain.handle("listarServicos", async (_event, { petshopId, filtros }) => {
        try {
            return await petshop.listarServicos(petshopId, filtros);
        } catch (erro) {
            console.error("Erro em listarServicos:", erro);
            return [];
        }
    });

    ipcMain.handle("cadastrarServico", async (_event, { petshopId, dados }) => {
        try {
            await petshop.cadastrarServico(petshopId, dados);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em cadastrarServico:", erro);
            return { sucesso: false, mensagem: "Erro ao cadastrar serviço." };
        }
    });

    ipcMain.handle("editarServico", async (_event, { id, petshopId, dados }) => {
        try {
            await petshop.editarServico(id, petshopId, dados);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em editarServico:", erro);
            return { sucesso: false, mensagem: "Erro ao editar serviço." };
        }
    });

    ipcMain.handle("ativarServico", async (_event, { id, petshopId }) => {
        try {
            await petshop.ativarServico(id, petshopId);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em ativarServico:", erro);
            return { sucesso: false, mensagem: "Erro ao ativar serviço." };
        }
    });

    ipcMain.handle("desativarServico", async (_event, { id, petshopId }) => {
        try {
            await petshop.desativarServico(id, petshopId);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em desativarServico:", erro);
            return { sucesso: false, mensagem: "Erro ao desativar serviço." };
        }
    });

    // Canais com sufixo "Petshop" para não colidir com os handlers de
    // mesmo nome já registrados em registrarHandlersAdmin (o admin vê todos
    // os pedidos/agendamentos, o petshop só os próprios).
    ipcMain.handle("listarPedidosPetshop", async (_event, { petshopId, filtros }) => {
        try {
            return await petshop.listarPedidos(petshopId, filtros);
        } catch (erro) {
            console.error("Erro em listarPedidosPetshop:", erro);
            return [];
        }
    });

    ipcMain.handle("obterItensPedidoPetshop", async (_event, { pedidoId, petshopId }) => {
        try {
            return await petshop.obterItensPedido(pedidoId, petshopId);
        } catch (erro) {
            console.error("Erro em obterItensPedidoPetshop:", erro);
            return [];
        }
    });

    ipcMain.handle("atualizarStatusPedidoPetshop", async (_event, { id, petshopId, etapa, motivo }) => {
        try {
            await petshop.atualizarStatusPedido(id, petshopId, etapa, motivo);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em atualizarStatusPedidoPetshop:", erro);
            return { sucesso: false, mensagem: "Erro ao atualizar status do pedido." };
        }
    });

    ipcMain.handle("listarAgendamentosPetshop", async (_event, { petshopId, filtros }) => {
        try {
            return await petshop.listarAgendamentos(petshopId, filtros);
        } catch (erro) {
            console.error("Erro em listarAgendamentosPetshop:", erro);
            return [];
        }
    });

    ipcMain.handle("atualizarStatusAgendamentoPetshop", async (_event, { id, petshopId, status }) => {
        try {
            await petshop.atualizarStatusAgendamento(id, petshopId, status);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em atualizarStatusAgendamentoPetshop:", erro);
            return { sucesso: false, mensagem: "Erro ao atualizar status do agendamento." };
        }
    });

    handlerConsulta("obterPerfilPetshop", petshop.obterPerfil, null);
    handlerConsulta("obterEnderecoUsuarioPetshop", petshop.obterEnderecoPrincipalUsuario, null);

    ipcMain.handle("salvarPerfilPetshop", async (_event, { petshopId, dados }) => {
        try {
            await petshop.salvarPerfil(petshopId, dados);
            return { sucesso: true };
        } catch (erro) {
            console.error("Erro em salvarPerfilPetshop:", erro);
            return { sucesso: false, mensagem: "Erro ao salvar perfil." };
        }
    });
}

function registrarHandlersRelatorios() {
    handlerConsulta("obterRelatorioVendas", admin.obterRelatorioVendas, null);

    ipcMain.handle("exportarRelatorioPDF", async (event) => {
        try {
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
        console.log("Conectado ao banco hubpetshop (porta 3307).");
    } catch (erro) {
        console.error("Falha ao conectar no banco hubpetshop:", erro.message);
    }

    ipcMain.handle("login", async (_event, credenciais) => {
        try {
            return await auth.login(credenciais);
        } catch (erro) {
            console.error("Erro no login:", erro);
            return { sucesso: false, mensagem: "Erro interno ao tentar entrar. Tente novamente." };
        }
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
