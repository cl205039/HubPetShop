import { exigirLogin } from '../components/guard.js';
import { AgendamentoService } from '../services/agendamento-service.js';
import { carregarEm } from '../components/estado-lista.js';
import { montarIcone } from '../components/icones.js';

const usuario = exigirLogin();
const container = document.getElementById('lista-agendamentos');

const iconesPorStatus = { Confirmado: 'confirmado', Pendente: 'pendente', 'Concluído': 'concluido' };

function renderizarAgendamento(a) {
  const dataFormatada = new Date(a.data.replace(' ', 'T')).toLocaleDateString('pt-BR');
  return `
    <div class="item-lista" style="cursor:default;">
      <span class="icone">${montarIcone('calendar', 22)}</span>
      <div class="conteudo">
        <p class="titulo">${a.servico}</p>
        <p class="subtitulo">${a.pet ? a.pet + ' · ' : ''}${a.local ? a.local + ' · ' : ''}${dataFormatada} às ${a.hora}</p>
      </div>
      <span class="badge-status ${iconesPorStatus[a.status] ?? 'pendente'}">${a.status}</span>
    </div>
  `;
}

if (usuario) {
  carregarEm(container, () => AgendamentoService.listar(usuario.id), renderizarAgendamento, 'Você ainda não tem agendamentos.');
}
