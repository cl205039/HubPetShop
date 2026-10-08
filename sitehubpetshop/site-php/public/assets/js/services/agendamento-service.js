import { ApiClient } from '../api-client.js';

export const AgendamentoService = {
  listar(usuarioId) {
    return ApiClient.get(`usuarios/${usuarioId}/agendamentos`);
  },
  cadastrar(usuarioId, agendamento) {
    return ApiClient.post(`usuarios/${usuarioId}/agendamentos`, agendamento);
  },
};
