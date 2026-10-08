import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/produto_oferta.dart';
import 'services/produto_service.dart';
import 'carrinho.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

// ============================================================
// PRODUTOS DO PETSHOP — listagem de produtos de um petshop
// Aberta ao tocar em um petshop na ListaPetshopsPage.
// ============================================================

class ProdutosPetshopPage extends StatefulWidget {
  final int petshopId;
  final String nome;
  final String nota;
  final String distancia;
  final String tempoEntrega;
  final String categoriaInicial;

  const ProdutosPetshopPage({
    super.key,
    required this.petshopId,
    required this.nome,
    required this.nota,
    required this.distancia,
    this.tempoEntrega = '30–45 min',
    this.categoriaInicial = 'todos',
  });

  @override
  State<ProdutosPetshopPage> createState() => _ProdutosPetshopPageState();
}

class _ProdutosPetshopPageState extends State<ProdutosPetshopPage>
    with RouteAware, RecarregaAoVoltar {
  final _buscaCtrl = TextEditingController();
  String _busca = '';
  late String _categoriaSelecionada;

  List<ProdutoOferta> _produtos = [];
  bool _carregando = true;
  String? _erro;

  static const Color _roxo = Color(0xFF6A0DAD);

  // ── Categorias (chips do topo) ──
  final List<Map<String, String>> _categorias = const [
    {'id': 'todos', 'label': 'Todos'},
    {'id': 'racoes', 'label': 'Rações'},
    {'id': 'petiscos', 'label': 'Petiscos'},
    {'id': 'higiene', 'label': 'Higiene'},
    {'id': 'brinquedos', 'label': 'Brinquedos'},
  ];

  // ── Título de cada seção (em ordem de exibição) ──
  final Map<String, String> _secoes = const {
    'racoes': 'Rações e alimentos',
    'petiscos': 'Petiscos e snacks',
    'higiene': 'Higiene e cuidados',
    'brinquedos': 'Brinquedos',
  };

  @override
  void initState() {
    super.initState();
    _categoriaSelecionada = widget.categoriaInicial;
    _carregarProdutos();
  }

  @override
  void recarregar() => _carregarProdutos();

  Future<void> _carregarProdutos() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final ofertas = await ProdutoService.ofertasDoPetshop(widget.petshopId);
      setState(() {
        _produtos = ofertas;
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  @override
  void dispose() {
    _buscaCtrl.dispose();
    super.dispose();
  }

  // Produtos de uma categoria já aplicando o filtro de busca.
  List<ProdutoOferta> _produtosDa(String categoria) {
    return _produtos.where((p) {
      final bateCategoria = p.categoria == categoria;
      final bateBusca = p.nome.toLowerCase().contains(_busca.toLowerCase());
      return bateCategoria && bateBusca;
    }).toList();
  }

  // Produtos cuja categoria não cai em nenhuma das seções conhecidas
  // (categoria vazia, com outro nome, etc.). Sem isto eles sumiam da
  // tela — a listagem só mostrava racoes/petiscos/higiene/brinquedos.
  List<ProdutoOferta> _produtosOutros() {
    final conhecidas = _secoes.keys.toSet();
    return _produtos.where((p) {
      final foraDasSecoes = !conhecidas.contains(p.categoria);
      final bateBusca = p.nome.toLowerCase().contains(_busca.toLowerCase());
      return foraDasSecoes && bateBusca;
    }).toList();
  }

  void _adicionar(ProdutoOferta p) {
    setState(() => AppData.adicionarAoCarrinho(
          p.nome,
          p.preco,
          widget.nome,
          petshopId: widget.petshopId,
        ));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${p.nome} adicionado ao carrinho 🛒'),
        backgroundColor: _roxo,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(milliseconds: 1200),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Monta as seções visíveis conforme categoria e busca.
    final List<Widget> conteudo = [];
    if (!_carregando && _erro == null) {
      for (final entry in _secoes.entries) {
        if (_categoriaSelecionada != 'todos' &&
            _categoriaSelecionada != entry.key) {
          continue;
        }
        final itens = _produtosDa(entry.key);
        if (itens.isEmpty) continue;

        conteudo.add(Padding(
          padding: const EdgeInsets.only(top: 8, bottom: 12),
          child: Text(
            entry.value,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ));
        conteudo.addAll(itens.map(_cardProduto));
      }

      // Em "Todos", garante que produtos sem categoria conhecida também
      // apareçam (antes ficavam de fora e a lista parecia incompleta).
      if (_categoriaSelecionada == 'todos') {
        final outros = _produtosOutros();
        if (outros.isNotEmpty) {
          conteudo.add(Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 12),
            child: Text(
              conteudo.isEmpty ? 'Produtos' : 'Outros produtos',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ));
          conteudo.addAll(outros.map(_cardProduto));
        }
      }
    }

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
                            widget.nome,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(Icons.star,
                                  color: Colors.orange, size: 16),
                              const SizedBox(width: 4),
                              Text(
                                widget.nota,
                                style: const TextStyle(
                                    color: Colors.white70, fontSize: 13),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // ── Busca de produtos ──
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

              // ── Lista de produtos ──
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
                                    onPressed: _carregarProdutos,
                                    child: const Text('Tentar novamente'),
                                  ),
                                ],
                              ),
                            )
                          : conteudo.isEmpty
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
                              : ListView(
                                  padding: const EdgeInsets.only(bottom: 80),
                                  children: conteudo,
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

  // ── Card de um produto ──
  Widget _cardProduto(ProdutoOferta p) {
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
              p.imagem,
              width: 78,
              height: 78,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => CustomPaint(
                painter: _HachuraPainter(),
                child: const SizedBox(
                  width: 78,
                  height: 78,
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
          // Infos
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  p.nome,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  p.descricao,
                  style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      p.precoFormatado,
                      style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                    ElevatedButton.icon(
                      onPressed: () => _adicionar(p),
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
