const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
    login: (credenciais) => ipcRenderer.invoke("login", credenciais),
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
    atualizarStatusPedido: (id, etapa) => ipcRenderer.invoke("atualizarStatusPedido", { id, etapa }),

    listarAgendamentos: (filtros) => ipcRenderer.invoke("listarAgendamentos", filtros),
    atualizarStatusAgendamento: (id, status) => ipcRenderer.invoke("atualizarStatusAgendamento", { id, status }),

    obterDashboardAdmin: () => ipcRenderer.invoke("obterDashboardAdmin"),
    obterDashboardPetshop: (petshopId) => ipcRenderer.invoke("obterDashboardPetshop", petshopId),

    listarCategorias: (tipo) => ipcRenderer.invoke("listarCategorias", tipo),
    listarProdutos: (petshopId, filtros) => ipcRenderer.invoke("listarProdutos", { petshopId, filtros }),
    cadastrarProduto: (petshopId, dados) => ipcRenderer.invoke("cadastrarProduto", { petshopId, dados }),
    editarProduto: (id, petshopId, dados) => ipcRenderer.invoke("editarProduto", { id, petshopId, dados }),
    ativarProduto: (id, petshopId) => ipcRenderer.invoke("ativarProduto", { id, petshopId }),
    desativarProduto: (id, petshopId) => ipcRenderer.invoke("desativarProduto", { id, petshopId }),
    atualizarEstoqueProduto: (id, petshopId, estoque) => ipcRenderer.invoke("atualizarEstoqueProduto", { id, petshopId, estoque }),

    listarServicos: (petshopId, filtros) => ipcRenderer.invoke("listarServicos", { petshopId, filtros }),
    cadastrarServico: (petshopId, dados) => ipcRenderer.invoke("cadastrarServico", { petshopId, dados }),
    editarServico: (id, petshopId, dados) => ipcRenderer.invoke("editarServico", { id, petshopId, dados }),
    ativarServico: (id, petshopId) => ipcRenderer.invoke("ativarServico", { id, petshopId }),
    desativarServico: (id, petshopId) => ipcRenderer.invoke("desativarServico", { id, petshopId }),

    listarPedidosPetshop: (petshopId, filtros) => ipcRenderer.invoke("listarPedidosPetshop", { petshopId, filtros }),
    obterItensPedidoPetshop: (pedidoId, petshopId) => ipcRenderer.invoke("obterItensPedidoPetshop", { pedidoId, petshopId }),
    atualizarStatusPedidoPetshop: (id, petshopId, etapa, motivo) => ipcRenderer.invoke("atualizarStatusPedidoPetshop", { id, petshopId, etapa, motivo }),

    listarAgendamentosPetshop: (petshopId, filtros) => ipcRenderer.invoke("listarAgendamentosPetshop", { petshopId, filtros }),
    atualizarStatusAgendamentoPetshop: (id, petshopId, status) => ipcRenderer.invoke("atualizarStatusAgendamentoPetshop", { id, petshopId, status }),

    obterPerfilPetshop: (petshopId) => ipcRenderer.invoke("obterPerfilPetshop", petshopId),
    obterEnderecoUsuarioPetshop: (usuarioId) => ipcRenderer.invoke("obterEnderecoUsuarioPetshop", usuarioId),
    salvarPerfilPetshop: (petshopId, dados) => ipcRenderer.invoke("salvarPerfilPetshop", { petshopId, dados }),

    obterRelatorioVendas: (periodo) => ipcRenderer.invoke("obterRelatorioVendas", periodo),
    exportarRelatorioPDF: () => ipcRenderer.invoke("exportarRelatorioPDF")
});
