import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/pet.dart';
import 'services/pet_service.dart';
import 'services/raca_service.dart';

const primaryColor = Color(0xFF6A1B9A);
const accentColor = Color(0xFFFF9800);

class CadastroPetPage extends StatefulWidget {
  const CadastroPetPage({super.key});

  @override
  State<CadastroPetPage> createState() => _CadastroPetPageState();
}

class _CadastroPetPageState extends State<CadastroPetPage> {
  final _formKey = GlobalKey<FormState>();

  final nomeController = TextEditingController();
  final tipoController = TextEditingController();
  final racaController = TextEditingController();
  final idadeController = TextEditingController();
  final pesoController = TextEditingController();
  final nascimentoController = TextEditingController();
  final sexoController = TextEditingController();

  final _racaFocus = FocusNode();
  List<String> _racas = [];

  bool _enviando = false;

  @override
  void initState() {
    super.initState();
    RacaService.listar().then((racas) {
      if (mounted) setState(() => _racas = racas);
    });
  }

  @override
  void dispose() {
    _racaFocus.dispose();
    super.dispose();
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;

    final usuarioId = AppData.usuarioLogado?.id;
    if (usuarioId == null) return;

    final pet = Pet(
      nome: nomeController.text,
      tipo: tipoController.text,
      raca: racaController.text,
      idade: idadeController.text,
      peso: pesoController.text,
      nascimento: nascimentoController.text,
      sexo: sexoController.text,
    );

    setState(() => _enviando = true);
    try {
      final criado = await PetService.cadastrar(usuarioId, pet);
      if (!mounted) return;
      Navigator.pop(context, criado);
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.mensagem), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: primaryColor,
      appBar: AppBar(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text("Cadastrar Pet"),
      ),
      body: Container(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              buildField("Nome", nomeController),
              buildField("Tipo (Cachorro/Gato)", tipoController),
              buildRacaField(),
              buildField("Idade", idadeController),
              buildField("Peso (kg)", pesoController),
              buildField("Nascimento (dd/mm/aaaa)", nascimentoController),
              buildField("Sexo (Macho/Fêmea)", sexoController),

              const SizedBox(height: 20),

              SizedBox(
                height: 50,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: accentColor,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                  ),
                  onPressed: _enviando ? null : _salvar,
                  child: _enviando
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          "Salvar",
                          style: TextStyle(fontSize: 16),
                        ),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget buildRacaField() {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: RawAutocomplete<String>(
        textEditingController: racaController,
        focusNode: _racaFocus,
        optionsBuilder: (valor) {
          final busca = valor.text.trim().toLowerCase();
          if (busca.isEmpty) return const Iterable<String>.empty();
          return _racas.where((r) => r.toLowerCase().contains(busca));
        },
        fieldViewBuilder: (context, controller, focusNode, onSubmit) {
          return TextFormField(
            controller: controller,
            focusNode: focusNode,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              labelText: "Raça",
              helperText: _racas.isEmpty ? null : "Digite para ver sugestões",
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(15),
              ),
            ),
            validator: (value) =>
                value == null || value.isEmpty ? "Campo obrigatório" : null,
          );
        },
        optionsViewBuilder: (context, onSelected, opcoes) {
          return Align(
            alignment: Alignment.topLeft,
            child: Material(
              elevation: 4,
              borderRadius: BorderRadius.circular(12),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxHeight: 220),
                child: ListView(
                  padding: EdgeInsets.zero,
                  shrinkWrap: true,
                  children: opcoes
                      .map((r) => ListTile(
                            dense: true,
                            title: Text(r),
                            onTap: () => onSelected(r),
                          ))
                      .toList(),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget buildField(String label, TextEditingController controller) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          labelText: label,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
          ),
        ),
        validator: (value) =>
            value == null || value.isEmpty ? "Campo obrigatório" : null,
      ),
    );
  }
}
