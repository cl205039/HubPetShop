import { AppData } from '../session.js';
import { PetService } from '../services/pet-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import { montarIcone } from '../components/icones.js';
import { renderizarEstadoDeslogado } from '../components/estado-login.js';

const usuario = AppData.usuarioLogado;
const container = document.getElementById('lista-pets');

function renderizarPet(pet) {
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('paw', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${pet.nome}</p>
        <p class="subtitulo">${pet.raca ?? pet.tipo}${pet.idade ? ' · ' + pet.idade : ''}</p>
      </div>
      <button type="button" class="btn-icone" style="background:none; color:var(--cor-erro);" data-remover="${pet.id}">${montarIcone('trash', 18)}</button>
    </div>
  `;
}

async function carregar() {
  await carregarEm(container, () => PetService.listar(usuario.id), renderizarPet, 'Você ainda não cadastrou nenhum pet.');
  container.querySelectorAll('[data-remover]').forEach((botao) => {
    botao.addEventListener('click', async () => {
      if (!confirm('Remover este pet?')) return;
      try {
        await PetService.remover(botao.dataset.remover);
        carregar();
      } catch (e) {
        mostrarSnackbar(e.message ?? 'Não foi possível remover o pet.', 'erro');
      }
    });
  });
}

if (usuario) {
  carregar();
} else {
  renderizarEstadoDeslogado(container, 'Entre na sua conta para ver seus pets.');
}
