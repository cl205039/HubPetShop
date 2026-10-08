import 'package:flutter/foundation.dart';

import '../api_client.dart';
import '../models/pedido.dart';

class PedidoService {
  PedidoService._();

  static Future<List<Pedido>> listar(int usuarioId) async {
    final json = await ApiClient.get('usuarios/$usuarioId/pedidos');
    return (json as List)
        .map((e) => Pedido.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  static Future<Pedido> criar(int usuarioId, Pedido pedido) async {
    final corpo = pedido.toJson();
    // Deixa visível no console exatamente o que vai pro backend —
    // confira o `petshopId` aqui se o pedido estiver saindo sem/errado.
    debugPrint(
        '[PedidoService] POST usuarios/$usuarioId/pedidos  corpo=$corpo');
    final json = await ApiClient.post('usuarios/$usuarioId/pedidos', corpo);
    return Pedido.fromJson(json as Map<String, dynamic>);
  }
}
