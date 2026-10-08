import 'json_utils.dart';

// Petshop/clínica listado no app. `nota` e `distanciaKm` vêm numéricos
// da API — a formatação para exibição (ex. "4.8", "900 m") fica aqui.
class Petshop {
  final int id;
  final String nome;
  final double nota;
  final double distanciaKm;

  const Petshop({
    required this.id,
    required this.nome,
    required this.nota,
    required this.distanciaKm,
  });

  factory Petshop.fromJson(Map<String, dynamic> json) => Petshop(
        // Aceita `id` (contrato), mas também `petshopId`/`petshop_id` — sem
        // o id real aqui, o pedido acaba saindo sem petshop.
        id: paraInt(json['id'] ?? json['petshopId'] ?? json['petshop_id']) ?? 0,
        nome: json['nome'] as String? ?? '',
        nota: paraDouble(json['nota']),
        distanciaKm: paraDouble(json['distanciaKm']),
      );

  String get notaFormatada => nota.toStringAsFixed(1);

  String get distanciaFormatada => distanciaKm < 1
      ? '${(distanciaKm * 1000).round()} m'
      : '${distanciaKm.toStringAsFixed(1)} km';
}
