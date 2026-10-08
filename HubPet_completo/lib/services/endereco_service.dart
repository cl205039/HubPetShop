import '../api_client.dart';
import '../models/endereco.dart';

class EnderecoService {
  EnderecoService._();

  static Future<List<Endereco>> listar(int usuarioId) async {
    final json = await ApiClient.get('usuarios/$usuarioId/enderecos');
    return (json as List)
        .map((e) => Endereco.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Endereco> cadastrar(int usuarioId, Endereco endereco) async {
    final json = await ApiClient.post(
        'usuarios/$usuarioId/enderecos', endereco.toJson());
    return Endereco.fromJson(json as Map<String, dynamic>);
  }

  static Future<void> remover(int id) {
    return ApiClient.delete('enderecos/$id');
  }
}
