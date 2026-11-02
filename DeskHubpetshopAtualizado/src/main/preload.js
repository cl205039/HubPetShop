const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    login: (credenciais) => ipcRenderer.invoke("login", credenciais),
    logout: () => ipcRenderer.invoke("logout"),
    cadastrarPetshop: (dados) => ipcRenderer.invoke("cadastrarPetshop", dados),

    listarPetshops: (filtros) => ipcRenderer.invoke("listarPetshops", filtros),
    obterPetshopDetalhes: (id) => ipcRenderer.invoke("obterPetshopDetalhes", id),
    aprovarPetshop: (id) => ipcRenderer.invoke("aprovarPetshop", id),
    bloquearPetshop: (id) => ipcRenderer.invoke("bloquearPetshop", id),
    desbloquearPetshop: (id) => ipcRenderer.invoke("desbloquearPetshop", id),
    salvarPetshop: (id, dados) => ipcRenderer.invoke("salvarPetshop", { id, dados }),

    listarUsuarios: (filtros) => ipcRenderer.invoke("listarUsuarios", filtros),
    obterPetsUsuario: (usuarioId) => ipcRenderer.invoke("obterPetsUsuario", usuarioId),
    ativarUsuario: (id) => ipcRenderer.invoke("ativarUsuario", id),
    desativarUsuario: (id) => ipcRenderer.invoke("desativarUsuario", id),

    listarPedidos: (filtros) => ipcRenderer.invoke("listarPedidos", filtros),
    obterItensPedido: (pedidoId) => ipcRenderer.invoke("obterItensPedido", pedidoId),
    obterEnderecoUsuario: (usuarioId) => ipcRenderer.invoke("obterEnderecoUsuario", usuarioId),
    atualizarStatusPedido: (id, etapa, motivo) => ipcRenderer.invoke("atualizarStatusPedido", { id, etapa, motivo }),

    listarAgendamentos: (filtros) => ipcRenderer.invoke("listarAgendamentos", filtros),
    atualizarStatusAgendamento: (id, status) => ipcRenderer.invoke("atualizarStatusAgendamento", { id, status }),

    obterDashboardAdmin: () => ipcRenderer.invoke("obterDashboardAdmin"),
    // Canais do petshop
    obterDashboardPetshop: () => ipcRenderer.invoke("obterDashboardPetshop"),

    listarCategorias: (tipo) => ipcRenderer.invoke("listarCategorias", tipo),
    listarProdutos: (filtros) => ipcRenderer.invoke("listarProdutos", filtros),
    cadastrarProduto: (dados) => ipcRenderer.invoke("cadastrarProduto", dados),
    editarProduto: (id, dados) => ipcRenderer.invoke("editarProduto", { id, dados }),
    ativarProduto: (id) => ipcRenderer.invoke("ativarProduto", id),
    desativarProduto: (id) => ipcRenderer.invoke("desativarProduto", id),
    atualizarEstoqueProduto: (id, estoque) => ipcRenderer.invoke("atualizarEstoqueProduto", { id, estoque }),

    listarServicos: (filtros) => ipcRenderer.invoke("listarServicos", filtros),
    cadastrarServico: (dados) => ipcRenderer.invoke("cadastrarServico", dados),
    editarServico: (id, dados) => ipcRenderer.invoke("editarServico", { id, dados }),
    ativarServico: (id) => ipcRenderer.invoke("ativarServico", id),
    desativarServico: (id) => ipcRenderer.invoke("desativarServico", id),

    listarPedidosPetshop: (filtros) => ipcRenderer.invoke("listarPedidosPetshop", filtros),
    obterItensPedidoPetshop: (pedidoId) => ipcRenderer.invoke("obterItensPedidoPetshop", pedidoId),
    atualizarStatusPedidoPetshop: (id, etapa, motivo) => ipcRenderer.invoke("atualizarStatusPedidoPetshop", { id, etapa, motivo }),

    listarAgendamentosPetshop: (filtros) => ipcRenderer.invoke("listarAgendamentosPetshop", filtros),
    obterAgendaDoDia: (data) => ipcRenderer.invoke("obterAgendaDoDia", data),
    atualizarStatusAgendamentoPetshop: (id, status) => ipcRenderer.invoke("atualizarStatusAgendamentoPetshop", { id, status }),

    obterPerfilPetshop: () => ipcRenderer.invoke("obterPerfilPetshop"),
    obterEnderecoUsuarioPetshop: (usuarioId) => ipcRenderer.invoke("obterEnderecoUsuarioPetshop", usuarioId),
    salvarPerfilPetshop: (dados) => ipcRenderer.invoke("salvarPerfilPetshop", dados),
    salvarHorariosPetshop: (horarios) => ipcRenderer.invoke("salvarHorariosPetshop", horarios),

    obterRelatorioVendas: (periodo) => ipcRenderer.invoke("obterRelatorioVendas", periodo),
    exportarRelatorioPDF: () => ipcRenderer.invoke("exportarRelatorioPDF")
});
