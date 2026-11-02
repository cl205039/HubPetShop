import 'json_utils.dart';

class ServicoVet {
  int? id;
  int? veterinarioId;
  String nome;
  double preco;
  String duracao;

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

  Map<String, dynamic> toJson() => {
        'nome': nome,
        'preco': preco,
        'duracao': duracao,
      };

  String get precoFormatado => 'R\$ ${preco.toStringAsFixed(2).replaceAll('.', ',')}';
}
