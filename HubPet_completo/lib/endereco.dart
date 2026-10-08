import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'services/pedido_service.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

// ============================================================
// PEDIDOS — acompanhamento de pedidos estilo iFood
// Abas: "Em andamento" e "Concluídos".
// Status: Confirmado pela clínica → Em preparação →
//         Saiu para entrega → Entregue.
// Os pedidos vêm da API via PedidoService.
// ============================================================

class PedidosPage extends StatefulWidget {
  const PedidosPage({super.key});

  @override
  State<PedidosPage> createState() => _PedidosPageState();
}

class _PedidosPageState extends State<PedidosPage>
    with RouteAware, RecarregaAoVoltar {
  static const Color _roxo = Color(0xFF6A0DAD);

  // Etapas do pedido (timeline).
  static const List<String> _etapas = [
    'Confirmado pela clínica',
    'Em preparação',
    'Saiu para entrega',
    'Entregue',
  ];

  List<Pedido> _pedidos = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void recarregar() => _carregar();

  Future<void> _carregar() async {
    final usuarioId = AppData.usuarioLogado?.id;
    if (usuarioId == null) {
      setState(() {
        _carregando = false;
        _erro = 'Nenhum usuário logado.';
      });
      return;
    }

    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final pedidos = await PedidoService.listar(usuarioId);
      setState(() {
        _pedidos = pedidos;
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  Color _corEtapa(int etapa) {
    switch (etapa) {
      case 0:
        return Colors.blue;
      case 1:
        return Colors.orange;
      case 2:
        return _roxo;
      default:
        return Colors.green;
    }
  }

  String _formatarPreco(double v) =>
      'R\$ ${v.toStringAsFixed(2).replaceAll('.', ',')}';

  @override
  Widget build(BuildContext context) {
    final emAndamento = _pedidos.where((p) => !p.concluido).toList();
    final concluidos = _pedidos.where((p) => p.concluido).toList();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        body: Container(
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF4A148C), Color(0xFF6A1B9A)],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
          child: SafeArea(
            bottom: false,
            child: Column(
              children: [
                // Topo
                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                      const Text(
                        'Meus Pedidos',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),

                // Abas
                const TabBar(
                  indicatorColor: Colors.orange,
                  indicatorWeight: 3,
                  labelColor: Colors.white,
                  unselectedLabelColor: Colors.white60,
                  labelStyle: TextStyle(fontWeight: FontWeight.bold),
                  tabs: [
                    Tab(text: 'Em andamento'),
                    Tab(text: 'Concluídos'),
                  ],
                ),

                const SizedBox(height: 10),

                Expanded(
                  child: Container(
                    width: double.infinity,
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
                                        style: const TextStyle(
                                            color: Colors.grey)),
                                    const SizedBox(height: 12),
                                    OutlinedButton(
                                      onPressed: _carregar,
                                      child: const Text('Tentar novamente'),
                                    ),
                                  ],
                                ),
                              )
                            : TabBarView(
                                children: [
                                  _lista(emAndamento,
                                      'Nenhum pedido em andamento 🐾'),
                                  _lista(concluidos,
                                      'Nenhum pedido concluído ainda'),
                                ],
                              ),
                  ),
                ),
              ],
            ),
          ),
        ),
        bottomNavigationBar: const RodapeNav(),
      ),
    );
  }

  Widget _lista(List<Pedido> pedidos, String vazio) {
    if (pedidos.isEmpty) {
      return Center(
        child: Text(vazio,
            style: const TextStyle(color: Colors.grey, fontSize: 15)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: pedidos.length,
      itemBuilder: (context, i) => _cardPedido(context, pedidos[i]),
    );
  }

  Widget _cardPedido(BuildContext context, Pedido p) {
    final cor = _corEtapa(p.etapa);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(blurRadius: 6, offset: Offset(0, 3), color: Colors.black12),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabeçalho: loja + status
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: _roxo.withAlpha(30),
                child: const Icon(Icons.store, color: _roxo),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.loja,
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    Text(p.data,
                        style:
                            const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: cor.withAlpha(25),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  _etapas[p.etapa],
                  style: TextStyle(
                      color: cor, fontSize: 11, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),

          const Divider(height: 24),

          // Itens
          ...p.itens.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: Row(
                children: [
                  const Icon(Icons.pets, size: 14, color: Colors.grey),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text('${item.quantidade}x ${item.nome}',
                        style: const TextStyle(fontSize: 13)),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Timeline (só para pedidos em andamento)
          if (!p.concluido) _timeline(p.etapa, cor),

          const SizedBox(height: 12),

          // Rodapé: total + ação
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Text('Total: ',
                      style: TextStyle(color: Colors.grey, fontSize: 13)),
                  Text(
                    _formatarPreco(p.total),
                    style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                        fontSize: 15),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // Linha do tempo horizontal com 4 etapas.
  Widget _timeline(int etapa, Color cor) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: cor.withAlpha(15),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(
        children: List.generate(_etapas.length, (i) {
          final feito = i <= etapa;
          return Expanded(
            child: Row(
              children: [
                Container(
                  width: 22,
                  height: 22,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: feito ? cor : Colors.grey.shade300,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    feito ? Icons.check : Icons.circle,
                    color: Colors.white,
                    size: feito ? 13 : 8,
                  ),
                ),
                if (i < _etapas.length - 1)
                  Expanded(
                    child: Container(
                      height: 3,
                      color: i < etapa ? cor : Colors.grey.shade300,
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }
}
