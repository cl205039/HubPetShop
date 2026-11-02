import '../api_client.dart';
import '../models/servico.dart';

class ServicoService {
  ServicoService._();

  static Future<List<Servico>> listar() async {
    final json = await ApiClient.get('servicos');
    return (json as List)
        .map((e) => Servico.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
