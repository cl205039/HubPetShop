import { ServicoService } from '../services/servico-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { renderizarAcessoConta } from '../components/acesso-conta.js';
import { montarIcone } from '../components/icones.js';

renderizarAcessoConta('acesso-conta');

const parametros = new URLSearchParams(window.location.search);
const petshopId = parametros.get('petshopId');
const nomePetshop = parametros.get('nome') ?? 'Petshop';

document.getElementById('titulo-petshop').textContent = nomePetshop;

function renderizarServico(servico) {
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('activity', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${servico.nome}</p>
      </div>
      <div style="text-align:right;">
        <p class="preco" style="margin:0 0 6px;">R$ ${servico.preco.toFixed(2).replace('.', ',')}</p>
        <button type="button" class="btn-outline" style="color:var(--cor-primaria); padding:6px 12px;" data-agendar data-nome="${servico.nome}" data-preco="${servico.preco}">Agendar</button>
      </div>
    </div>
  `;
}

async function carregar() {
  const container = document.getElementById('lista-servicos');
  await carregarEm(container, () => ServicoService.listar(petshopId), renderizarServico, 'Esse petshop ainda não cadastrou nenhum serviço.');
  container.querySelectorAll('[data-agendar]').forEach((botao) => {
    botao.addEventListener('click', () => {
      const params = new URLSearchParams({
        petshopId,
        nome: nomePetshop,
        servico: botao.dataset.nome,
        preco: botao.dataset.preco,
      });
      window.location.href = `agendar.html?${params.toString()}`;
    });
  });
}

if (petshopId) {
  carregar();
} else {
  document.getElementById('lista-servicos').innerHTML = '<p class="texto-vazio">Escolha um petshop para ver os serviços dele.</p>';
}
