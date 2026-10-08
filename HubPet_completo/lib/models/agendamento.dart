import 'json_utils.dart';

// Um agendamento de serviço (banho, tosa, consulta...) feito por um
// usuário num petshop, criado em agendar.dart e exibido em
// agendamentos.dart.
class Agendamento {
  int? id;
  int? usuarioId;
  String servico; // nomes concatenados, ex. "Banho, Tosa"
  String hora;
  String status; // 'Confirmado' | 'Pendente' | 'Concluído'
  String pet;
  String local; // nome do petshop
  int? petshopId;
  DateTime data;

  Agendamento({
    this.id,
    this.usuarioId,
    required this.servico,
    required this.hora,
    required this.status,
    required this.pet,
    required this.local,
    this.petshopId,
    required this.data,
  });

  factory Agendamento.fromJson(Map<String, dynamic> json) => Agendamento(
        id: paraInt(json['id']),
        usuarioId: paraInt(json['usuarioId']),
        servico: json['servico'] as String? ?? '',
        hora: json['hora'] as String? ?? '',
        status: json['status'] as String? ?? 'Confirmado',
        pet: json['pet'] as String? ?? '',
        local: json['local'] as String? ?? '',
        petshopId: paraInt(json['petshopId']),
        data: DateTime.tryParse(json['data'] as String? ?? '') ?? DateTime.now(),
      );

  // Usado em POST /usuarios/{usuarioId}/agendamentos.
  Map<String, dynamic> toJson() => {
        'servico': servico,
        'hora': hora,
        'status': status,
        'pet': pet,
        'local': local,
        'petshopId': petshopId,
        'data': data.toIso8601String(),
      };
}
