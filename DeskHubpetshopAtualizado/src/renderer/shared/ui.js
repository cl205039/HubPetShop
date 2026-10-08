// Convenção do etapa 0-4 de `pedidos` (0-3 vêm do contrato do app do
// consumidor; 4 é a extensão do painel de gestão para "Cancelado").
export const ETAPA_LABELS = ["Confirmado", "Em Preparação", "Saiu para Entrega", "Entregue", "Cancelado"];

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

    return `<span class="status-badge ${classe}">${status}</span>`;
}

// Liga todo botão .btn-toggle-senha do documento (login + cadastro têm o
// deles, e os dois telas já existem no DOM ao mesmo tempo, só uma escondida
// via display:none) — por isso chamado uma única vez a partir do
// bootstrap em renderer.js, não de dentro de cada página de tela de auth.
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
