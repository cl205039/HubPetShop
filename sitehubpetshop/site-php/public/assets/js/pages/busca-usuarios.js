import { exigirLogin } from '../components/guard.js';
import { UsuarioService } from '../services/usuario-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { montarIcone } from '../components/icones.js';

exigirLogin();

const rotulosTipo = { pessoafisica: 'Pessoa Física', pessoajuridica: 'Pessoa Jurídica' };

function renderizarUsuario(u) {
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('user', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${u.nome}</p>
        <p class="subtitulo">${u.email} · ${rotulosTipo[u.tipoUsuario] ?? u.tipoUsuario}</p>
      </div>
    </div>
  `;
}

document.getElementById('form-busca').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const atributo = document.getElementById('atributo').value;
  const termo = document.getElementById('termo').value.trim();
  const container = document.getElementById('lista-resultados');
  if (!termo) {
    container.innerHTML = '<p class="texto-vazio">Digite um termo para buscar.</p>';
    return;
  }
  carregarEm(container, () => UsuarioService.buscar(atributo, termo), renderizarUsuario, 'Nenhum usuário encontrado.');
});
