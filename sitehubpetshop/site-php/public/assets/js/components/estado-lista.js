export async function carregarEm(container, buscarDados, renderizarItem, vazioMsg = 'Nenhum item encontrado.') {
  container.innerHTML = '<div class="spinner" role="status" aria-label="Carregando"></div>';
  try {
    const itens = await buscarDados();
    container.innerHTML = itens.length
      ? itens.map(renderizarItem).join('')
      : `<p class="texto-vazio">${vazioMsg}</p>`;
    return itens;
  } catch (e) {
    container.innerHTML = `
      <p class="texto-erro">${e.message}</p>
      <button type="button" class="btn-outline" data-acao="tentar-novamente">Tentar novamente</button>
    `;
    container.querySelector('[data-acao="tentar-novamente"]')
      .addEventListener('click', () => carregarEm(container, buscarDados, renderizarItem, vazioMsg));
    return [];
  }
}
