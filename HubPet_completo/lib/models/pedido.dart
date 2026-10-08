import 'json_utils.dart';

// Um item dentro de um pedido (produto + quantidade + preço no
// momento da compra).
class ItemPedido {
  final String nome;
  final int quantidade;
  final double precoUnitario;

  const ItemPedido({
    required this.nome,
    required this.quantidade,
    required this.precoUnitario,
  });

  factory ItemPedido.fromJson(Map<String, dynamic> json) => ItemPedido(
        nome: json['nome'] as String? ?? '',
        quantidade: paraInt(json['quantidade']) ?? 1,
        precoUnitario: paraDouble(json['precoUnitario']),
      );

  Map<String, dynamic> toJson() => {
        'nome': nome,
        'quantidade': quantidade,
        'precoUnitario': precoUnitario,
      };

  double get subtotal => precoUnitario * quantidade;
}

// Pedido feito no carrinho (produtos), exibido em "Meus Pedidos".
// `data` fica como texto já formatado para exibição (ex. "Hoje, 14:32"),
// igual ao mock original — não é um timestamp ISO.
class Pedido {
  final int? id;
  final int? usuarioId;
  final String loja;
  final int? petshopId; // id do petshop da compra (null se vier de vários)
  final List<ItemPedido> itens;
  final double total;
  final String data;
  final int etapa; // 0: Confirmado · 1: Preparação · 2: A caminho · 3: Entregue

  const Pedido({
    this.id,
    this.usuarioId,
    required this.loja,
    this.petshopId,
    required this.itens,
    required this.total,
    required this.data,
    this.etapa = 0,
  });

  factory Pedido.fromJson(Map<String, dynamic> json) => Pedido(
        id: paraInt(json['id']),
        usuarioId: paraInt(json['usuarioId']),
        loja: json['loja'] as String? ?? '',
        petshopId: paraInt(json['petshopId']),
        itens: (json['itens'] as List? ?? [])
            .map((e) => ItemPedido.fromJson(e as Map<String, dynamic>))
            .toList(),
        total: paraDouble(json['total']),
        data: json['data'] as String? ?? '',
        etapa: paraInt(json['etapa']) ?? 0,
      );

  // Usado em POST /usuarios/{usuarioId}/pedidos.
  // `petshopId` vai sempre (igual a Agendamento) — fica `null` só quando
  // a compra junta itens de petshops diferentes.
  Map<String, dynamic> toJson() => {
        'loja': loja,
        'petshopId': petshopId,
        'itens': itens.map((i) => i.toJson()).toList(),
        'total': total,
        'data': data,
        'etapa': etapa,
      };

  bool get concluido => etapa >= 3;
}
