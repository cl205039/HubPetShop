import { ApiClient } from '../api-client.js';

export const ProdutoService = {
  ofertasPorPetshop(petshopId) {
    return ApiClient.get(`petshops/${petshopId}/ofertas`);
  },
  // O filtro por categoria é da API. A busca por texto é feita aqui no
  // navegador, porque nem toda implementação da API (ver docapi.md) tem
  // esse parâmetro — só `categoria` faz parte do contrato oficial.
  async ofertasTodas({ categoria, busca } = {}) {
    const ofertas = await ApiClient.get('produtos/ofertas', { categoria });
    if (!busca) return ofertas;
    const termo = busca.trim().toLowerCase();
    return ofertas.filter((o) =>
      o.nome.toLowerCase().includes(termo) || (o.descricao ?? '').toLowerCase().includes(termo)
    );
  },
};
