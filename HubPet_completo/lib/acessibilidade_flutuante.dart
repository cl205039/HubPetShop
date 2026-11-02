import 'package:flutter/material.dart';
import 'acessibilidade.dart';

class BotaoAcessibilidade extends StatelessWidget {
  const BotaoAcessibilidade({super.key});

  void _abrirPainel() {
    final ctx = Acessibilidade.navigatorKey.currentState?.overlay?.context;
    if (ctx == null) return;
    showModalBottomSheet(
      context: ctx,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) => const _PainelAcessibilidade(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: const Alignment(1, 0.4),
      child: Padding(
        padding: const EdgeInsets.only(right: 6),
        child: Material(
          color: Colors.transparent,
          child: Semantics(
            button: true,
            label: 'Opções de acessibilidade: tamanho do texto e contraste',
            child: InkWell(
              onTap: _abrirPainel,
              customBorder: const CircleBorder(),
              child: Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: const Color(0xFF6A0DAD),
                  shape: BoxShape.circle,
                  boxShadow: const [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 8,
                      offset: Offset(0, 3),
                    ),
                  ],
                ),
                child: const Icon(Icons.accessibility_new,
                    color: Colors.white, size: 26),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _PainelAcessibilidade extends StatelessWidget {
  const _PainelAcessibilidade();

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const Text(
              'Acessibilidade',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 16),
            const Text('Tamanho do texto',
                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            const SizedBox(height: 8),
            ValueListenableBuilder<double>(
              valueListenable: Acessibilidade.escalaTexto,
              builder: (context, escala, _) {
                final indice = Acessibilidade.escalas.indexOf(escala);
                return Row(
                  children: [
                    IconButton.filled(
                      tooltip: 'Diminuir texto',
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFF6A0DAD),
                      ),
                      onPressed:
                          indice > 0 ? Acessibilidade.diminuirTexto : null,
                      icon: const Icon(Icons.remove),
                    ),
                    Expanded(
                      child: Text(
                        Acessibilidade.nomesEscala[indice],
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton.filled(
                      tooltip: 'Aumentar texto',
                      style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFF6A0DAD),
                      ),
                      onPressed: indice < Acessibilidade.escalas.length - 1
                          ? Acessibilidade.aumentarTexto
                          : null,
                      icon: const Icon(Icons.add),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 8),
            ValueListenableBuilder<bool>(
              valueListenable: Acessibilidade.altoContraste,
              builder: (context, ativo, _) {
                return SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Alto contraste'),
                  value: ativo,
                  activeColor: const Color(0xFF6A0DAD),
                  onChanged: Acessibilidade.alternarContraste,
                );
              },
            ),
            ValueListenableBuilder<bool>(
              valueListenable: Acessibilidade.modoEscuro,
              builder: (context, ativo, _) {
                return SwitchListTile(
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Modo escuro'),
                  value: ativo,
                  activeColor: const Color(0xFF6A0DAD),
                  onChanged: Acessibilidade.alternarModoEscuro,
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
