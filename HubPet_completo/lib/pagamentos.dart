import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'models/agendamento.dart';
import 'services/agendamento_service.dart';
import 'agendamentos.dart';
import 'telainicio.dart';

class PagamentosPage extends StatefulWidget {
  // Quando aberta a partir de um agendamento, recebe o valor, o resumo
  // e o agendamento a ser salvo na API.
  final double? valor;
  final String? resumo;
  final Agendamento? agendamento;

  const PagamentosPage({super.key, this.valor, this.resumo, this.agendamento});

  @override
  State<PagamentosPage> createState() => _PagamentosPageState();
}

class _PagamentosPageState extends State<PagamentosPage> {
  static const Color _roxo = Color(0xFF6A0DAD);

  bool _enviando = false;

  String _formatarPreco(double v) =>
      'R\$ ${v.toStringAsFixed(2).replaceAll('.', ',')}';

  Future<void> _confirmar() async {
    // Igual ao fechamento da compra (carrinho.dart): o login só é
    // exigido aqui, ao confirmar o agendamento. Se o cliente não está
    // logado, mostra o aviso ("você precisa fazer login para finalizar
    // o agendamento") com um botão que leva ao login e retoma a
    // confirmação ao voltar.
    if (widget.agendamento != null && AppData.usuarioLogado == null) {
      final logou = await Telainicio.solicitarLogin(
        context,
        acao: 'finalizar o agendamento',
      );
      if (!mounted || !logou) return;
    }

    final usuarioId = AppData.usuarioLogado?.id;
    if (widget.agendamento != null && usuarioId != null) {
      setState(() => _enviando = true);
      try {
        await AgendamentoService.criar(usuarioId, widget.agendamento!);
      } on ApiException catch (e) {
        if (!mounted) return;
        setState(() => _enviando = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.mensagem), backgroundColor: Colors.red),
        );
        return;
      }
      if (!mounted) return;
      setState(() => _enviando = false);
    }

    if (!mounted) return;
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.event_available, color: Colors.green, size: 60),
            SizedBox(height: 12),
            Text(
              'Agendamento confirmado! 🐾',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            SizedBox(height: 8),
            Text(
              'Você optou por pagar na consulta.\n'
              'Veja em "Meus Agendamentos".',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
        actions: [
          Center(
            child: TextButton(
              onPressed: () {
                Navigator.pop(context); // fecha o diálogo
                // Volta para a raiz e abre Meus Agendamentos.
                Navigator.popUntil(context, (rota) => rota.isFirst);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AgendamentosPage()),
                );
              },
              child: const Text('VER AGENDAMENTOS',
                  style: TextStyle(color: _roxo, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
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
              Row(
                children: [
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        "Pagamento",
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
              Expanded(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(
                      top: Radius.circular(30),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Resumo do agendamento
                      if (widget.valor != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(16),
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: _roxo.withAlpha(15),
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Resumo do agendamento',
                                  style:
                                      TextStyle(fontWeight: FontWeight.bold)),
                              if (widget.resumo != null) ...[
                                const SizedBox(height: 6),
                                Text(widget.resumo!,
                                    style: const TextStyle(
                                        color: Colors.grey, fontSize: 13)),
                              ],
                              const Divider(height: 20),
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('Total',
                                      style: TextStyle(
                                          fontWeight: FontWeight.bold)),
                                  Text(
                                    _formatarPreco(widget.valor!),
                                    style: const TextStyle(
                                        color: Colors.orange,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],

                      const Text('Forma de pagamento',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),

                      // Única forma: pagar na consulta
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.green,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.green.withAlpha(80),
                              blurRadius: 15,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.store, color: Colors.white, size: 30),
                            SizedBox(width: 15),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Pagar na consulta',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white),
                                  ),
                                  Text(
                                    'Pague no local, no dia do atendimento',
                                    style: TextStyle(color: Colors.white70),
                                  ),
                                ],
                              ),
                            ),
                            Icon(Icons.check_circle, color: Colors.white),
                          ],
                        ),
                      ),

                      const Spacer(),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.orange,
                            padding: const EdgeInsets.symmetric(vertical: 18),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(25),
                            ),
                          ),
                          onPressed: _enviando ? null : _confirmar,
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
                                  "CONFIRMAR AGENDAMENTO",
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    letterSpacing: 1,
                                    color: Colors.white,
                                  ),
                                ),
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
