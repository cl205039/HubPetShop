import { AppData } from '../session.js';
import { abrirModalLogin } from '../components/modal-login.js';
import { montarIcone } from '../components/icones.js';

function renderizarItem(item) {
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('bag', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${item.nome}</p>
        <p class="subtitulo">${item.petshop}</p>
      </div>
      <div class="quantidade-controle">
        <button type="button" data-diminuir="${item.nome}" data-petshop-id="${item.petshopId}">−</button>
        <span>${item.quantidade}</span>
        <button type="button" data-aumentar="${item.nome}" data-petshop-id="${item.petshopId}">+</button>
      </div>
      <span class="preco" style="margin-left:10px;">R$ ${(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</span>
    </div>
  `;
}

function render() {
  const itens = AppData.carrinho;
  const container = document.getElementById('lista-itens');
  const resumo = document.getElementById('resumo');

  if (itens.length === 0) {
    container.innerHTML = '<p class="texto-vazio">Seu carrinho está vazio.</p>';
    resumo.style.display = 'none';
    return;
  }

  container.innerHTML = itens.map(renderizarItem).join('');
  resumo.style.display = 'block';
  document.getElementById('total-carrinho').textContent = `R$ ${AppData.totalCarrinho.toFixed(2).replace('.', ',')}`;

  container.querySelectorAll('[data-aumentar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const item = itens.find((i) => i.nome === botao.dataset.aumentar && i.petshopId === botao.dataset.petshopId);
      AppData.adicionarAoCarrinho(item.nome, item.preco, item.petshopId, item.petshop);
      render();
    });
  });
  container.querySelectorAll('[data-diminuir]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const atual = AppData.carrinho;
      const item = atual.find((i) => i.nome === botao.dataset.diminuir && i.petshopId === botao.dataset.petshopId);
      if (item.quantidade > 1) {
        item.quantidade--;
        AppData.carrinho = atual;
      } else {
        AppData.removerDoCarrinho(botao.dataset.diminuir, botao.dataset.petshopId);
      }
      render();
    });
  });
}

document.getElementById('btn-finalizar').addEventListener('click', () => {
  if (AppData.usuarioLogado) {
    window.location.href = 'pagamentos.html';
    return;
  }
  abrirModalLogin('Entre na sua conta para finalizar a compra.', () => {
    window.location.href = 'pagamentos.html';
  });
});

render();
