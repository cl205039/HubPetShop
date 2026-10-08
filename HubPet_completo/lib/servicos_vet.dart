import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/servico_vet.dart';
import 'services/servico_vet_service.dart';
import 'recarrega_ao_voltar.dart';

class ServicosVetPage extends StatefulWidget {
  const ServicosVetPage({super.key});

  @override
  State<ServicosVetPage> createState() => _ServicosVetPageState();
}

class _ServicosVetPageState extends State<ServicosVetPage>
    with RouteAware, RecarregaAoVoltar {
  List<ServicoVet> _servicos = [];
  bool _carregando = true;
  String? _erro;

  final _nomeCtrl = TextEditingController();
  final _precoCtrl = TextEditingController();
  final _durCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    _carregarServicos();
  }

  @override
  void recarregar() => _carregarServicos();

  Future<void> _carregarServicos() async {
    final veterinarioId = AppData.usuarioLogado?.id;
    if (veterinarioId == null) {
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
      final servicos = await ServicoVetService.listar(veterinarioId);
      setState(() {
        _servicos = servicos;
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
  void dispose() {
    _nomeCtrl.dispose();
    _precoCtrl.dispose();
    _durCtrl.dispose();
    super.dispose();
  }

  Future<void> _adicionarServico() async {
    if (!_formKey.currentState!.validate()) return;
    final veterinarioId = AppData.usuarioLogado?.id;
    if (veterinarioId == null) return;

    final preco =
        double.tryParse(_precoCtrl.text.trim().replaceAll(',', '.')) ?? 0;

    try {
      final criado = await ServicoVetService.cadastrar(
        veterinarioId,
        ServicoVet(
            nome: _nomeCtrl.text.trim(),
            preco: preco,
            duracao: _durCtrl.text.trim()),
      );
      if (!mounted) return;
      setState(() => _servicos.add(criado));
      _nomeCtrl.clear();
      _precoCtrl.clear();
      _durCtrl.clear();
      Navigator.pop(context); // fecha o bottom sheet
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('Serviço adicionado! ✅'),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.mensagem), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _removerServico(int index) async {
    final servico = _servicos[index];
    if (servico.id == null) return;
    try {
      await ServicoVetService.remover(servico.id!);
      setState(() => _servicos.removeAt(index));
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.mensagem), backgroundColor: Colors.red),
      );
    }
  }

  void _abrirFormulario() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(25)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          left: 20,
          right: 20,
          top: 20,
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
        ),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Novo Serviço',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _campo(_nomeCtrl, 'Nome do serviço', Icons.medical_services),
              const SizedBox(height: 10),
              _campo(_precoCtrl, 'Preço (ex: 80,00)', Icons.attach_money,
                  tipo: TextInputType.number),
              const SizedBox(height: 10),
              _campo(_durCtrl, 'Duração (ex: 30 min)', Icons.timer),
              const SizedBox(height: 18),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(15)),
                  ),
                  onPressed: _adicionarServico,
                  child: const Text('ADICIONAR',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _campo(TextEditingController ctrl, String hint, IconData icon,
      {TextInputType tipo = TextInputType.text}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: tipo,
      decoration: InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, color: const Color(0xFF6A0DAD)),
        filled: true,
        fillColor: const Color(0xFFF5F5F5),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide.none,
        ),
      ),
      validator: (v) => v == null || v.isEmpty ? 'Obrigatório' : null,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _abrirFormulario,
        backgroundColor: Colors.orange,
        icon: const Icon(Icons.add, color: Colors.white),
        label:
            const Text('Novo serviço', style: TextStyle(color: Colors.white)),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF4A148C), Color(0xFF6A1B9A)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 20, 16),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Expanded(
                      child: Text(
                        'Meus Serviços',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white24,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${_servicos.length} serviço${_servicos.length != 1 ? 's' : ''}',
                        style:
                            const TextStyle(color: Colors.white, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),

              // Lista
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
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
                                      style:
                                          const TextStyle(color: Colors.grey)),
                                  const SizedBox(height: 12),
                                  OutlinedButton(
                                    onPressed: _carregarServicos,
                                    child: const Text('Tentar novamente'),
                                  ),
                                ],
                              ),
                            )
                          : _servicos.isEmpty
                              ? const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Text('🩺',
                                          style: TextStyle(fontSize: 52)),
                                      SizedBox(height: 12),
                                      Text(
                                        'Nenhum serviço cadastrado.\nToque em "Novo serviço" para adicionar.',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                            color: Colors.grey, fontSize: 14),
                                      ),
                                    ],
                                  ),
                                )
                              : ListView.separated(
                                  itemCount: _servicos.length,
                                  separatorBuilder: (_, __) =>
                                      const SizedBox(height: 12),
                                  itemBuilder: (context, i) {
                                    final s = _servicos[i];
                                    return Container(
                                      padding: const EdgeInsets.all(14),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade50,
                                        borderRadius: BorderRadius.circular(18),
                                        border: Border.all(
                                            color: Colors.grey.shade200),
                                      ),
                                      child: Row(
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(10),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFF6A0DAD)
                                                  .withAlpha(20),
                                              borderRadius:
                                                  BorderRadius.circular(12),
                                            ),
                                            child: const Icon(
                                                Icons.medical_services,
                                                color: Color(0xFF6A0DAD),
                                                size: 22),
                                          ),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(s.nome,
                                                    style: const TextStyle(
                                                        fontWeight:
                                                            FontWeight.bold,
                                                        fontSize: 14)),
                                                const SizedBox(height: 4),
                                                Row(
                                                  children: [
                                                    const Icon(
                                                        Icons.attach_money,
                                                        size: 13,
                                                        color: Colors.green),
                                                    Text(s.precoFormatado,
                                                        style: const TextStyle(
                                                            color: Colors.green,
                                                            fontSize: 12)),
                                                    const SizedBox(width: 10),
                                                    const Icon(Icons.timer,
                                                        size: 13,
                                                        color: Colors.grey),
                                                    const SizedBox(width: 2),
                                                    Text(s.duracao,
                                                        style: const TextStyle(
                                                            color: Colors.grey,
                                                            fontSize: 12)),
                                                  ],
                                                ),
                                              ],
                                            ),
                                          ),
                                          IconButton(
                                            icon: const Icon(
                                                Icons.delete_outline,
                                                color: Colors.red,
                                                size: 20),
                                            onPressed: () => _removerServico(i),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
