import 'json_utils.dart';

// Serviço oferecido por um veterinário específico (CRUD em
// servicos_vet.dart) — diferente do catálogo global de agendamento
// (veja models/servico.dart).
class ServicoVet {
  int? id;
  int? veterinarioId;
  String nome;
  double preco;
  String duracao; // texto livre, ex. "30 min"

  ServicoVet({
    this.id,
    this.veterinarioId,
    required this.nome,
    required this.preco,
    required this.duracao,
  });

  factory ServicoVet.fromJson(Map<String, dynamic> json) => ServicoVet(
        id: paraInt(json['id']),
        veterinarioId: paraInt(json['veterinarioId']),
        nome: json['nome'] as String? ?? '',
        preco: paraDouble(json['preco']),
        duracao: json['duracao'] as String? ?? '',
      );

  // Usado em POST /veterinarios/{id}/servicos.
  Map<String, dynamic> toJson() => {
        'nome': nome,
        'preco': preco,
        'duracao': duracao,
      };

  String get precoFormatado => 'R\$ ${preco.toStringAsFixed(2).replaceAll('.', ',')}';
}
