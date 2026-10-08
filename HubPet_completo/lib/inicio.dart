import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/petshop.dart';
import 'services/petshop_service.dart';
import 'home.dart';
import 'lista_petshops.dart';
import 'produtos_categoria.dart';
import 'produtos_petshop.dart';
import 'agendar.dart';
import 'telainicio.dart';
import 'recarrega_ao_voltar.dart';
import 'rodape_nav.dart';

class InicioPage extends StatefulWidget {
  const InicioPage({super.key});

  @override
  State<InicioPage> createState() => _InicioPageState();
}

class _InicioPageState extends State<InicioPage>
    with RouteAware, RecarregaAoVoltar {
  List<Petshop> _petshops = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregarPetshops();
  }

  // Refaz a consulta sempre que a Home volta a ficar visível (também
  // atualiza o cabeçalho "Olá, <nome>" porque _carregarPetshops chama
  // setState).
  @override
  void recarregar() => _carregarPetshops();

  void _abrirLogin() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const Telainicio(voltarAposLogin: true),
      ),
    );
    if (mounted) setState(() {});
  }

  Future<void> _carregarPetshops() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final petshops = await PetshopService.listar();
      setState(() {
        // Mostra só os 3 primeiros aqui — a lista completa fica em
        // ListaPetshopsPage ("Ver todos").
        _petshops = petshops.take(3).toList();
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  // Primeiro nome do usuário, com fallback caso venha vazio da API.
  String _primeiroNome(String nome) {
    final limpo = nome.trim();
    if (limpo.isEmpty) return 'Usuário';
    return limpo.split(' ').first;
  }

  // Abre a listagem com produtos de vários petshops, já filtrada
  // pela categoria selecionada.
  void _abrirCategoria(BuildContext context, String categoria) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProdutosCategoriaPage(categoriaInicial: categoria),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final usuario = AppData.usuarioLogado;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF6A0DAD), Color(0xFF9C27B0)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const Home()),
                      ),
                      child: const CircleAvatar(
                        backgroundColor: Colors.white,
                        child: Icon(Icons.person, color: Color(0xFF6A0DAD)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            usuario == null
                                ? 'Olá! 👋'
                                : 'Olá, ${_primeiroNome(usuario.nome)} 👋',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            usuario == null
                                ? 'Faça login para comprar'
                                : 'O que seu pet precisa hoje?',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: Colors.white70, fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    // Login não é mais obrigatório na abertura do app: aqui
                    // o cliente entra se quiser (o login "de verdade" é
                    // pedido no fechamento da compra — ver carrinho.dart).
                    if (usuario == null)
                      ElevatedButton.icon(
                        onPressed: _abrirLogin,
                        icon: const Icon(Icons.login, size: 18),
                        label: const Text('Entrar'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.orange,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      )
                    else
                      IconButton(
                        icon: const Icon(Icons.logout, color: Colors.white70),
                        tooltip: 'Sair',
                        onPressed: () => setState(() => AppData.logout()),
                      ),
                  ],
                ),
              ),

              // Campo de busca
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: TextField(
                  readOnly: true,
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                        builder: (_) => const ListaPetshopsPage()),
                  ),
                  decoration: InputDecoration(
                    hintText: 'Buscar petshops',
                    prefixIcon: const Icon(Icons.search),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(20),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 20),

              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Categorias de produtos + serviços ──
                        Row(
                          children: [
                            Container(
                              width: 4,
                              height: 18,
                              decoration: BoxDecoration(
                                color: const Color(0xFF6A0DAD),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'Categorias',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 17),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        GridView.count(
                          crossAxisCount: 3,
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          crossAxisSpacing: 14,
                          mainAxisSpacing: 14,
                          childAspectRatio: 0.92,
                          children: [
                            _CategoriaCard(
                              icon: Icons.rice_bowl,
                              nome: 'Rações',
                              cores: const [
                                Color(0xFF6A0DAD),
                                Color(0xFF9C27B0)
                              ],
                              onTap: () => _abrirCategoria(context, 'racoes'),
                            ),
                            _CategoriaCard(
                              icon: Icons.cookie,
                              nome: 'Petiscos',
                              cores: const [
                                Color(0xFFFF9800),
                                Color(0xFFFFB74D)
                              ],
                              onTap: () => _abrirCategoria(context, 'petiscos'),
                            ),
                            _CategoriaCard(
                              icon: Icons.shower,
                              nome: 'Higiene',
                              cores: const [
                                Color(0xFF00ACC1),
                                Color(0xFF26C6DA)
                              ],
                              onTap: () => _abrirCategoria(context, 'higiene'),
                            ),
                            _CategoriaCard(
                              icon: Icons.toys,
                              nome: 'Brinquedos',
                              cores: const [
                                Color(0xFFE91E63),
                                Color(0xFFF06292)
                              ],
                              onTap: () =>
                                  _abrirCategoria(context, 'brinquedos'),
                            ),
                            _CategoriaCard(
                              icon: Icons.medical_services,
                              nome: 'Serviços',
                              cores: const [
                                Color(0xFF43A047),
                                Color(0xFF66BB6A)
                              ],
                              onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => const AgendarPage())),
                            ),
                          ],
                        ),

                        const SizedBox(height: 25),

                        // ── Petshops ──
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Petshops',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            TextButton(
                              onPressed: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) =>
                                          const ListaPetshopsPage())),
                              child: const Text('Ver todos'),
                            ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        if (_carregando)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Center(child: CircularProgressIndicator()),
                          )
                        else if (_erro != null)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            child: Column(
                              children: [
                                Text(_erro!,
                                    style: const TextStyle(color: Colors.grey)),
                                TextButton(
                                  onPressed: _carregarPetshops,
                                  child: const Text('Tentar novamente'),
                                ),
                              ],
                            ),
                          )
                        else
                          ..._petshops.map((p) => _cardPetshop(context, p)),
                      ],
                    ),
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

  Widget _cardPetshop(BuildContext context, Petshop p) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => ProdutosPetshopPage(
            petshopId: p.id,
            nome: p.nome,
            nota: p.notaFormatada,
            distancia: p.distanciaFormatada,
          ),
        ),
      ),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: Colors.grey.shade100,
        ),
        child: Row(
          children: [
            CircleAvatar(
              backgroundColor: const Color(0xFF6A0DAD).withAlpha(30),
              child: const Icon(Icons.pets, color: Color(0xFF6A0DAD)),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(p.nome,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.orange, size: 14),
                      Text(p.notaFormatada,
                          style: const TextStyle(fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}

// ── Widgets auxiliares ──

class _CategoriaCard extends StatelessWidget {
  final IconData icon;
  final String nome;
  final List<Color> cores;
  final VoidCallback onTap;

  const _CategoriaCard({
    required this.icon,
    required this.nome,
    required this.cores,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: cores.first.withAlpha(18),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: cores.first.withAlpha(35)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: cores,
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: cores.first.withAlpha(90),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Icon(icon, color: Colors.white, size: 26),
            ),
            const SizedBox(height: 8),
            Text(
              nome,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: cores.first,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
