import '../api_client.dart';
import '../models/produto_oferta.dart';

class ProdutoService {
  ProdutoService._();

  static Future<List<ProdutoOferta>> ofertasDoPetshop(int petshopId) async {
    final json = await ApiClient.get('petshops/$petshopId/ofertas');
    return (json as List)
        .map((e) => ProdutoOferta.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<List<ProdutoOferta>> ofertasPorCategoria(
      {String? categoria}) async {
    final json = await ApiClient.get(
      'produtos/ofertas',
      query: (categoria == null || categoria == 'todos')
          ? null
          : {'categoria': categoria},
    );
    return (json as List)
        .map((e) => ProdutoOferta.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
