import 'package:flutter/material.dart';
import 'api_client.dart';
import 'models/usuario.dart';
import 'services/usuario_service.dart';
import 'recarrega_ao_voltar.dart';

class BuscaUsuariosPage extends StatefulWidget {
  const BuscaUsuariosPage({super.key});

  @override
  State<BuscaUsuariosPage> createState() => _BuscaUsuariosPageState();
}

class _BuscaUsuariosPageState extends State<BuscaUsuariosPage>
    with RouteAware, RecarregaAoVoltar {
  final _buscaCtrl = TextEditingController();

  // Atributo selecionado para busca
  String _atributo = 'nome';

  // Resultados filtrados
  List<Usuario> _resultados = [];

  // Se o usuário já digitou algo
  bool _digitou = false;
  bool _buscando = false;
  String? _erro;

  int? _totalCadastrados;

  final List<Map<String, dynamic>> _atributos = [
    {'valor': 'nome', 'label': 'Nome', 'icone': Icons.person},
    {'valor': 'email', 'label': 'E-mail', 'icone': Icons.email},
    {'valor': 'telefone', 'label': 'Telefone', 'icone': Icons.phone},
    {'valor': 'cpf', 'label': 'CPF', 'icone': Icons.badge},
    {'valor': 'tipo', 'label': 'Tipo', 'icone': Icons.category},
  ];

  @override
  void initState() {
    super.initState();
    _carregarTotal();
  }

  @override
  void recarregar() => _carregarTotal();

  Future<void> _carregarTotal() async {
    try {
      final total = await UsuarioService.total();
      if (mounted) setState(() => _totalCadastrados = total);
    } on ApiException {
      // Se a API estiver fora, apenas não mostra o contador — a busca
      // em si continua tentando normalmente.
    }
  }

  @override
  void dispose() {
    _buscaCtrl.dispose();
    super.dispose();
  }

  Future<void> _buscar(String texto) async {
    final termo = texto.trim();

    setState(() {
      _digitou = termo.isNotEmpty;
      _erro = null;
      if (termo.isEmpty) {
        _resultados = [];
      }
    });
    if (termo.isEmpty) return;

    setState(() => _buscando = true);
    try {
      // A busca por "tipo" filtra pelo rótulo legível (ex. "Veterinário"),
      // igual ao que o usuário vê nos chips de dica — a API compara
      // contra o rótulo em português, não o valor interno do enum.
      final resultados =
          await UsuarioService.buscar(atributo: _atributo, termo: termo);
      if (!mounted) return;
      setState(() {
        _resultados = resultados;
        _buscando = false;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _erro = e.mensagem;
        _buscando = false;
      });
    }
  }

  // Converte o valor interno do tipo para texto legível
  String _tipoLabel(String tipo) {
    switch (tipo) {
      case 'pessoafisica':
        return 'Pessoa Física';
      case 'pessoajuridica':
        return 'Pessoa Jurídica';
      case 'veterinario':
        return 'Veterinário';
      default:
        return tipo;
    }
  }

  Color _tipoCor(String tipo) {
    switch (tipo) {
      case 'veterinario':
        return Colors.teal;
      case 'pessoajuridica':
        return Colors.blue;
      default:
        return const Color(0xFF6A0DAD);
    }
  }

  String _tipoEmoji(String tipo) {
    switch (tipo) {
      case 'veterinario':
        return '🩺';
      case 'pessoajuridica':
        return '🏢';
      default:
        return '🐾';
    }
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
              // ── Header ──
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 20, 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Expanded(
                      child: Text(
                        'Buscar Usuários',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    // Total de cadastrados
                    if (_totalCadastrados != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white24,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          '$_totalCadastrados cadastrados',
                          style: const TextStyle(
                              color: Colors.white, fontSize: 12),
                        ),
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // ── Campo de busca ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: TextField(
                    controller: _buscaCtrl,
                    onChanged: _buscar,
                    decoration: InputDecoration(
                      border: InputBorder.none,
                      prefixIcon:
                          const Icon(Icons.search, color: Color(0xFF6A0DAD)),
                      hintText:
                          'Buscar por ${_atributos.firstWhere((a) => a['valor'] == _atributo)['label']}...',
                      suffixIcon: _buscaCtrl.text.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, color: Colors.grey),
                              onPressed: () {
                                _buscaCtrl.clear();
                                _buscar('');
                              },
                            )
                          : null,
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // ── Chips de atributo ──
              SizedBox(
                height: 38,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  scrollDirection: Axis.horizontal,
                  itemCount: _atributos.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final a = _atributos[i];
                    final selecionado = _atributo == a['valor'];
                    return GestureDetector(
                      onTap: () {
                        setState(() => _atributo = a['valor']);
                        _buscar(_buscaCtrl.text);
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: selecionado ? Colors.white : Colors.white24,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              a['icone'] as IconData,
                              size: 14,
                              color: selecionado
                                  ? const Color(0xFF6A0DAD)
                                  : Colors.white,
                            ),
                            const SizedBox(width: 5),
                            Text(
                              a['label'] as String,
                              style: TextStyle(
                                color: selecionado
                                    ? const Color(0xFF6A0DAD)
                                    : Colors.white,
                                fontWeight: selecionado
                                    ? FontWeight.bold
                                    : FontWeight.normal,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 12),

              // ── Área de resultados ──
              Expanded(
                child: Container(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(35)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Cabeçalho dos resultados
                      if (_digitou && !_buscando && _erro == null)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _resultados.isEmpty
                                    ? 'Nenhum resultado'
                                    : '${_resultados.length} resultado${_resultados.length != 1 ? 's' : ''}',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                ),
                              ),
                              Text(
                                'buscando por: ${_atributos.firstWhere((a) => a['valor'] == _atributo)['label']}',
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          ),
                        ),

                      // Estado inicial — instrução
                      if (!_digitou)
                        Expanded(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('🔍',
                                    style: TextStyle(fontSize: 52)),
                                const SizedBox(height: 12),
                                const Text(
                                  'Selecione um atributo e\ndigite para buscar',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                      color: Colors.grey, fontSize: 15),
                                ),
                                const SizedBox(height: 20),
                                // Dica de tipos disponíveis
                                Container(
                                  padding: const EdgeInsets.all(14),
                                  decoration: BoxDecoration(
                                    color:
                                        const Color(0xFF6A0DAD).withAlpha(15),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Column(
                                    children: [
                                      const Text(
                                        'Dica: ao buscar por Tipo, tente:',
                                        style: TextStyle(
                                            fontSize: 12, color: Colors.grey),
                                      ),
                                      const SizedBox(height: 6),
                                      Wrap(
                                        spacing: 6,
                                        children: [
                                          'Pessoa Física',
                                          'Veterinário',
                                          'Pessoa Jurídica'
                                        ]
                                            .map((t) => Chip(
                                                  label: Text(t,
                                                      style: const TextStyle(
                                                          fontSize: 11)),
                                                  backgroundColor:
                                                      const Color(0xFF6A0DAD)
                                                          .withAlpha(20),
                                                  padding: EdgeInsets.zero,
                                                ))
                                            .toList(),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Buscando
                      if (_digitou && _buscando)
                        const Expanded(
                          child: Center(child: CircularProgressIndicator()),
                        ),

                      // Erro
                      if (_digitou && !_buscando && _erro != null)
                        Expanded(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(_erro!,
                                    textAlign: TextAlign.center,
                                    style: const TextStyle(color: Colors.grey)),
                                const SizedBox(height: 12),
                                OutlinedButton(
                                  onPressed: () => _buscar(_buscaCtrl.text),
                                  child: const Text('Tentar novamente'),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Sem resultados
                      if (_digitou &&
                          !_buscando &&
                          _erro == null &&
                          _resultados.isEmpty)
                        Expanded(
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Text('😕',
                                    style: TextStyle(fontSize: 48)),
                                const SizedBox(height: 12),
                                Text(
                                  'Nenhum usuário encontrado\ncom "${_buscaCtrl.text}" em ${_atributos.firstWhere((a) => a['valor'] == _atributo)['label']}',
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(
                                      color: Colors.grey, fontSize: 14),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // Lista de resultados
                      if (_digitou &&
                          !_buscando &&
                          _erro == null &&
                          _resultados.isNotEmpty)
                        Expanded(
                          child: ListView.separated(
                            itemCount: _resultados.length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(height: 10),
                            itemBuilder: (context, index) {
                              final u = _resultados[index];
                              final cor = _tipoCor(u.tipoUsuario);
                              return Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade50,
                                  borderRadius: BorderRadius.circular(18),
                                  border:
                                      Border.all(color: Colors.grey.shade200),
                                ),
                                child: Row(
                                  children: [
                                    // Avatar com inicial
                                    CircleAvatar(
                                      radius: 26,
                                      backgroundColor: cor.withAlpha(30),
                                      child: Text(
                                        _tipoEmoji(u.tipoUsuario),
                                        style: const TextStyle(fontSize: 20),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    // Dados
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          // Nome + badge tipo
                                          Row(
                                            children: [
                                              Expanded(
                                                child: Text(
                                                  u.nome,
                                                  style: const TextStyle(
                                                    fontWeight: FontWeight.bold,
                                                    fontSize: 14,
                                                  ),
                                                ),
                                              ),
                                              Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 8,
                                                        vertical: 2),
                                                decoration: BoxDecoration(
                                                  color: cor.withAlpha(20),
                                                  borderRadius:
                                                      BorderRadius.circular(10),
                                                ),
                                                child: Text(
                                                  _tipoLabel(u.tipoUsuario),
                                                  style: TextStyle(
                                                    color: cor,
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          // Email
                                          Row(
                                            children: [
                                              const Icon(Icons.email_outlined,
                                                  size: 12, color: Colors.grey),
                                              const SizedBox(width: 4),
                                              Expanded(
                                                child: Text(
                                                  u.email,
                                                  style: const TextStyle(
                                                      color: Colors.grey,
                                                      fontSize: 12),
                                                  overflow:
                                                      TextOverflow.ellipsis,
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 2),
                                          // Telefone
                                          Row(
                                            children: [
                                              const Icon(Icons.phone_outlined,
                                                  size: 12, color: Colors.grey),
                                              const SizedBox(width: 4),
                                              Text(
                                                u.telefone,
                                                style: const TextStyle(
                                                    color: Colors.grey,
                                                    fontSize: 12),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            },
                          ),
                        ),
                    ],
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
