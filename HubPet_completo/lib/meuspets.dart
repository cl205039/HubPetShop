import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/pet.dart';
import 'services/pet_service.dart';
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

// ---------------- CARD ----------------

class PetCard extends StatelessWidget {
  final String nome, tipo, raca, idade, peso, nascimento, sexo;

  const PetCard({
    super.key,
    required this.nome,
    required this.tipo,
    required this.raca,
    required this.idade,
    required this.peso,
    required this.nascimento,
    required this.sexo,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            children: [
              const CircleAvatar(
                radius: 30,
                backgroundColor: Colors.grey,
                child: Icon(Icons.pets, color: Colors.white),
              ),
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
