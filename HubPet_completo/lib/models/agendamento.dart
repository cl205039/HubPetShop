import 'json_utils.dart';

class Agendamento {
  int? id;
  int? usuarioId;
  String servico;
  String hora;
  String status;
  String pet;
  String local;
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
