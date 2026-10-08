// ============================================================
// APP DATA — sessão do usuário logado + carrinho de compras.
//
// Antes desta classe guardava TODOS os dados do app (usuários,
// agendamentos, pedidos...) como listas mockadas em memória. Agora
// esses dados vêm da API via lib/services/ — aqui fica só o que é
// estado local da sessão atual, que não faz sentido buscar de novo
// a cada tela: quem está logado, e o carrinho de compras (que só
// vira um Pedido de verdade, salvo na API, no fechamento da compra).
//
// `Usuario` e `Pedido` continuam exportados daqui para os arquivos
// que já importavam `app_data.dart` não precisarem trocar o import.
// ============================================================

export 'models/usuario.dart';
export 'models/pedido.dart';

import 'models/usuario.dart';

// Item dentro do carrinho de compras. É estado local — não vem da
// API e não tem `fromJson`/`toJson` — só vira um ItemPedido de
// verdade quando o pedido é criado via PedidoService.
class ItemCarrinho {
  final String nome;
  final double preco;
  final String petshop; // nome do petshop (exibição)
  int? petshopId; // id do petshop — vai no pedido ao fechar a compra
  int quantidade;

  ItemCarrinho({
    required this.nome,
    required this.preco,
    required this.petshop,
    this.petshopId,
    this.quantidade = 1,
  });

  double get subtotal => preco * quantidade;
}

class AppData {
  // ── Usuário logado no momento ──
  static Usuario? usuarioLogado;

  // Não há sessão/token no servidor pra invalidar — só limpa localmente.
  static void logout() {
    usuarioLogado = null;
  }

  // ══════════════════ CARRINHO ══════════════════
  static List<ItemCarrinho> carrinho = [];

  static double get totalCarrinho =>
      carrinho.fold(0.0, (s, i) => s + i.subtotal);

  static int get qtdCarrinho => carrinho.fold(0, (s, i) => s + i.quantidade);

  // Adiciona um produto; se já existir (mesmo nome/petshop), soma a quantidade.
  static void adicionarAoCarrinho(String nome, double preco, String petshop,
      {int? petshopId}) {
    // `0`/negativo = a API não devolveu um id de verdade — trata como ausente
    // pra não mandar um id inválido no pedido.
    final id = (petshopId != null && petshopId > 0) ? petshopId : null;
    for (final item in carrinho) {
      if (item.nome == nome && item.petshop == petshop) {
        item.quantidade++;
        // Preenche o id se o item já existia sem ele (ex.: adicionado
        // por uma tela antiga que não passava petshopId).
        item.petshopId ??= id;
        return;
      }
    }
    carrinho.add(ItemCarrinho(
      nome: nome,
      preco: preco,
      petshop: petshop,
      petshopId: id,
    ));
  }

  static void removerDoCarrinho(ItemCarrinho item) {
    carrinho.remove(item);
  }

  static void limparCarrinho() {
    carrinho = [];
  }
}
