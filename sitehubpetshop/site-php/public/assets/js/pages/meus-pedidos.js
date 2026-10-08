import { AppData } from '../session.js';
import { PedidoService } from '../services/pedido-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { montarIcone } from '../components/icones.js';
import { renderizarEstadoDeslogado } from '../components/estado-login.js';

const usuario = AppData.usuarioLogado;
const container = document.getElementById('lista-pedidos');

const etapas = ['Pedido realizado', 'Em preparação', 'A caminho', 'Entregue'];

function renderizarPedido(pedido) {
  const itensTexto = pedido.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(', ');
  return `
    <div class="item-lista" style="cursor:default; align-items:flex-start;">
      <span class="icone">${montarIcone('cart', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${pedido.loja}</p>
        <p class="subtitulo">${itensTexto}</p>
        <p class="subtitulo">${pedido.data}</p>
      </div>
      <div style="text-align:right;">
        <p class="preco" style="margin:0 0 6px;">R$ ${pedido.total.toFixed(2).replace('.', ',')}</p>
        <span class="badge-status confirmado">${etapas[pedido.etapa] ?? 'Pedido realizado'}</span>
      </div>
    </div>
  `;
}

if (usuario) {
  carregarEm(container, () => PedidoService.listar(usuario.id), renderizarPedido, 'Você ainda não fez nenhum pedido.');
} else {
  renderizarEstadoDeslogado(container, 'Entre na sua conta para ver seus pedidos.');
}
