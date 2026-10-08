import 'json_utils.dart';

// Uma oferta = um produto do catálogo vendido por um petshop a um preço.
// Substitui as antigas classes `Produto` (produtos_petshop.dart) e
// `ProdutoOferta`/`_BaseProduto` (produtos_categoria.dart), que
// modelavam a mesma coisa de duas formas diferentes.
//
// Os campos `petshopId`/`petshopNome`/`petshopNota`/`petshopDistanciaKm`
// só vêm preenchidos em `GET /produtos/ofertas` (comparação entre
// petshops); em `GET /petshops/{id}/ofertas` o petshop já é conhecido
// pelo contexto da tela e esses campos ficam nulos.
class ProdutoOferta {
  final int ofertaId;
  final int produtoId;
  final String nome;
  final String descricao;
  final String categoria; // 'racoes' | 'petiscos' | 'higiene' | 'brinquedos'
  final String imagem; // caminho do asset local
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
        // `petshopId` (contrato) ou `petshop_id` — é o id que vai no pedido.
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
