import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/endereco.dart';
import 'services/endereco_service.dart';
import 'cadastrar_endereco.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

// ============================================================
// MEUS ENDEREÇOS — lista os endereços salvos do usuário e permite
// cadastrar novos via CadastrarEnderecoPage (antes um formulário
// órfão, sem nenhuma tela que o exibisse).
// ============================================================

class MeusEnderecosPage extends StatefulWidget {
  const MeusEnderecosPage({super.key});

  @override
  State<MeusEnderecosPage> createState() => _MeusEnderecosPageState();
}

class _MeusEnderecosPageState extends State<MeusEnderecosPage>
    with RouteAware, RecarregaAoVoltar {
  static const Color _roxo = Color(0xFF6A0DAD);

  List<Endereco> _enderecos = [];
  bool _carregando = true;
  String? _erro;

  @override
  void initState() {
    super.initState();
    _carregar();
  }

  @override
  void recarregar() => _carregar();

  Future<void> _carregar() async {
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
      final enderecos = await EnderecoService.listar(usuarioId);
      setState(() {
        _enderecos = enderecos;
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  Future<void> _remover(Endereco e) async {
    if (e.id == null) return;
    try {
      await EnderecoService.remover(e.id!);
      setState(() => _enderecos.remove(e));
    } on ApiException catch (erro) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(erro.mensagem), backgroundColor: Colors.red),
      );
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
            colors: [Color(0xFF4A148C), Color(0xFF6A1B9A)],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      "Meus Endereços",
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
                  padding: const EdgeInsets.all(20),
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
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: Colors.orange,
        icon: const Icon(Icons.add, color: Colors.white),
        label:
            const Text('Novo endereço', style: TextStyle(color: Colors.white)),
        onPressed: () async {
          final novo = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const CadastrarEnderecoPage()),
          );
          if (novo is Endereco) {
            setState(() => _enderecos.add(novo));
          }
        },
      ),
      bottomNavigationBar: const RodapeNav(),
    );
  }

  Widget _conteudo() {
    if (_carregando) {
      return const Center(child: CircularProgressIndicator(color: _roxo));
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
    if (_enderecos.isEmpty) {
      return const Center(
        child: Text(
          'Nenhum endereço cadastrado ainda 📍',
          style: TextStyle(color: Colors.grey, fontSize: 15),
        ),
      );
    }
    return ListView.separated(
      itemCount: _enderecos.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, i) => _cardEndereco(_enderecos[i]),
    );
  }

  Widget _cardEndereco(Endereco e) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            backgroundColor: Color(0x226A0DAD),
            child: Icon(Icons.location_on, color: _roxo),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(e.titulo?.isNotEmpty == true ? e.titulo! : 'Endereço',
                    style: const TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(e.resumo,
                    style: const TextStyle(color: Colors.grey, fontSize: 12)),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.delete_outline, color: Colors.red),
            onPressed: () => _remover(e),
          ),
        ],
      ),
    );
  }
}
