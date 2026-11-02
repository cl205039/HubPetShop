import 'package:flutter/material.dart';
import 'api_client.dart';
import 'app_data.dart';
import 'models/petshop.dart';
import 'services/petshop_service.dart';
import 'produtos_petshop.dart';
import 'recarrega_ao_voltar.dart';

class PetshopsFavoritosPage extends StatefulWidget {
  const PetshopsFavoritosPage({super.key});

  @override
  State<PetshopsFavoritosPage> createState() => _PetshopsFavoritosPageState();
}

class _PetshopsFavoritosPageState extends State<PetshopsFavoritosPage>
    with RouteAware, RecarregaAoVoltar {
  List<Petshop> _favoritos = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void recarregar() => _carregar();
//2
  Future<void> _carregar() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final petshops = await PetshopService.listar();
      setState(() {
        _favoritos =
            petshops.where((p) => AppData.ehFavorito(p.id)).toList();
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
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
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(15),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      tooltip: 'Voltar',
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      'Petshops favoritos',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Container(
                  width: double.infinity,
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
              onPressed: _carregar,
              child: const Text('Tentar novamente'),
            ),
          ],
        ),
      );
    }
    if (_favoritos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.favorite_border, size: 48, color: Colors.grey),
            const SizedBox(height: 12),
            const Text(
              'Você ainda não tem petshops favoritos',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 15),
            ),
            const SizedBox(height: 4),
            const Text(
              'Toque no coraçãozinho na lista de petshops\npara adicionar aqui.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
        ),
      );
    }
    return ListView.builder(
      itemCount: _favoritos.length,
      itemBuilder: (context, index) => _itemPetshop(_favoritos[index]),
    );
  }

  Widget _itemPetshop(Petshop p) {
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
            Semantics(
              button: true,
              label: 'Remover dos favoritos',
              child: GestureDetector(
                onTap: () => setState(() {
                  AppData.alternarFavorito(p.id);
                  _favoritos.removeWhere((f) => f.id == p.id);
                }),
                child: const Icon(Icons.favorite, color: Colors.orange),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
