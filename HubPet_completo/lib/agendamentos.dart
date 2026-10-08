import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/agendamento.dart';
import 'services/agendamento_service.dart';
import 'rodape_nav.dart';
import 'recarrega_ao_voltar.dart';

class AgendamentosPage extends StatefulWidget {
  const AgendamentosPage({super.key});

  @override
  State<AgendamentosPage> createState() => _AgendamentosPageState();
}

class _AgendamentosPageState extends State<AgendamentosPage>
    with RouteAware, RecarregaAoVoltar {
  DateTime hoje = DateTime.now();
  DateTime diaSelecionado = DateTime.now();
  int indiceDia = 0;

  List<Agendamento> _agendamentos = [];
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
      final agendamentos = await AgendamentoService.listar(usuarioId);
      setState(() {
        _agendamentos = agendamentos;
        _carregando = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _erro = e.mensagem;
        _carregando = false;
      });
    }
  }

  List<DateTime> gerarDias() {
    return List.generate(15, (index) {
      return hoje.add(Duration(days: index));
    });
  }

  Color corStatus(String status) {
    switch (status) {
      case "Confirmado":
        return Colors.green;
      case "Pendente":
        return Colors.orange;
      case "Concluído":
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final dias = gerarDias();
    final diaAtual = dias[indiceDia];

    final filtrados = _agendamentos.where((ag) {
      return ag.data.day == diaSelecionado.day &&
          ag.data.month == diaSelecionado.month;
    }).toList();

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF6A0DAD),
              Color(0xFF9C27B0),
            ],
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        "Agenda",
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
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    onPressed: indiceDia > 0
                        ? () {
                            setState(() {
                              indiceDia--;
                              diaSelecionado = dias[indiceDia];
                            });
                          }
                        : null,
                    icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
                  ),

                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 25, vertical: 15),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Column(
                      children: [
                        Text(
                          [
                            "Dom",
                            "Seg",
                            "Ter",
                            "Qua",
                            "Qui",
                            "Sex",
                            "Sáb"
                          ][diaAtual.weekday % 7],
                          style: const TextStyle(color: Colors.white),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          "${diaAtual.day}/${diaAtual.month}",
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ➡
                  IconButton(
                    onPressed: indiceDia < dias.length - 1
                        ? () {
                            setState(() {
                              indiceDia++;
                              diaSelecionado = dias[indiceDia];
                            });
                          }
                        : null,
                    icon: const Icon(Icons.arrow_forward_ios,
                        color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(30),
                    ),
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
                                    onPressed: _carregar,
                                    child: const Text('Tentar novamente'),
                                  ),
                                ],
                              ),
                            )
                          : filtrados.isEmpty
                              ? const Center(
                                  child: Text("Nenhum agendamento 🐾"),
                                )
                              : ListView.builder(
                                  itemCount: filtrados.length,
                                  itemBuilder: (context, index) {
                                    final ag = filtrados[index];

                                    return Container(
                                      margin: const EdgeInsets.only(bottom: 15),
                                      padding: const EdgeInsets.all(15),
                                      decoration: BoxDecoration(
                                        color: Colors.grey.shade100,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.pets,
                                              color: Colors.deepPurple),
                                          const SizedBox(width: 10),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                                Text(
                                                  ag.servico,
                                                  style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.bold),
                                                ),
                                                Text("${ag.pet} • ${ag.local}"),
                                                Text("⏰ ${ag.hora}"),
                                              ],
                                            ),
                                          ),
                                          Text(
                                            ag.status,
                                            style: TextStyle(
                                              color: corStatus(ag.status),
                                              fontWeight: FontWeight.bold,
                                            ),
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
      bottomNavigationBar: const RodapeNav(),
    );
  }
}
