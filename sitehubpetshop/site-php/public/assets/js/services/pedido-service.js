import { ApiClient } from '../api-client.js';

export const PedidoService = {
  listar(usuarioId) {
    return ApiClient.get(`usuarios/${usuarioId}/pedidos`);
  },
  cadastrar(usuarioId, pedido) {
    return ApiClient.post(`usuarios/${usuarioId}/pedidos`, pedido);
  },
};
