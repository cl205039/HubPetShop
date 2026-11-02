import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

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
  final cepController = TextEditingController();
  final ruaController = TextEditingController();
  final numeroController = TextEditingController();
  final complementoController = TextEditingController();
  final bairroController = TextEditingController();
  final cidadeController = TextEditingController();

  final _numeroFocus = FocusNode();

  bool _enviando = false;
  bool _buscandoCep = false;

  @override
  void dispose() {
    tituloController.dispose();
    cepController.dispose();
    ruaController.dispose();
    numeroController.dispose();
    complementoController.dispose();
    bairroController.dispose();
    cidadeController.dispose();
    _numeroFocus.dispose();
    super.dispose();
  }

  Future<void> _buscarCep() async {
    final cep = cepController.text.replaceAll(RegExp(r'\D'), '');
    if (cep.length != 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Informe um CEP com 8 dígitos')),
      );
      return;
    }

    setState(() => _buscandoCep = true);
    try {
      final resposta = await http
          .get(Uri.parse('https://viacep.com.br/ws/$cep/json/'))
          .timeout(const Duration(seconds: 8));

      final dados = jsonDecode(utf8.decode(resposta.bodyBytes))
          as Map<String, dynamic>;

      if (resposta.statusCode != 200 || dados['erro'] == true) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('CEP não encontrado')),
        );
        return;
      }

      ruaController.text = dados['logradouro'] as String? ?? '';
      bairroController.text = dados['bairro'] as String? ?? '';
      cidadeController.text = dados['localidade'] as String? ?? '';
      if (complementoController.text.trim().isEmpty) {
        complementoController.text = dados['complemento'] as String? ?? '';
      }

      if (!mounted) return;
      _numeroFocus.requestFocus();
    } on TimeoutException {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Tempo esgotado ao buscar o CEP. Tente novamente.'),
        ),
      );
    } on SocketException {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Sem conexão para buscar o CEP.'),
        ),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível buscar o CEP.')),
      );
    } finally {
      if (mounted) setState(() => _buscandoCep = false);
    }
  }

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
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: TextFormField(
                  controller: cepController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(8),
                  ],
                  onChanged: (v) {
                    if (v.length == 8) _buscarCep();
                  },
                  validator: (v) {
                    final digitos = v?.replaceAll(RegExp(r'\D'), '') ?? '';
                    if (digitos.isEmpty) return 'Informe o CEP';
                    if (digitos.length != 8) return 'CEP inválido (8 dígitos)';
                    return null;
                  },
                  decoration: InputDecoration(
                    filled: true,
                    fillColor: Colors.white,
                    labelText: 'CEP *',
                    hintText: 'Só números — preenche o endereço',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                    suffixIcon: _buscandoCep
                        ? const Padding(
                            padding: EdgeInsets.all(12),
                            child: SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : IconButton(
                            icon: const Icon(Icons.search),
                            tooltip: 'Buscar endereço pelo CEP',
                            onPressed: _buscarCep,
                          ),
                  ),
                ),
              ),
              buildField("Rua / Avenida", ruaController),
              Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: buildField("Número", numeroController,
                        focusNode: _numeroFocus),
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
      {bool obrigatorio = true, FocusNode? focusNode}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: TextFormField(
        controller: controller,
        focusNode: focusNode,
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
