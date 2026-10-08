// Paginação client-side: as páginas já buscam a lista inteira (filtrada)
// do banco de uma vez — isso só fatia o array em blocos de N itens pra
// exibição, sem round-trip novo ao MySQL a cada página.
export function paginar(lista, pagina, itensPorPagina) {
    const totalPaginas = Math.max(1, Math.ceil(lista.length / itensPorPagina));
    const paginaAtual = Math.min(Math.max(1, pagina), totalPaginas);
    const inicio = (paginaAtual - 1) * itensPorPagina;

    return {
        itens: lista.slice(inicio, inicio + itensPorPagina),
        paginaAtual,
        totalPaginas,
        totalItens: lista.length
    };
}

export function renderizarControlesPaginacao(paginaAtual, totalPaginas, totalItens) {
    if (totalPaginas <= 1) return "";

    return `
        <div class="controles-paginacao">
            <button class="btn-secundario btn-paginacao" data-pagina="${paginaAtual - 1}" ${paginaAtual <= 1 ? "disabled" : ""}>‹ Anterior</button>
            <span class="info-paginacao">Página ${paginaAtual} de ${totalPaginas} (${totalItens} registros)</span>
            <button class="btn-secundario btn-paginacao" data-pagina="${paginaAtual + 1}" ${paginaAtual >= totalPaginas ? "disabled" : ""}>Próxima ›</button>
        </div>
    `;
}

export function ligarControlesPaginacao(container, aoMudarPagina) {
    container.querySelectorAll(".btn-paginacao[data-pagina]").forEach((botao) => {
        if (botao.disabled) return;
        botao.addEventListener("click", () => aoMudarPagina(Number(botao.dataset.pagina)));
    });
}
