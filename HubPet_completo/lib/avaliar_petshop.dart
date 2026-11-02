import 'package:flutter/material.dart';
import 'app_data.dart';

const Color _roxo = Color(0xFF6A0DAD);

Future<bool> mostrarDialogoAvaliacao(
  BuildContext context, {
  required int petshopId,
  required String nomePetshop,
}) async {
  double nota = 5;
  final comentarioCtrl = TextEditingController();

  final avaliou = await showDialog<bool>(
    context: context,
    builder: (dctx) => StatefulBuilder(
      builder: (dctx, setState) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Avaliar $nomePetshop'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (i) {
                final preenchida = i < nota;
                return IconButton(
                  onPressed: () => setState(() => nota = (i + 1).toDouble()),
                  icon: Icon(
                    preenchida ? Icons.star : Icons.star_border,
                    color: Colors.orange,
                    size: 32,
                  ),
                  tooltip: '${i + 1} estrela${i == 0 ? '' : 's'}',
                );
              }),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: comentarioCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'Conte como foi o atendimento (opcional)',
                filled: true,
                fillColor: const Color(0xFFF5F5F5),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dctx, false),
            child: const Text('Agora não'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: _roxo),
            onPressed: () {
              AppData.adicionarAvaliacao(
                petshopId,
                nota,
                comentarioCtrl.text.trim(),
              );
              Navigator.pop(dctx, true);
            },
            child: const Text('Enviar', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    ),
  );

  comentarioCtrl.dispose();
  return avaliou == true;
}

class ListaAvaliacoes extends StatelessWidget {
  final int petshopId;

  const ListaAvaliacoes({super.key, required this.petshopId});

  @override
  Widget build(BuildContext context) {
    final avaliacoes = AppData.avaliacoesDoPetshop(petshopId);
    if (avaliacoes.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Suas avaliações (${avaliacoes.length})',
              style: const TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...avaliacoes.reversed.map((a) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF5F5F5),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        ...List.generate(
                          5,
                          (i) => Icon(
                            i < a.nota ? Icons.star : Icons.star_border,
                            color: Colors.orange,
                            size: 16,
                          ),
                        ),
                      ],
                    ),
                    if (a.comentario.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(a.comentario, style: const TextStyle(fontSize: 13)),
                    ],
                  ],
                ),
              )),
        ],
      ),
    );
  }
}
