import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/pet.dart';
import 'services/pet_service.dart';
import 'services/raca_service.dart';
import 'cadastrar_pet.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

class MeusPets extends StatefulWidget {
  const MeusPets({super.key});

  @override
  State<MeusPets> createState() => _MeusPetsState();
}

class _MeusPetsState extends State<MeusPets>
    with RouteAware, RecarregaAoVoltar {
  List<Pet> _pets = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregarPets();
  }

  @override
  void recarregar() => _carregarPets();

  void _abrirCarteirinha(int petId, String nomePet) {
    final nomeCtrl = TextEditingController();
    final dataCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setStateSheet) {
          final vacinas = AppData.vacinasDoPet(petId);
          return Padding(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 16,
              bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            ),
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
                Text('Carteirinha de vacinação — $nomePet',
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                if (vacinas.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('Nenhuma vacina registrada ainda.',
                        style: TextStyle(color: Colors.grey)),
                  )
                else
                  ...vacinas.map((v) => ListTile(
                        contentPadding: EdgeInsets.zero,
                        leading:
                            const Icon(Icons.vaccines, color: Colors.orange),
                        title: Text(v.nome),
                        subtitle: Text(v.data),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline,
                              color: Colors.red),
                          tooltip: 'Remover',
                          onPressed: () => setStateSheet(
                              () => AppData.removerVacina(petId, v)),
                        ),
                      )),
                const Divider(height: 24),
                TextField(
                  controller: nomeCtrl,
                  decoration: InputDecoration(
                    labelText: 'Vacina',
                    hintText: 'Ex.: Antirrábica',
                    filled: true,
                    fillColor: const Color(0xFFF5F5F5),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                TextField(
                  controller: dataCtrl,
                  decoration: InputDecoration(
                    labelText: 'Data',
                    hintText: 'Ex.: 10/05/2026',
                    filled: true,
                    fillColor: const Color(0xFFF5F5F5),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.orange),
                    onPressed: () {
                      if (nomeCtrl.text.trim().isEmpty ||
                          dataCtrl.text.trim().isEmpty) {
                        return;
                      }
                      setStateSheet(() {
                        AppData.adicionarVacina(
                            petId, nomeCtrl.text.trim(), dataCtrl.text.trim());
                        nomeCtrl.clear();
                        dataCtrl.clear();
                      });
                    },
                    icon: const Icon(Icons.add),
                    label: const Text('Adicionar vacina'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    ).whenComplete(() {
      nomeCtrl.dispose();
      dataCtrl.dispose();
    });
  }

  Future<void> _carregarPets() async {
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
      final pets = await PetService.listar(usuarioId);
      setState(() {
        _pets = pets;
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
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF4A148C),
              Color(0xFF6A1B9A),
            ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                    tooltip: 'Voltar',
                  ),
                  const Text(
                    "Meus Pets",
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (_carregando)
                const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                )
              else if (_erro != null)
                Padding(
                  padding: const EdgeInsets.only(top: 40),
                  child: Column(
                    children: [
                      Text(
                        _erro!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: Colors.white),
                      ),
                      const SizedBox(height: 12),
                      OutlinedButton(
                        style: OutlinedButton.styleFrom(
                            foregroundColor: Colors.white,
                            side: const BorderSide(color: Colors.white)),
                        onPressed: _carregarPets,
                        child: const Text('Tentar novamente'),
                      ),
                    ],
                  ),
                )
              else if (_pets.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(top: 40),
                  child: Center(
                    child: Text(
                      'Nenhum pet cadastrado ainda 🐾',
                      style: TextStyle(color: Colors.white),
                    ),
                  ),
                )
              else
                ..._pets.map((pet) => Column(
                      children: [
                        PetCard(
                          nome: pet.nome,
                          tipo: pet.tipo,
                          raca: pet.raca,
                          idade: pet.idade,
                          peso: pet.peso,
                          nascimento: pet.nascimento,
                          sexo: pet.sexo,
                          onCarteirinha: pet.id == null
                              ? null
                              : () => _abrirCarteirinha(pet.id!, pet.nome),
                        ),
                        const SizedBox(height: 15),
                      ],
                    )),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
                ),
                onPressed: () async {
                  final novoPet = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const CadastroPetPage(),
                    ),
                  );

                  if (novoPet is Pet) {
                    setState(() => _pets.add(novoPet));
                  }
                },
                icon: const Icon(Icons.add),
                label: const Text("Cadastrar novo pet"),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const RodapeNav(),
    );
  }
}

class _FotoRaca extends StatefulWidget {
  final String raca;
  const _FotoRaca({required this.raca});

  @override
  State<_FotoRaca> createState() => _FotoRacaState();
}

class _FotoRacaState extends State<_FotoRaca> {
  String? _url;

  @override
  void initState() {
    super.initState();
    RacaService.imagem(widget.raca).then((url) {
      if (mounted && url != null) setState(() => _url = url);
    });
  }

  @override
  Widget build(BuildContext context) {
    return CircleAvatar(
      radius: 30,
      backgroundColor: Colors.grey,
      backgroundImage: _url == null ? null : NetworkImage(_url!),
      child: _url == null ? const Icon(Icons.pets, color: Colors.white) : null,
    );
  }
}

class PetCard extends StatelessWidget {
  final String nome, tipo, raca, idade, peso, nascimento, sexo;
  final VoidCallback? onCarteirinha;

  const PetCard({
    super.key,
    required this.nome,
    required this.tipo,
    required this.raca,
    required this.idade,
    required this.peso,
    required this.nascimento,
    required this.sexo,
    this.onCarteirinha,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  _FotoRaca(raca: raca),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: Colors.orange,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.edit, size: 14),
                    ),
                  ),
                ],
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      nome,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 5),
                    _info(Icons.pets, tipo),
                    _info(Icons.pets, "Raça: $raca"),
                    _info(Icons.cake, "Idade: $idade"),
                    _info(Icons.monitor_weight, "Peso: $peso"),
                    _info(Icons.calendar_today, "Nascimento: $nascimento"),
                    _info(Icons.pets, "Sexo: $sexo"),
                  ],
                ),
              )
            ],
          ),
          if (onCarteirinha != null) ...[
            const Divider(height: 20),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  foregroundColor: const Color(0xFF6A0DAD),
                  side: const BorderSide(color: Color(0xFF6A0DAD)),
                ),
                onPressed: onCarteirinha,
                icon: const Icon(Icons.vaccines, size: 18),
                label: const Text('Carteirinha de vacinação'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _info(IconData icon, String texto) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.orange),
        const SizedBox(width: 5),
        Text(texto),
      ],
    );
  }
}
