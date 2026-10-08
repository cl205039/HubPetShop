import '../api_client.dart';
import '../models/servico.dart';

/// Catálogo global de serviços de agendamento (banho, tosa, consulta...),
/// usado em agendar.dart. Diferente de ServicoVetService, que é o CRUD
/// de serviços de um veterinário específico.
class ServicoService {
  ServicoService._();

  static Future<List<Servico>> listar() async {
    final json = await ApiClient.get('servicos');
    return (json as List)
        .map((e) => Servico.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}
