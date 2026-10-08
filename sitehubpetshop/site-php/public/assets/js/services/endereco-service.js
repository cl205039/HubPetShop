import { ApiClient } from '../api-client.js';

export const EnderecoService = {
  listar(usuarioId) {
    return ApiClient.get(`usuarios/${usuarioId}/enderecos`);
  },
  cadastrar(usuarioId, endereco) {
    return ApiClient.post(`usuarios/${usuarioId}/enderecos`, endereco);
  },
  remover(id) {
    return ApiClient.delete(`enderecos/${id}`);
  },
};
