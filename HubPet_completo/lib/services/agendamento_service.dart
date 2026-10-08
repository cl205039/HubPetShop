import '../api_client.dart';
import '../models/agendamento.dart';

class AgendamentoService {
  AgendamentoService._();

  static Future<List<Agendamento>> listar(int usuarioId) async {
    final json = await ApiClient.get('usuarios/$usuarioId/agendamentos');
    return (json as List)
        .map((e) => Agendamento.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Agendamento> criar(
      int usuarioId, Agendamento agendamento) async {
    final json = await ApiClient.post(
        'usuarios/$usuarioId/agendamentos', agendamento.toJson());
    return Agendamento.fromJson(json as Map<String, dynamic>);
  }
}
