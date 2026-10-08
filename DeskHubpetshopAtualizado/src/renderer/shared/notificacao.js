// Aviso customizado anti-congelamento (toast de sucesso/erro em pt-BR).
export function mostrarNotificacao(mensagem, sucesso = true) {
    const antiga = document.getElementById("toast-notificacao");
    if (antiga) antiga.remove();

    const toast = document.createElement("div");
    toast.id = "toast-notificacao";
    toast.innerText = mensagem;
    toast.className = sucesso ? "sucesso" : "erro";

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
