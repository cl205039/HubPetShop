
export 'models/usuario.dart';
export 'models/pedido.dart';

import 'models/usuario.dart';

class ItemCarrinho {
  final String nome;
  final double preco;
  final String petshop;
  int? petshopId;
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

class Avaliacao {
  final double nota;
  final String comentario;
  final DateTime data;

  Avaliacao({required this.nota, required this.comentario, required this.data});
}

class Vacina {
  final String nome;
  final String data;

  Vacina({required this.nome, required this.data});
}

class AppData {
  static Usuario? usuarioLogado;

  static void logout() {
    usuarioLogado = null;
  }

  static List<ItemCarrinho> carrinho = [];

  static double get totalCarrinho =>
      carrinho.fold(0.0, (s, i) => s + i.subtotal);

  static int get qtdCarrinho => carrinho.fold(0, (s, i) => s + i.quantidade);

  static void adicionarAoCarrinho(String nome, double preco, String petshop,
      {int? petshopId}) {
    final id = (petshopId != null && petshopId > 0) ? petshopId : null;
    for (final item in carrinho) {
      if (item.nome == nome && item.petshop == petshop) {
        item.quantidade++;
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

  static Set<int> petshopsFavoritos = {};

  static bool ehFavorito(int petshopId) =>
      petshopsFavoritos.contains(petshopId);

  static void alternarFavorito(int petshopId) {
    if (!petshopsFavoritos.remove(petshopId)) {
      petshopsFavoritos.add(petshopId);
    }
  }

  static Set<int> agendamentosCancelados = {};

  static bool agendamentoCancelado(int id) =>
      agendamentosCancelados.contains(id);

  static void cancelarAgendamento(int id) => agendamentosCancelados.add(id);

  static Map<int, List<Avaliacao>> avaliacoesPorPetshop = {};

  static void adicionarAvaliacao(
      int petshopId, double nota, String comentario) {
    (avaliacoesPorPetshop[petshopId] ??= []).add(
      Avaliacao(nota: nota, comentario: comentario, data: DateTime.now()),
    );
  }

  static List<Avaliacao> avaliacoesDoPetshop(int petshopId) =>
      avaliacoesPorPetshop[petshopId] ?? const [];

  static Map<int, List<Vacina>> vacinasPorPet = {};

  static void adicionarVacina(int petId, String nome, String data) {
    (vacinasPorPet[petId] ??= []).add(Vacina(nome: nome, data: data));
  }

  static void removerVacina(int petId, Vacina vacina) {
    vacinasPorPet[petId]?.remove(vacina);
  }

  static List<Vacina> vacinasDoPet(int petId) =>
      vacinasPorPet[petId] ?? const [];
}
