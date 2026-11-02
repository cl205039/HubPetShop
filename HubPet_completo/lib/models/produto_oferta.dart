import 'json_utils.dart';

class ProdutoOferta {
  final int ofertaId;
  final int produtoId;
  final String nome;
  final String descricao;
  final String categoria;
  final String imagem;
  final double preco;
  final int? petshopId;
  final String? petshopNome;
  final double? petshopNota;
  final double? petshopDistanciaKm;

  const ProdutoOferta({
    required this.ofertaId,
    required this.produtoId,
    required this.nome,
    required this.descricao,
    required this.categoria,
    required this.imagem,
    required this.preco,
    this.petshopId,
    this.petshopNome,
    this.petshopNota,
    this.petshopDistanciaKm,
  });

  factory ProdutoOferta.fromJson(Map<String, dynamic> json) => ProdutoOferta(
        ofertaId: paraInt(json['ofertaId']) ?? 0,
        produtoId: paraInt(json['produtoId']) ?? 0,
        nome: json['nome'] as String? ?? '',
        descricao: json['descricao'] as String? ?? '',
        categoria: json['categoria'] as String? ?? '',
        imagem: json['imagem'] as String? ?? '',
        preco: paraDouble(json['preco']),
        petshopId: paraInt(json['petshopId'] ?? json['petshop_id']),
        petshopNome: json['petshopNome'] as String?,
        petshopNota: json['petshopNota'] == null
            ? null
            : paraDouble(json['petshopNota']),
        petshopDistanciaKm: json['petshopDistanciaKm'] == null
            ? null
            : paraDouble(json['petshopDistanciaKm']),
      );

  String get precoFormatado =>
      'R\$ ${preco.toStringAsFixed(2).replaceAll('.', ',')}';

  String get petshopNotaFormatada => (petshopNota ?? 0).toStringAsFixed(1);
}
