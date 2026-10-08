import 'package:flutter/material.dart';
import 'api_client.dart';
import 'models/petshop.dart';
import 'services/petshop_service.dart';
import 'produtos_petshop.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

class ListaPetshopsPage extends StatefulWidget {
  const ListaPetshopsPage({super.key});

  @override
  State<ListaPetshopsPage> createState() => _ListaPetshopsPageState();
}

class _ListaPetshopsPageState extends State<ListaPetshopsPage>
    with RouteAware, RecarregaAoVoltar {
  final _buscaCtrl = TextEditingController();

  List<Petshop> _petshops = [];
  List<Petshop> _petshopsFiltrados = [];
  List<bool> _favoritos = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregarPetshops();
  }

  @override
  void recarregar() => _carregarPetshops();

  Future<void> _carregarPetshops() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final petshops = await PetshopService.listar();
      setState(() {
        _petshops = petshops;
        _petshopsFiltrados = List.from(petshops);
        _favoritos = List.generate(petshops.length, (_) => false);
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  void _filtrar(String texto) {
    setState(() {
      _petshopsFiltrados = _petshops
          .where((p) => p.nome.toLowerCase().contains(texto.toLowerCase()))
          .toList();
    });
  }

  @override
  void dispose() {
    _buscaCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
              // Topo
              Padding(
                padding: const EdgeInsets.all(15),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      "Petshops",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),

              // Campo de busca
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 15),
                child: TextField(
                  controller: _buscaCtrl,
                  onChanged: _filtrar,
                  decoration: InputDecoration(
                    hintText: "Buscar petshop pelo nome...",
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _buscaCtrl.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _buscaCtrl.clear();
                              _filtrar('');
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

              const SizedBox(height: 15),

              // Lista
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(15),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: _conteudo(),
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const RodapeNav(),
    );
  }

  Widget _conteudo() {
    if (_carregando) {
      return const Center(child: CircularProgressIndicator());
    }
    if (_erro != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_erro!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey)),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _carregarPetshops,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }
    if (_petshopsFiltrados.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text('🔍', style: TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(
              'Nenhum petshop encontrado\npara "${_buscaCtrl.text}"',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Colors.grey,
                fontSize: 15,
              ),
            ),
          ],
        ),
      );
    }
    return ListView.builder(
      itemCount: _petshopsFiltrados.length,
      itemBuilder: (context, index) {
        // índice real para favoritos (baseado na lista original)
        final realIndex = _petshops.indexOf(_petshopsFiltrados[index]);
        return _itemPetshop(_petshopsFiltrados[index], realIndex);
      },
    );
  }

  void _abrirPetshop(Petshop p) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ProdutosPetshopPage(
          petshopId: p.id,
          nome: p.nome,
          nota: p.notaFormatada,
          distancia: p.distanciaFormatada,
        ),
      ),
    );
  }

  Widget _itemPetshop(Petshop p, int index) {
    return GestureDetector(
      onTap: () => _abrirPetshop(p),
      child: Container(
        margin: const EdgeInsets.only(bottom: 15),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: Colors.grey.shade100,
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 25,
              backgroundColor: Colors.deepPurple.withAlpha(50),
              child: const Icon(Icons.pets, color: Colors.deepPurple),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    p.nome,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 5),
                  Row(
                    children: [
                      const Icon(Icons.star, color: Colors.orange, size: 16),
                      const SizedBox(width: 4),
                      Text(p.notaFormatada),
                    ],
                  ),
                ],
              ),
            ),
            GestureDetector(
              onTap: () =>
                  setState(() => _favoritos[index] = !_favoritos[index]),
              child: Icon(
                _favoritos[index] ? Icons.favorite : Icons.favorite_border,
                color: Colors.orange,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
