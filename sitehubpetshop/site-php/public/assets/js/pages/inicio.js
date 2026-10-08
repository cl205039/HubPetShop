import { AppData } from '../session.js';
import { renderizarAcessoConta } from '../components/acesso-conta.js';
import { PetshopService } from '../services/petshop-service.js';
import { ProdutoService } from '../services/produto-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { montarIcone } from '../components/icones.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import { inicializarBuscaNavbar, atualizarBadgeCarrinhoNavbar } from '../components/navbar.js';

inicializarBuscaNavbar();
atualizarBadgeCarrinhoNavbar();

// Página pública: qualquer visitante navega pelo catálogo sem login.
// Login só é exigido ao tentar comprar (ver produtos-petshop.js / produtos-categoria.js).
const usuario = AppData.usuarioLogado;
const acabouDeCadastrar = AppData.consumirBoasVindasCadastro();

const saudacaoEl = document.getElementById('saudacao');
if (saudacaoEl) {
  saudacaoEl.textContent = usuario
    ? `Olá, ${usuario.nome.split(' ')[0]}!`
    : 'Seja bem-vindo(a) ao HubPetShop';
}

if (acabouDeCadastrar && usuario) {
  mostrarSnackbar(`${usuario.nome.split(' ')[0]}, seja bem-vindo(a) ao HubPetShop!`, 'sucesso');
}

renderizarAcessoConta('acesso-conta');

document.querySelectorAll('.categoria-card[data-categoria]').forEach((botao) => {
  botao.addEventListener('click', () => {
    window.location.href = `produtos-categoria.html?categoria=${botao.dataset.categoria}`;
  });
});
document.getElementById('btn-servicos').addEventListener('click', () => {
  window.location.href = 'petshops.html?para=servicos';
});

function renderizarPetshop(petshop) {
  return `
    <a href="produtos-petshop.html?petshopId=${petshop.id}&nome=${encodeURIComponent(petshop.nome)}" class="item-lista">
      <span class="icone">${montarIcone('store', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${petshop.nome}</p>
        <p class="subtitulo"><span class="estrela">${montarIcone('star', 14)}</span>${petshop.nota.toFixed(1)} · ${petshop.distanciaKm.toFixed(1)} km</p>
      </div>
      <span class="seta">${montarIcone('chevron-right', 18)}</span>
    </a>
  `;
}

async function carregarPetshops() {
  const container = document.getElementById('lista-petshops');
  const todos = await carregarEm(container, () => PetshopService.listar(), renderizarPetshop, 'Nenhum petshop cadastrado ainda.');
  if (todos.length > 3) {
    container.innerHTML = todos.slice(0, 3).map(renderizarPetshop).join('');
  }
}

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

const ICONE_CATEGORIA = { racoes: 'package', petiscos: 'circle', higiene: 'droplet', brinquedos: 'gift' };

function renderizarProduto(oferta) {
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

async function carregarProdutos() {
  const container = document.getElementById('lista-produtos');
  await carregarEm(container, () => ProdutoService.ofertasTodas(), renderizarProduto, 'Nenhum produto disponível no momento.');
  container.querySelectorAll('[data-add]').forEach((botao) => {
    botao.addEventListener('click', () => {
      AppData.adicionarAoCarrinho(botao.dataset.add, parseFloat(botao.dataset.preco), botao.dataset.petshopId, botao.dataset.petshop);
      mostrarSnackbar(`${botao.dataset.add} adicionado ao carrinho`, 'sucesso');
      atualizarBarraCarrinho();
    });
  });
}

carregarPetshops();
carregarProdutos();
atualizarBarraCarrinho();
