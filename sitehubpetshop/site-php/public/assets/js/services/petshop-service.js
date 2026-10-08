import { ApiClient } from '../api-client.js';

export const PetshopService = {
  listar() {
    return ApiClient.get('petshops');
  },
  buscarPorId(id) {
    return ApiClient.get(`petshops/${id}`);
  },
};
