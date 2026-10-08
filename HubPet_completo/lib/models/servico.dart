import 'package:flutter/material.dart';

import 'json_utils.dart';

// Serviço do catálogo global de agendamento (banho, tosa, consulta...),
// usado em agendar.dart. `icone` chega da API como string (ex.
// "bathtub") e é convertida pra IconData aqui, já que IconData não é
// serializável em JSON.
class Servico {
  final int id;
  final String nome;
  final double preco;
  final IconData icone;

  const Servico({
    required this.id,
    required this.nome,
    required this.preco,
    required this.icone,
  });

  factory Servico.fromJson(Map<String, dynamic> json) => Servico(
        id: paraInt(json['id']) ?? 0,
        nome: json['nome'] as String? ?? '',
        preco: paraDouble(json['preco']),
        icone: _iconePorNome(json['icone'] as String?),
      );

  String get precoFormatado => 'R\$ ${preco.toStringAsFixed(2).replaceAll('.', ',')}';
}

IconData _iconePorNome(String? nome) {
  switch (nome) {
    case 'bathtub':
      return Icons.bathtub;
    case 'cut':
      return Icons.cut;
    case 'medical_services':
      return Icons.medical_services;
    case 'vaccines':
      return Icons.vaccines;
    case 'pets':
    default:
      return Icons.pets;
  }
}
