import '../api_client.dart';
import '../models/servico_vet.dart';

class ServicoVetService {
  ServicoVetService._();

  static Future<List<ServicoVet>> listar(int veterinarioId) async {
    final json = await ApiClient.get('veterinarios/$veterinarioId/servicos');
    return (json as List)
        .map((e) => ServicoVet.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<ServicoVet> cadastrar(
      int veterinarioId, ServicoVet servico) async {
    final json = await ApiClient.post(
        'veterinarios/$veterinarioId/servicos', servico.toJson());
    return ServicoVet.fromJson(json as Map<String, dynamic>);
  }

  static Future<void> remover(int id) {
    return ApiClient.delete('servicos-vet/$id');
  }
}
