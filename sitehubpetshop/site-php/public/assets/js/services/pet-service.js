import { ApiClient } from '../api-client.js';

export const PetService = {
  listar(usuarioId) {
    return ApiClient.get(`usuarios/${usuarioId}/pets`);
  },
  cadastrar(usuarioId, pet) {
    return ApiClient.post(`usuarios/${usuarioId}/pets`, pet);
  },
  atualizar(id, pet) {
    return ApiClient.put(`pets/${id}`, pet);
  },
  remover(id) {
    return ApiClient.delete(`pets/${id}`);
  },
};
