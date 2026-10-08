import { AppData } from '../session.js';
import { ProdutoService } from '../services/produto-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import { renderizarAcessoConta } from '../components/acesso-conta.js';
import { montarIcone } from '../components/icones.js';

renderizarAcessoConta('acesso-conta');

const parametros = new URLSearchParams(window.location.search);
const petshopId = parametros.get('petshopId');
const nomePetshop = parametros.get('nome') ?? 'Petshop';

document.getElementById('titulo-petshop').textContent = nomePetshop;

function atualizarBarraCarrinho() {
  const qtd = AppData.qtdCarrinho;
  const barra = document.getElementById('barra-carrinho');
  if (qtd > 0) {
    barra.style.display = 'flex';
    document.getElementById('qtd-carrinho').textContent = qtd;
    document.getElementById('total-carrinho').textContent =
      `R$ ${AppData.totalCarrinho.toFixed(2).replace('.', ',')}`;
  } else {
    barra.style.display = 'none';
  }
}

function renderizarOferta(oferta) {
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('package', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${oferta.nome}</p>
        <p class="subtitulo">${oferta.descricao ?? ''}</p>
      </div>
      <div style="text-align:right;">
        <p class="preco" style="margin:0 0 6px;">R$ ${oferta.preco.toFixed(2).replace('.', ',')}</p>
        <button type="button" class="btn-outline" style="color:var(--cor-primaria); padding:6px 12px;" data-add="${oferta.nome}" data-preco="${oferta.preco}">Adicionar</button>
      </div>
    </div>
  `;
}

async function carregar() {
  const container = document.getElementById('lista-ofertas');
  await carregarEm(container, () => ProdutoService.ofertasPorPetshop(petshopId), renderizarOferta, 'Nenhum produto disponível neste petshop.');
  container.querySelectorAll('[data-add]').forEach((botao) => {
    botao.addEventListener('click', () => {
      AppData.adicionarAoCarrinho(botao.dataset.add, parseFloat(botao.dataset.preco), petshopId, nomePetshop);
      mostrarSnackbar(`${botao.dataset.add} adicionado ao carrinho`, 'sucesso');
      atualizarBarraCarrinho();
    });
  });
}

if (petshopId) {
  carregar();
  atualizarBarraCarrinho();
}
