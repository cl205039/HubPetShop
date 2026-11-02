import { escaparHtml } from "./ui.js";

// Modal de confirmação genérico.
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
                <h3>${escaparHtml(titulo)}</h3>
                <p>${escaparHtml(mensagem)}</p>
                <div class="acoes-confirmacao">
                    <button class="btn-secundario" data-acao="cancelar">${escaparHtml(textoCancelar)}</button>
                    <button class="${perigo ? 'btn-desativar' : 'btn-aprovar'}" data-acao="confirmar">${escaparHtml(textoConfirmar)}</button>
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

// Modal com formulário (produto, serviço).
const ID_MODAL_FORMULARIO = "overlay-formulario";

export function fecharModalFormulario() {
    document.getElementById(ID_MODAL_FORMULARIO)?.remove();
}

export function abrirModalFormulario(titulo, conteudoHtml) {
    fecharModalFormulario();

    const overlay = document.createElement("div");
    overlay.id = ID_MODAL_FORMULARIO;
    overlay.className = "overlay-confirmacao";
    overlay.innerHTML = `
        <div class="card-confirmacao card-formulario-modal">
            <button type="button" class="btn-fechar-modal">✕</button>
            <h3>${escaparHtml(titulo)}</h3>
            ${conteudoHtml}
        </div>
    `;

    overlay.addEventListener("click", (evento) => {
        if (evento.target === overlay) fecharModalFormulario();
    });
    overlay.querySelector(".btn-fechar-modal").addEventListener("click", fecharModalFormulario);
    document.body.appendChild(overlay);
    return overlay.querySelector(".card-confirmacao");
}

// Modal de motivo do cancelamento de pedido.
// Uso: const motivo = await solicitarMotivoCancelamento("#0012"); // null se voltar
export function solicitarMotivoCancelamento(numeroFormatado) {
    return new Promise((resolve) => {
        const overlay = document.createElement("div");
        overlay.className = "overlay-confirmacao";
        overlay.innerHTML = `
            <div class="card-confirmacao">
                <h3>Cancelar pedido</h3>
                <p>Informe o motivo do cancelamento do pedido ${escaparHtml(numeroFormatado)}. Essa ação não pode ser desfeita.</p>
                <textarea id="motivoCancelamentoTexto" class="textarea-formulario" placeholder="Ex.: Produto fora de estoque, cliente desistiu..."></textarea>
                <small class="mensagem-erro-campo" id="motivoCancelamentoErro" style="display:none;">Informe o motivo do cancelamento.</small>
                <div class="acoes-confirmacao">
                    <button class="btn-secundario" data-acao="voltar">Voltar</button>
                    <button class="btn-desativar" data-acao="confirmar">Cancelar Pedido</button>
                </div>
            </div>
        `;

        function fechar(resultado) {
            overlay.remove();
            resolve(resultado);
        }

        const textarea = overlay.querySelector("#motivoCancelamentoTexto");
        const mensagemErro = overlay.querySelector("#motivoCancelamentoErro");

        overlay.addEventListener("click", (evento) => {
            if (evento.target === overlay) fechar(null);
        });
        overlay.querySelector('[data-acao="voltar"]').addEventListener("click", () => fechar(null));
        overlay.querySelector('[data-acao="confirmar"]').addEventListener("click", () => {
            const motivo = textarea.value.trim();
            if (!motivo) {
                textarea.classList.add("campo-invalido");
                mensagemErro.style.display = "block";
                textarea.focus();
                return;
            }
            fechar(motivo);
        });
        textarea.addEventListener("input", () => {
            textarea.classList.remove("campo-invalido");
            mensagemErro.style.display = "none";
        });

        document.body.appendChild(overlay);
        setTimeout(() => textarea.focus(), 100);
    });
}
