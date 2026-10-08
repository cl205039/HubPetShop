import { AppData } from '../session.js';
import { ProdutoService } from '../services/produto-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import { renderizarAcessoConta } from '../components/acesso-conta.js';
import { montarIcone } from '../components/icones.js';
import { inicializarBuscaNavbar, atualizarBadgeCarrinhoNavbar } from '../components/navbar.js';

const usuario = AppData.usuarioLogado;
const saudacaoEl = document.getElementById('saudacao');
if (saudacaoEl) saudacaoEl.textContent = usuario ? `Olá, ${usuario.nome.split(' ')[0]}!` : '';

renderizarAcessoConta('acesso-conta');

const parametros = new URLSearchParams(window.location.search);
const categoria = parametros.get('categoria');
const busca = parametros.get('busca');

inicializarBuscaNavbar(busca ?? '');

const ICONE_CATEGORIA = { racoes: 'package', petiscos: 'circle', higiene: 'droplet', brinquedos: 'gift' };
const rotulos = { racoes: 'Rações', petiscos: 'Petiscos', higiene: 'Higiene', brinquedos: 'Brinquedos' };

let titulo = 'Todos os produtos';
if (categoria) titulo = rotulos[categoria] ?? 'Produtos';
else if (busca) titulo = `Resultados para "${busca}"`;
document.getElementById('titulo-categoria').textContent = titulo;

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
  atualizarBadgeCarrinhoNavbar();
}

function renderizarOferta(oferta) {
  return `
    <div class="produto-card">
      <div class="produto-card__imagem cat-${oferta.categoria}">
        <span class="produto-card__avaliacao"><span class="estrela">${montarIcone('star', 11)}</span>${oferta.petshopNota.toFixed(1)}</span>
        ${montarIcone(ICONE_CATEGORIA[oferta.categoria] ?? 'package', 36)}
      </div>
      <p class="produto-card__nome">${oferta.nome}</p>
      <p class="produto-card__loja">${montarIcone('store', 13)} ${oferta.petshopNome}</p>
      <div class="produto-card__rodape">
        <span class="produto-card__preco">R$ ${oferta.preco.toFixed(2).replace('.', ',')}</span>
        <button type="button" class="produto-card__add" title="Adicionar ao carrinho" data-add="${oferta.nome}" data-preco="${oferta.preco}" data-petshop-id="${oferta.petshopId}" data-petshop="${oferta.petshopNome}">${montarIcone('plus', 16)}</button>
      </div>
    </div>
  `;
}

async function carregar() {
  const container = document.getElementById('lista-ofertas');
  const mensagemVazio = busca
    ? `Nenhum produto encontrado para "${busca}".`
    : 'Nenhum produto encontrado nesta categoria.';
  await carregarEm(container, () => ProdutoService.ofertasTodas({ categoria, busca }), renderizarOferta, mensagemVazio);
  container.querySelectorAll('[data-add]').forEach((botao) => {
    botao.addEventListener('click', () => {
      AppData.adicionarAoCarrinho(botao.dataset.add, parseFloat(botao.dataset.preco), botao.dataset.petshopId, botao.dataset.petshop);
      mostrarSnackbar(`${botao.dataset.add} adicionado ao carrinho`, 'sucesso');
      atualizarBarraCarrinho();
    });
  });
}

carregar();
atualizarBarraCarrinho();
