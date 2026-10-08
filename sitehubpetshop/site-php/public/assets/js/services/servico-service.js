import { ApiClient } from '../api-client.js';

export const ServicoService = {
  listar(petshopId) {
    return ApiClient.get('servicos', { petshopId });
  },
};
