// Etapas do pedido (0-3 do app, 4 = Cancelado).
export const ETAPA_LABELS = ["Confirmado", "Em Preparação", "Saiu para Entrega", "Entregue", "Cancelado"];

// Mesma convenção de horarios_funcionamento.dia_semana (0 = domingo).
export const DIAS_SEMANA = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

// Proteção contra XSS: usar em todo dado do banco colocado em innerHTML.
export function escaparHtml(valor) {
    if (valor === null || valor === undefined) return "";
    return String(valor)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// Formatação de CNPJ e telefone.
export function formatarCnpj(valor) {
    const digitos = (valor || "").replace(/\D/g, "");
    if (!digitos) return "—";
    if (digitos.length !== 14) return valor;
    return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`;
}

export function formatarTelefone(valor) {
    const digitos = (valor || "").replace(/\D/g, "");
    if (!digitos) return "—";
    if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
    if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    return valor;
}

// Valor em reais: 1234.5 -> "R$ 1.234,50".
export function formatarMoeda(valor) {
    return `R$ ${(Number(valor) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Data local no formato AAAA-MM-DD.
export function dataISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, "0");
    const dia = String(data.getDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}

// Data do agendamento como DD/MM/AAAA.
export function formatarDataAgendamento(ag) {
    if (ag.data_hora) {
        const d = new Date(ag.data_hora);
        if (!Number.isNaN(d.getTime())) return d.toLocaleDateString("pt-BR");
    }

    const [ano, mes, dia] = String(ag.data || "").slice(0, 10).split("-");
    return (ano && mes && dia) ? `${dia}/${mes}/${ano}` : "—";
}

export function criarBadgeStatus(status) {
    const s = (status || "").toLowerCase();
    let classe = "status-neutro";

    if (s === "entregue" || s === "ativo" || s === "disponível" || s === "aprovado" || s === "confirmado" || s === "concluído") {
        classe = "status-sucesso";
    } else if (s === "pendente" || s === "ocupado") {
        classe = "status-alerta";
    } else if (s === "cancelado" || s === "bloqueado" || s === "inativo") {
        classe = "status-erro";
    }

    return `<span class="status-badge ${classe}">${escaparHtml(status)}</span>`;
}

// Endereço de entrega do pedido.
export function enderecoHtml(endereco) {
    if (!endereco) return "<p>Endereço não cadastrado.</p>";

    const campo = (nome) => escaparHtml(endereco[nome]);
    const juntar = (partes, separador) => partes.filter(Boolean).join(separador);
    const linhas = [
        endereco.titulo ? `<strong>${campo("titulo")}</strong>` : "",
        juntar([juntar([campo("rua"), campo("numero")], ", "), campo("complemento")], " — "),
        campo("bairro"),
        juntar([juntar([campo("cidade"), campo("estado")], " / "), endereco.cep ? `CEP ${campo("cep")}` : ""], " — ")
    ];

    return linhas.filter(Boolean).map((linha) => `<p>${linha}</p>`).join("");
}

// Atalhos dos dashboards (botões com data-pagina).
export function ligarNavegacao(container) {
    container.querySelectorAll("[data-pagina]").forEach((elemento) => {
        elemento.addEventListener("click", () => {
            document.querySelector(`.menu-btn[data-page="${elemento.dataset.pagina}"]`).click();
        });
    });
}

// Liga os botões de mostrar/ocultar senha.
export function configurarTogglesSenha() {
    document.querySelectorAll(".btn-toggle-senha").forEach((botao) => {
        botao.addEventListener("click", () => {
            const alvo = document.getElementById(botao.dataset.alvo);
            if (!alvo) return;
            const oculto = alvo.type === "password";
            alvo.type = oculto ? "text" : "password";
            botao.innerText = oculto ? "🙈" : "👁";
        });
    });
}
