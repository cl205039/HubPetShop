import { AppData } from '../session.js';
import { PetshopService } from '../services/petshop-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { renderizarAcessoConta } from '../components/acesso-conta.js';
import { montarIcone } from '../components/icones.js';
import { inicializarBuscaNavbar, atualizarBadgeCarrinhoNavbar } from '../components/navbar.js';

const usuario = AppData.usuarioLogado;
const saudacaoEl = document.getElementById('saudacao');
if (saudacaoEl) saudacaoEl.textContent = usuario ? `Olá, ${usuario.nome.split(' ')[0]}!` : '';

renderizarAcessoConta('acesso-conta');
inicializarBuscaNavbar();
atualizarBadgeCarrinhoNavbar();

const container = document.getElementById('lista-petshops');

// ?para=servicos manda pro fluxo de agendar em vez do catálogo de produtos —
// mesma lista de petshops, só muda pra onde o card leva ao clicar.
const paraServicos = new URLSearchParams(window.location.search).get('para') === 'servicos';

const tituloEl = document.getElementById('titulo-petshops');
if (tituloEl && paraServicos) tituloEl.textContent = 'Escolha um petshop para agendar';

function renderizarPetshop(petshop) {
  const destino = paraServicos
    ? `servicos-petshop.html?petshopId=${petshop.id}&nome=${encodeURIComponent(petshop.nome)}`
    : `produtos-petshop.html?petshopId=${petshop.id}&nome=${encodeURIComponent(petshop.nome)}`;
  return `
    <a href="${destino}" class="petshop-card">
      <div class="petshop-card__icone">${montarIcone('store', 34)}</div>
      <p class="petshop-card__nome">${petshop.nome}</p>
      <p class="petshop-card__meta"><span class="estrela">${montarIcone('star', 13)}</span>${petshop.nota.toFixed(1)} · ${petshop.distanciaKm.toFixed(1)} km</p>
    </a>
  `;
}

carregarEm(container, () => PetshopService.listar(), renderizarPetshop, 'Nenhum petshop cadastrado ainda.');
