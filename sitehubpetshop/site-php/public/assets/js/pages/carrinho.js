
import { AppData } from '../session.js';
import { abrirModalLogin } from '../components/modal-login.js';
import { montarIcone } from '../components/icones.js';

function formatarMoeda(valor) {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`;
}

function renderizarItem(item, index) {
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('bag', 22)}</span>

      <div class="conteudo">
        <p class="titulo">${item.nome}</p>
        <p class="subtitulo">${item.petshop}</p>
      </div>

      <div class="quantidade-controle">
        <button
          type="button"
          data-diminuir="${index}"
          aria-label="Diminuir quantidade"
        >−</button>

        <span>${item.quantidade}</span>

        <button
          type="button"
          data-aumentar="${index}"
          aria-label="Aumentar quantidade"
        >+</button>
      </div>

      <span class="preco" style="margin-left:10px;">
        ${formatarMoeda(item.preco * item.quantidade)}
      </span>

      <button
        type="button"
        data-remover="${index}"
        aria-label="Excluir ${item.nome} do carrinho"
        title="Excluir item"
        style="
          margin-left:10px;
          padding:6px;
          border:none;
          background:transparent;
          color:#d32f2f;
          cursor:pointer;
          font-size:14px;
          font-weight:bold;
        "
      >
        Excluir
      </button>
    </div>
  `;
}

function render() {
  const itens = AppData.carrinho;
  const container = document.getElementById('lista-itens');
  const resumo = document.getElementById('resumo');

  if (itens.length === 0) {
    container.innerHTML = `
      <p class="texto-vazio">Seu carrinho está vazio.</p>
    `;

    resumo.style.display = 'none';
    return;
  }

  container.innerHTML = itens.map(renderizarItem).join('');
  resumo.style.display = 'block';

  document.getElementById('total-carrinho').textContent =
    formatarMoeda(AppData.totalCarrinho);

  // Aumentar a quantidade do produto
  container.querySelectorAll('[data-aumentar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const indice = Number(botao.dataset.aumentar);
      const item = AppData.carrinho[indice];

      if (!item) return;

      AppData.adicionarAoCarrinho(
        item.nome,
        item.preco,
        item.petshopId,
        item.petshop
      );

      render();
    });
  });

  // Diminuir a quantidade do produto
  container.querySelectorAll('[data-diminuir]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const indice = Number(botao.dataset.diminuir);
      const itensAtuais = AppData.carrinho;
      const item = itensAtuais[indice];

      if (!item) return;

      if (item.quantidade > 1) {
        item.quantidade--;
        AppData.carrinho = itensAtuais;
      } else {
        AppData.removerDoCarrinho(
          item.nome,
          item.petshopId
        );
      }

      render();
    });
  });

  // Excluir completamente um item do carrinho
  container.querySelectorAll('[data-remover]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const indice = Number(botao.dataset.remover);
      const itensAtuais = AppData.carrinho;

      if (!itensAtuais[indice]) return;

      itensAtuais.splice(indice, 1);
      AppData.carrinho = itensAtuais;

      render();
    });
  });
}

// Finalizar pedido
document.getElementById('btn-finalizar').addEventListener('click', () => {
  if (AppData.usuarioLogado) {
    window.location.href = 'pagamentos.html';
    return;
  }

  abrirModalLogin(
    'Entre na sua conta para finalizar a compra.',
    () => {
      window.location.href = 'pagamentos.html';
    }
  );
});

render();
