import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/produto_oferta.dart';
import 'services/produto_service.dart';
import 'carrinho.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

// ============================================================
// PRODUTOS POR CATEGORIA — agrega ofertas de vários petshops
// Aberta ao tocar em uma categoria na InicioPage.
// O mesmo produto aparece em petshops diferentes, com preços
// diferentes, para o usuário comparar.
// ============================================================

class ProdutosCategoriaPage extends StatefulWidget {
  final String categoriaInicial;

  const ProdutosCategoriaPage({super.key, this.categoriaInicial = 'todos'});

  @override
  State<ProdutosCategoriaPage> createState() => _ProdutosCategoriaPageState();
}

class _ProdutosCategoriaPageState extends State<ProdutosCategoriaPage>
    with RouteAware, RecarregaAoVoltar {
  final _buscaCtrl = TextEditingController();
  String _busca = '';
  late String _categoriaSelecionada;

  List<ProdutoOferta> _ofertas = [];
  bool _carregando = true;
  String? _erro;

  static const Color _roxo = Color(0xFF6A0DAD);

  // ── Categorias (chips do topo) ──
  static const List<Map<String, String>> _categorias = [
    {'id': 'todos', 'label': 'Todos'},
    {'id': 'racoes', 'label': 'Rações'},
    {'id': 'petiscos', 'label': 'Petiscos'},
    {'id': 'higiene', 'label': 'Higiene'},
    {'id': 'brinquedos', 'label': 'Brinquedos'},
  ];

  static const Map<String, String> _titulos = {
    'todos': 'Produtos',
    'racoes': 'Rações',
    'petiscos': 'Petiscos',
    'higiene': 'Higiene',
    'brinquedos': 'Brinquedos',
  };

  @override
  void initState() {
    super.initState();
    _categoriaSelecionada = widget.categoriaInicial;
    _carregarOfertas();
  }

  @override
  void recarregar() => _carregarOfertas();

  Future<void> _carregarOfertas() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      // Busca tudo uma vez só; categoria e busca continuam filtradas
      // no client (como já era antes), pra trocar de chip sem nova
      // requisição a cada clique.
      final ofertas = await ProdutoService.ofertasPorCategoria();
      setState(() {
        _ofertas = ofertas;
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  List<ProdutoOferta> get _ofertasVisiveis {
    return _ofertas.where((o) {
      final bateCategoria = _categoriaSelecionada == 'todos' ||
          o.categoria == _categoriaSelecionada;
      final bateBusca = o.nome.toLowerCase().contains(_busca.toLowerCase());
      return bateCategoria && bateBusca;
    }).toList();
  }

  void _adicionar(ProdutoOferta o) {
    setState(() => AppData.adicionarAoCarrinho(
          o.nome,
          o.preco,
          o.petshopNome ?? 'Petshop',
          petshopId: o.petshopId,
        ));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${o.nome} (${o.petshopNome}) adicionado 🛒'),
        backgroundColor: _roxo,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(milliseconds: 1200),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  void dispose() {
    _buscaCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final visiveis =
        _carregando || _erro != null ? <ProdutoOferta>[] : _ofertasVisiveis;

    return Scaffold(
      floatingActionButton: AppData.qtdCarrinho == 0
          ? null
          : FloatingActionButton.extended(
              backgroundColor: Colors.orange,
              onPressed: () async {
                await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CarrinhoPage()),
                );
                setState(() {}); // atualiza o contador ao voltar
              },
              icon: const Icon(Icons.shopping_cart, color: Colors.white),
              label: Text(
                '${AppData.qtdCarrinho} ${AppData.qtdCarrinho == 1 ? 'item' : 'itens'}',
                style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [_roxo, Color(0xFF9C27B0)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // ── Cabeçalho ──
              Padding(
                padding: const EdgeInsets.fromLTRB(10, 10, 15, 10),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.pop(context),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withAlpha(40),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.arrow_back,
                            color: Colors.white, size: 22),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _titulos[_categoriaSelecionada] ?? 'Produtos',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${visiveis.length} ofertas de vários petshops',
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ── Busca ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 15),
                child: TextField(
                  controller: _buscaCtrl,
                  onChanged: (v) => setState(() => _busca = v),
                  decoration: InputDecoration(
                    hintText: 'Buscar produtos...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _busca.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _buscaCtrl.clear();
                              setState(() => _busca = '');
                            },
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 14),

              // ── Chips de categoria ──
              SizedBox(
                height: 38,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  itemCount: _categorias.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 10),
                  itemBuilder: (context, i) {
                    final cat = _categorias[i];
                    final selecionado = _categoriaSelecionada == cat['id'];
                    return GestureDetector(
                      onTap: () =>
                          setState(() => _categoriaSelecionada = cat['id']!),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 8),
                        decoration: BoxDecoration(
                          color: selecionado ? Colors.orange : Colors.white,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          cat['label']!,
                          style: TextStyle(
                            color: selecionado ? Colors.white : _roxo,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 16),

              // ── Lista de ofertas ──
              Expanded(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(15, 15, 15, 0),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF5F5F5),
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: _carregando
                      ? const Center(child: CircularProgressIndicator())
                      : _erro != null
                          ? Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(_erro!,
                                      textAlign: TextAlign.center,
                                      style:
                                          const TextStyle(color: Colors.grey)),
                                  const SizedBox(height: 12),
                                  OutlinedButton(
                                    onPressed: _carregarOfertas,
                                    child: const Text('Tentar novamente'),
                                  ),
                                ],
                              ),
                            )
                          : visiveis.isEmpty
                              ? Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Text('🔍',
                                          style: TextStyle(fontSize: 48)),
                                      const SizedBox(height: 12),
                                      Text(
                                        'Nenhum produto encontrado'
                                        '${_busca.isNotEmpty ? '\npara "$_busca"' : ''}',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                            color: Colors.grey, fontSize: 15),
                                      ),
                                    ],
                                  ),
                                )
                              : ListView.builder(
                                  padding: const EdgeInsets.only(bottom: 80),
                                  itemCount: visiveis.length,
                                  itemBuilder: (context, i) =>
                                      _cardOferta(visiveis[i]),
                                ),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const RodapeNav(),
    );
  }

  // ── Card de uma oferta (produto + petshop) ──
  Widget _cardOferta(ProdutoOferta o) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(blurRadius: 6, offset: Offset(0, 3), color: Colors.black12),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Foto do produto (com fallback caso a imagem falte)
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.asset(
              o.imagem,
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => CustomPaint(
                painter: _HachuraPainter(),
                child: const SizedBox(
                  width: 80,
                  height: 80,
                  child: Center(
                    child: Text(
                      'foto do\nproduto',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 10, color: Color(0xFF9C8FB0)),
                    ),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  o.nome,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  o.descricao,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                const SizedBox(height: 6),
                // Petshop que oferece
                Row(
                  children: [
                    const Icon(Icons.store, size: 14, color: _roxo),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        o.petshopNome ?? '-',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                            color: _roxo,
                            fontSize: 12,
                            fontWeight: FontWeight.w600),
                      ),
                    ),
                    const Icon(Icons.star, color: Colors.orange, size: 13),
                    const SizedBox(width: 2),
                    Text(o.petshopNotaFormatada,
                        style:
                            const TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      o.precoFormatado,
                      style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _adicionar(o),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text(
                        'Adicionar',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Desenha a hachura diagonal do placeholder "foto do produto".
class _HachuraPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final fundo = Paint()..color = const Color(0xFFF1EBFA);
    canvas.drawRect(Offset.zero & size, fundo);

    final linha = Paint()
      ..color = const Color(0xFFE0D4F5)
      ..strokeWidth = 1.2;
    const passo = 10.0;
    for (double x = -size.height; x < size.width; x += passo) {
      canvas.drawLine(
          Offset(x, 0), Offset(x + size.height, size.height), linha);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
