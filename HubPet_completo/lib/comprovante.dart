import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ComprovantePage extends StatelessWidget {
  final String titulo;
  final String local;
  final String data;
  final List<String> linhas;
  final double total;
  final String formaPagamento;
  final String? codigo;

  const ComprovantePage({
    super.key,
    required this.titulo,
    required this.local,
    required this.data,
    required this.linhas,
    required this.total,
    this.formaPagamento = '',
    this.codigo,
  });

  static const Color _roxo = Color(0xFF6A0DAD);

  String _formatarPreco(double v) =>
      'R\$ ${v.toStringAsFixed(2).replaceAll('.', ',')}';

  String get _textoPlano {
    final sb = StringBuffer()
      ..writeln(titulo)
      ..writeln(local)
      ..writeln(data)
      ..writeln('------------------------');
    if (codigo != null) sb.writeln('Nº $codigo');
    for (final l in linhas) {
      sb.writeln(l);
    }
    sb
      ..writeln('------------------------')
      ..writeln('Total: ${_formatarPreco(total)}');
    if (formaPagamento.isNotEmpty) sb.writeln('Pagamento: $formaPagamento');
    return sb.toString();
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
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      tooltip: 'Voltar',
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      'Comprovante',
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
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(20),
                    child: Container(
                      width: double.infinity,
                      constraints: const BoxConstraints(maxWidth: 420),
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: const [
                          BoxShadow(
                            blurRadius: 16,
                            color: Colors.black26,
                            offset: Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.receipt_long,
                                  color: _roxo, size: 28),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  titulo,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16),
                                ),
                              ),
                            ],
                          ),
                          if (codigo != null) ...[
                            const SizedBox(height: 4),
                            Text('Nº $codigo',
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 12)),
                          ],
                          const SizedBox(height: 16),
                          _linhaInfo(Icons.store, local),
                          const SizedBox(height: 6),
                          _linhaInfo(Icons.event, data),
                          const SizedBox(height: 16),
                          const Divider(color: Color(0xFFDDDDDD)),
                          const SizedBox(height: 8),
                          ...linhas.map((l) => Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Text(l,
                                    style: const TextStyle(fontSize: 13)),
                              )),
                          const SizedBox(height: 4),
                          const Divider(color: Color(0xFFDDDDDD)),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text('Total',
                                  style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 15)),
                              Text(
                                _formatarPreco(total),
                                style: const TextStyle(
                                    color: Colors.orange,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 18),
                              ),
                            ],
                          ),
                          if (formaPagamento.isNotEmpty) ...[
                            const SizedBox(height: 6),
                            Text('Pagamento: $formaPagamento',
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 12)),
                          ],
                          const SizedBox(height: 20),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              style: OutlinedButton.styleFrom(
                                foregroundColor: _roxo,
                                side: const BorderSide(color: _roxo),
                                padding:
                                    const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                              onPressed: () async {
                                await Clipboard.setData(
                                    ClipboardData(text: _textoPlano));
                                if (context.mounted) {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                        content:
                                            Text('Comprovante copiado 📋')),
                                  );
                                }
                              },
                              icon: const Icon(Icons.copy),
                              label: const Text('Copiar comprovante'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _linhaInfo(IconData icone, String texto) {
    return Row(
      children: [
        Icon(icone, size: 16, color: Colors.grey),
        const SizedBox(width: 6),
        Expanded(
          child: Text(texto,
              style: const TextStyle(color: Colors.grey, fontSize: 13)),
        ),
      ],
    );
  }
}
