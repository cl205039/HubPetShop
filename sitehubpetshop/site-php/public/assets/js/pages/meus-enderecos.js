import { exigirLogin } from '../components/guard.js';
import { EnderecoService } from '../services/endereco-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import { montarIcone } from '../components/icones.js';

const usuario = exigirLogin();
const container = document.getElementById('lista-enderecos');

function renderizarEndereco(endereco) {
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('map-pin', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${endereco.titulo ?? 'Endereço'} ${endereco.principal ? ' · Principal' : ''}</p>
        <p class="subtitulo">${endereco.rua}, ${endereco.numero} — ${endereco.bairro}, ${endereco.cidade}</p>
      </div>
      <button type="button" class="btn-icone" style="background:none; color:var(--cor-erro);" data-remover="${endereco.id}">${montarIcone('trash', 18)}</button>
    </div>
  `;
}

async function carregar() {
  await carregarEm(container, () => EnderecoService.listar(usuario.id), renderizarEndereco, 'Nenhum endereço cadastrado.');
  container.querySelectorAll('[data-remover]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      if (!confirm('Remover este endereço?')) return;
      try {
        await EnderecoService.remover(botao.dataset.remover);
        carregar();
      } catch (e) {
        mostrarSnackbar(e.message ?? 'Não foi possível remover o endereço.', 'erro');
      }
    });
  });
}

if (usuario) carregar();
