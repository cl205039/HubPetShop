import 'package:flutter/material.dart';
import 'api_client.dart';
import 'app_data.dart';
import 'models/petshop.dart';
import 'services/petshop_service.dart';
import 'services/endereco_service.dart';
import 'services/geocoding_service.dart';
import 'produtos_petshop.dart';
import 'petshops_favoritos.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

class ListaPetshopsPage extends StatefulWidget {
  const ListaPetshopsPage({super.key});

  @override
  State<ListaPetshopsPage> createState() => _ListaPetshopsPageState();
}

enum _Ordenacao { relevancia, nota, distancia }

class _ListaPetshopsPageState extends State<ListaPetshopsPage>
    with RouteAware, RecarregaAoVoltar {
  final _buscaCtrl = TextEditingController();

  List<Petshop> _petshops = [];
  List<Petshop> _petshopsFiltrados = [];
  bool _carregando = true;
  String? _erro;

  _Ordenacao _ordenacao = _Ordenacao.relevancia;
  double _notaMinima = 0;
  double _distanciaMaxima = 50;

  Coordenadas? _coordUsuario;

  @override
  void initState() {
    super.initState();
    _carregarPetshops();
    _geocodificarEnderecoUsuario();
  }

  Future<void> _geocodificarEnderecoUsuario() async {
    final usuarioId = AppData.usuarioLogado?.id;
    if (usuarioId == null) return;
    try {
      final enderecos = await EnderecoService.listar(usuarioId);
      if (enderecos.isEmpty) return;
      final e = enderecos.firstWhere((e) => e.principal,
          orElse: () => enderecos.first);
      final texto = '${e.rua}, ${e.numero}, ${e.bairro}, ${e.cidade}';
      final coord = await GeocodingService.buscar(texto);
      if (coord != null && mounted) {
        _coordUsuario = coord;
        _aplicarFiltro();
      }
    } catch (_) {
    }
  }

  double _distanciaKm(Petshop p) {
    if (_coordUsuario != null) {
      final real = p.distanciaRealKm(_coordUsuario!.lat, _coordUsuario!.lng);
      if (real != null) return real;
    }
    return p.distanciaKm;
  }

  String _distanciaExibida(Petshop p) {
    if (_coordUsuario != null) {
      final real =
          p.distanciaRealFormatada(_coordUsuario!.lat, _coordUsuario!.lng);
      if (real != null) return real;
    }
    return p.distanciaFormatada;
  }

  @override
  void recarregar() => _carregarPetshops();
//4
  Future<void> _carregarPetshops() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final petshops = await PetshopService.listar();
      setState(() {
        _petshops = petshops;
        _carregando = false;
      });
      _aplicarFiltro();
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  void _filtrar(String texto) => _aplicarFiltro();

  void _aplicarFiltro() {
    var lista = _petshops.where((p) {
      final bateBusca =
          p.nome.toLowerCase().contains(_buscaCtrl.text.toLowerCase());
      final bateNota = p.nota >= _notaMinima;
      final bateDistancia = _distanciaKm(p) <= _distanciaMaxima;
      return bateBusca && bateNota && bateDistancia;
    }).toList();

    switch (_ordenacao) {
      case _Ordenacao.relevancia:
        break;
      case _Ordenacao.nota:
        lista.sort((a, b) => b.nota.compareTo(a.nota));
        break;
      case _Ordenacao.distancia:
        lista.sort((a, b) => _distanciaKm(a).compareTo(_distanciaKm(b)));
        break;
    }

    setState(() => _petshopsFiltrados = lista);
  }

  bool get _filtroAtivo =>
      _ordenacao != _Ordenacao.relevancia || _notaMinima > 0 || _distanciaMaxima < 50;

  void _abrirFiltros() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setStateSheet) => Padding(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const Text('Ordenar e filtrar',
                  style:
                      TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              const Text('Ordenar por',
                  style: TextStyle(fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Relevância'),
                    selected: _ordenacao == _Ordenacao.relevancia,
                    onSelected: (_) => setStateSheet(
                        () => _ordenacao = _Ordenacao.relevancia),
                  ),
                  ChoiceChip(
                    label: const Text('Nota'),
                    selected: _ordenacao == _Ordenacao.nota,
                    onSelected: (_) =>
                        setStateSheet(() => _ordenacao = _Ordenacao.nota),
                  ),
                  ChoiceChip(
                    label: const Text('Distância'),
                    selected: _ordenacao == _Ordenacao.distancia,
                    onSelected: (_) => setStateSheet(
                        () => _ordenacao = _Ordenacao.distancia),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Text('Nota mínima: ${_notaMinima.toStringAsFixed(1)} ⭐',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: _notaMinima,
                min: 0,
                max: 5,
                divisions: 10,
                activeColor: const Color(0xFF6A0DAD),
                label: _notaMinima.toStringAsFixed(1),
                onChanged: (v) => setStateSheet(() => _notaMinima = v),
              ),
              const SizedBox(height: 8),
              Text(
                  'Distância máxima: ${_distanciaMaxima >= 50 ? 'sem limite' : '${_distanciaMaxima.toStringAsFixed(0)} km'}',
                  style: const TextStyle(fontWeight: FontWeight.w600)),
              Slider(
                value: _distanciaMaxima,
                min: 1,
                max: 50,
                divisions: 49,
                activeColor: const Color(0xFF6A0DAD),
                label: _distanciaMaxima >= 50
                    ? 'sem limite'
                    : '${_distanciaMaxima.toStringAsFixed(0)} km',
                onChanged: (v) => setStateSheet(() => _distanciaMaxima = v),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setStateSheet(() {
                          _ordenacao = _Ordenacao.relevancia;
                          _notaMinima = 0;
                          _distanciaMaxima = 50;
                        });
                      },
                      child: const Text('Limpar'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF6A0DAD)),
                      onPressed: () {
                        Navigator.pop(context);
                        _aplicarFiltro();
                      },
                      child: const Text('Aplicar',
                          style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
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
              Padding(
                padding: const EdgeInsets.all(15),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                      tooltip: 'Voltar',
                    ),
                    const Expanded(
                      child: Text(
                        "Petshops",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Icon(
                        _filtroAtivo
                            ? Icons.filter_alt
                            : Icons.filter_alt_outlined,
                        color: Colors.white,
                      ),
                      tooltip: 'Ordenar e filtrar',
                      onPressed: _abrirFiltros,
                    ),
                    IconButton(
                      icon: const Icon(Icons.favorite, color: Colors.white),
                      tooltip: 'Ver favoritos',
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const PetshopsFavoritosPage(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),

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
                            tooltip: 'Limpar busca',
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
      itemBuilder: (context, index) => _itemPetshop(_petshopsFiltrados[index]),
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
          distancia: _distanciaExibida(p),
        ),
      ),
    );
  }

  Widget _itemPetshop(Petshop p) {
    final favorito = AppData.ehFavorito(p.id);
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
                      const SizedBox(width: 10),
                      const Icon(Icons.location_on,
                          color: Colors.grey, size: 14),
                      const SizedBox(width: 2),
                      Text(_distanciaExibida(p),
                          style: const TextStyle(
                              color: Colors.grey, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
            Semantics(
              button: true,
              label: favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos',
              child: GestureDetector(
                onTap: () =>
                    setState(() => AppData.alternarFavorito(p.id)),
                child: Icon(
                  favorito ? Icons.favorite : Icons.favorite_border,
                  color: Colors.orange,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
