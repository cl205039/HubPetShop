// Modal de confirmação genérico, usado antes de qualquer ação crítica
// (bloquear/desbloquear petshop, ativar/desativar usuário, etc.).
// Uso: const ok = await confirmarAcao({ titulo, mensagem, textoConfirmar });
export function confirmarAcao({ titulo = "Confirmar ação", mensagem, textoConfirmar = "Confirmar", textoCancelar = "Cancelar", perigo = false }) {
    return new Promise((resolve) => {
        const antigo = document.getElementById("overlay-confirmacao");
        if (antigo) antigo.remove();

        const overlay = document.createElement("div");
        overlay.id = "overlay-confirmacao";
        overlay.className = "overlay-confirmacao";
        overlay.innerHTML = `
            <div class="card-confirmacao">
                <h3>${titulo}</h3>
                <p>${mensagem}</p>
                <div class="acoes-confirmacao">
                    <button class="btn-secundario" data-acao="cancelar">${textoCancelar}</button>
                    <button class="${perigo ? 'btn-desativar' : 'btn-aprovar'}" data-acao="confirmar">${textoConfirmar}</button>
                </div>
            </div>
        `;

        function fechar(resultado) {
            overlay.remove();
            resolve(resultado);
        }

        overlay.addEventListener("click", (evento) => {
            if (evento.target === overlay) fechar(false);
        });
        overlay.querySelector('[data-acao="cancelar"]').addEventListener("click", () => fechar(false));
        overlay.querySelector('[data-acao="confirmar"]').addEventListener("click", () => fechar(true));

        document.body.appendChild(overlay);
    });
}
