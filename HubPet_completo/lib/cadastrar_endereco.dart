import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/endereco.dart';
import 'services/endereco_service.dart';

class CadastrarEnderecoPage extends StatefulWidget {
  const CadastrarEnderecoPage({super.key});

  @override
  State<CadastrarEnderecoPage> createState() =>
      _CadastrarEnderecoPageState();
}

class _CadastrarEnderecoPageState
    extends State<CadastrarEnderecoPage> {
  final _formKey = GlobalKey<FormState>();

  final tituloController = TextEditingController();
  final ruaController = TextEditingController();
  final numeroController = TextEditingController();
  final complementoController = TextEditingController();
  final bairroController = TextEditingController();
  final cidadeController = TextEditingController();

  bool _enviando = false;

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;

    final usuarioId = AppData.usuarioLogado?.id;
    if (usuarioId == null) return;

    final endereco = Endereco(
      titulo: tituloController.text.trim().isEmpty
          ? null
          : tituloController.text.trim(),
      rua: ruaController.text,
      numero: numeroController.text,
      complemento: complementoController.text,
      bairro: bairroController.text,
      cidade: cidadeController.text,
    );

    setState(() => _enviando = true);
    try {
      final criado = await EnderecoService.cadastrar(usuarioId, endereco);
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
      backgroundColor: const Color(0xFF6A1B9A),
      appBar: AppBar(
        backgroundColor: const Color(0xFF6A1B9A),
        foregroundColor: Colors.white,
        title: const Text("Novo Endereço"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: ListView(
            children: [
              buildField("Nome (Casa, Trabalho...)", tituloController,
                  obrigatorio: false),
              buildField("Rua / Avenida", ruaController),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: buildField("Número", numeroController),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    flex: 3,
                    child: buildField("Complemento", complementoController,
                        obrigatorio: false),
                  ),
                ],
              ),
              buildField("Bairro", bairroController),
              buildField("Cidade", cidadeController),

              const SizedBox(height: 20),

              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.orange,
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
                    : const Text("Salvar"),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget buildField(String label, TextEditingController controller,
      {bool obrigatorio = true}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: controller,
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          labelText: obrigatorio ? label : '$label (opcional)',
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
          ),
        ),
        validator: (value) => obrigatorio && (value == null || value.isEmpty)
            ? "Campo obrigatório"
            : null,
      ),
    );
  }
}
