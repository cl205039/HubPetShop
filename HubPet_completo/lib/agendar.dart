import 'package:flutter/material.dart';
import 'api_client.dart';
import 'models/petshop.dart';
import 'models/servico.dart';
import 'models/agendamento.dart';
import 'services/petshop_service.dart';
import 'services/servico_service.dart';
import 'pagamentos.dart';

class AgendarPage extends StatefulWidget {
  const AgendarPage({super.key});

  @override
  State<AgendarPage> createState() => _AgendarPageState();
}

class _AgendarPageState extends State<AgendarPage> {
  static const Color _roxo = Color(0xFF6A0DAD);

  int _passo = 0; // 0: petshop · 1: serviços · 2: data · 3: horário

  List<Petshop> _petshops = [];
  List<Servico> _servicos = [];
  bool _carregando = true;
  String? _erro;

  // ── Passo 1: petshop ──
  int? _petshopSel;

  // ── Passo 2: serviços ──
  final Set<int> _servicosSel = {};

  // ── Passo 3: data ──
  DateTime? _data;

  // ── Passo 4: horário ──
  final List<String> _horarios = const [
    '09:00',
    '10:00',
    '11:00',
    '14:00',
    '15:00',
    '16:00',
  ];
  String? _horario;

  @override
  void initState() {
    super.initState();
    _carregarDados();
  }

  Future<void> _carregarDados() async {
    setState(() {
      _carregando = true;
      _erro = null;
    });
    try {
      final resultados = await Future.wait([
        PetshopService.listar(),
        ServicoService.listar(),
      ]);
      setState(() {
        _petshops = resultados[0] as List<Petshop>;
        _servicos = resultados[1] as List<Servico>;
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  double get _total =>
      _servicosSel.fold(0.0, (s, i) => s + _servicos[i].preco);

  String _formatarPreco(double v) =>
      'R\$ ${v.toStringAsFixed(2).replaceAll('.', ',')}';

  String _dataFormatada() => _data == null
      ? ''
      : '${_data!.day.toString().padLeft(2, '0')}/'
          '${_data!.month.toString().padLeft(2, '0')}/${_data!.year}';

  bool get _passoValido {
    switch (_passo) {
      case 0:
        return _petshopSel != null;
      case 1:
        return _servicosSel.isNotEmpty;
      case 2:
        return _data != null;
      case 3:
        return _horario != null;
      default:
        return false;
    }
  }

  Future<void> _selecionarData() async {
    final data = await showDatePicker(
      context: context,
      initialDate: _data ?? DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
    );
    if (data != null) setState(() => _data = data);
  }

  void _avancar() {
    if (!_passoValido) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_mensagemPasso()),
          backgroundColor: Colors.red.shade400,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }
    if (_passo < 3) {
      setState(() => _passo++);
    } else {
      _confirmar();
    }
  }

  String _mensagemPasso() {
    switch (_passo) {
      case 0:
        return 'Escolha um petshop para continuar';
      case 1:
        return 'Selecione ao menos um serviço';
      case 2:
        return 'Escolha uma data';
      default:
        return 'Escolha um horário';
    }
  }

  void _confirmar() {
    final petshop = _petshops[_petshopSel!];
    final servicos = _servicosSel.map((i) => _servicos[i].nome).join(', ');
    final resumo =
        '${petshop.nome} · $servicos\n${_dataFormatada()} às $_horario';

    final agendamento = Agendamento(
      servico: servicos,
      hora: _horario!,
      status: 'Confirmado',
      pet: 'Meu pet 🐾',
      local: petshop.nome,
      petshopId: petshop.id,
      data: _data!,
    );

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => PagamentosPage(
          valor: _total,
          resumo: resumo,
          agendamento: agendamento,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const titulos = [
      'Escolha o petshop',
      'Serviços disponíveis',
      'Selecione a data',
      'Selecione o horário',
    ];

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [_roxo, Color(0xFF9C27B0)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Cabeçalho
              Row(
                children: [
                  IconButton(
                    onPressed: () => _passo == 0
                        ? Navigator.pop(context)
                        : setState(() => _passo--),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'Agendar Serviço',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),

              const SizedBox(height: 10),

              if (!_carregando && _erro == null) _indicadorPassos(),

              const SizedBox(height: 16),

              Expanded(
                child: Container(
                  width: double.infinity,
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
                                    onPressed: _carregarDados,
                                    child: const Text('Tentar novamente'),
                                  ),
                                ],
                              ),
                            )
                          : Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Passo ${_passo + 1} de 4',
                                  style: const TextStyle(
                                      color: Colors.grey, fontSize: 12),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  titulos[_passo],
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 18),
                                ),
                                const SizedBox(height: 16),
                                Expanded(
                                  child: SingleChildScrollView(
                                    child: _conteudoPasso(),
                                  ),
                                ),
                                _botoes(),
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

  // ── Indicador de progresso ──
  Widget _indicadorPassos() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Row(
        children: List.generate(4, (i) {
          final ativo = i <= _passo;
          return Expanded(
            child: Row(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: ativo ? Colors.orange : Colors.white24,
                    shape: BoxShape.circle,
                  ),
                  child: i < _passo
                      ? const Icon(Icons.check, color: Colors.white, size: 16)
                      : Text(
                          '${i + 1}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12),
                        ),
                ),
                if (i < 3)
                  Expanded(
                    child: Container(
                      height: 3,
                      color: i < _passo ? Colors.orange : Colors.white24,
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  // ── Conteúdo de cada passo ──
  Widget _conteudoPasso() {
    switch (_passo) {
      case 0:
        return _passoPetshop();
      case 1:
        return _passoServicos();
      case 2:
        return _passoData();
      default:
        return _passoHorario();
    }
  }

  Widget _passoPetshop() {
    return Column(
      children: List.generate(_petshops.length, (i) {
        final p = _petshops[i];
        final sel = _petshopSel == i;
        return GestureDetector(
          onTap: () => setState(() => _petshopSel = i),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: sel ? _roxo.withAlpha(20) : const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: sel ? _roxo : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  backgroundColor: _roxo.withAlpha(30),
                  child: const Icon(Icons.store, color: _roxo),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(p.nome,
                          style: const TextStyle(
                              fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.star,
                              color: Colors.orange, size: 14),
                          const SizedBox(width: 4),
                          Text(p.notaFormatada,
                              style: const TextStyle(fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ),
                Icon(
                  sel ? Icons.check_circle : Icons.circle_outlined,
                  color: sel ? _roxo : Colors.grey,
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _passoServicos() {
    return Column(
      children: List.generate(_servicos.length, (i) {
        final s = _servicos[i];
        final sel = _servicosSel.contains(i);
        return GestureDetector(
          onTap: () => setState(() {
            sel ? _servicosSel.remove(i) : _servicosSel.add(i);
          }),
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: sel ? Colors.orange.withAlpha(25) : const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: sel ? Colors.orange : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                Icon(s.icone, color: _roxo),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(s.nome,
                      style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
                Text(_formatarPreco(s.preco),
                    style: const TextStyle(
                        color: Colors.orange, fontWeight: FontWeight.bold)),
                const SizedBox(width: 10),
                Icon(
                  sel ? Icons.check_box : Icons.check_box_outline_blank,
                  color: sel ? Colors.orange : Colors.grey,
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  Widget _passoData() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        GestureDetector(
          onTap: _selecionarData,
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F5F5),
              borderRadius: BorderRadius.circular(15),
              border: Border.all(
                color: _data != null ? _roxo : Colors.transparent,
                width: 1.5,
              ),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today, color: _roxo),
                const SizedBox(width: 12),
                Text(
                  _data == null ? 'Escolher data' : _dataFormatada(),
                  style: const TextStyle(fontSize: 15),
                ),
              ],
            ),
          ),
        ),
        if (_data != null)
          Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              'Data selecionada: ${_dataFormatada()}',
              style: const TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ),
      ],
    );
  }

  Widget _passoHorario() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _horarios.map((h) {
            final sel = _horario == h;
            return ChoiceChip(
              label: Text(h),
              selected: sel,
              selectedColor: Colors.orange,
              labelStyle:
                  TextStyle(color: sel ? Colors.white : Colors.black),
              onSelected: (_) => setState(() => _horario = h),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        // Resumo do agendamento
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _roxo.withAlpha(15),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Resumo',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              _linhaResumo('Petshop',
                  _petshopSel != null ? _petshops[_petshopSel!].nome : '-'),
              _linhaResumo(
                  'Serviços',
                  _servicosSel.isEmpty
                      ? '-'
                      : _servicosSel.map((i) => _servicos[i].nome).join(', ')),
              _linhaResumo('Data', _data == null ? '-' : _dataFormatada()),
              _linhaResumo('Horário', _horario ?? '-'),
              const Divider(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  Text(_formatarPreco(_total),
                      style: const TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                          fontSize: 16)),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _linhaResumo(String titulo, String valor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 75,
            child: Text(titulo,
                style: const TextStyle(color: Colors.grey, fontSize: 13)),
          ),
          Expanded(
            child: Text(valor, style: const TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }

  // ── Botões inferiores ──
  Widget _botoes() {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        children: [
          if (_passo > 0)
            Expanded(
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  foregroundColor: _roxo,
                  side: const BorderSide(color: _roxo),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(25),
                  ),
                ),
                onPressed: () => setState(() => _passo--),
                child: const Text('Voltar',
                    style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          if (_passo > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              onPressed: _avancar,
              child: Text(
                _passo < 3 ? 'CONTINUAR' : 'CONFIRMAR AGENDAMENTO',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
