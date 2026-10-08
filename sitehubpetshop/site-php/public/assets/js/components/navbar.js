import { AppData } from '../session.js';

// Liga o formulário de busca do menu superior: ao enviar, navega para o
// catálogo filtrando por texto. Se `valorInicial` for passado, já preenche
// o campo (ex.: ao chegar em produtos-categoria.html?busca=...).
export function inicializarBuscaNavbar(valorInicial = '') {
  const form = document.getElementById('form-busca-navbar');
  const input = document.getElementById('input-busca-navbar');
  if (!form || !input) return;

  input.value = valorInicial;
  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const termo = input.value.trim();
    if (!termo) return;
    window.location.href = `produtos-categoria.html?busca=${encodeURIComponent(termo)}`;
  });
}

// Atualiza o número no ícone de carrinho do menu superior.
export function atualizarBadgeCarrinhoNavbar() {
  const badge = document.getElementById('badge-carrinho');
  if (!badge) return;
  const qtd = AppData.qtdCarrinho;
  if (qtd > 0) {
    badge.textContent = qtd > 99 ? '99+' : qtd;
    badge.hidden = false;
  } else {
    badge.hidden = true;
  }
}
