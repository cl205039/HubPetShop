import 'package:flutter/material.dart';
import 'acessibilidade.dart';

class AcessibilidadePage extends StatelessWidget {
  const AcessibilidadePage({super.key});

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
                      'Acessibilidade',
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
                  margin: const EdgeInsets.only(top: 5),
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: ListView(
                    children: [
                      const Text(
                        'Tamanho do texto',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Ajusta o tamanho das letras em todas as telas do app.',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      ValueListenableBuilder<double>(
                        valueListenable: Acessibilidade.escalaTexto,
                        builder: (context, escala, _) {
                          final indice =
                              Acessibilidade.escalas.indexOf(escala);
                          return Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF5F5F5),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Row(
                              children: [
                                IconButton.filled(
                                  tooltip: 'Diminuir texto',
                                  style: IconButton.styleFrom(
                                    backgroundColor: const Color(0xFF6A0DAD),
                                  ),
                                  onPressed: indice > 0
                                      ? Acessibilidade.diminuirTexto
                                      : null,
                                  icon: const Icon(Icons.remove),
                                ),
                                Expanded(
                                  child: Column(
                                    children: [
                                      Text(
                                        Acessibilidade.nomesEscala[indice],
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Abc',
                                        textAlign: TextAlign.center,
                                        style: TextStyle(
                                          fontSize: 22 * escala,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF6A0DAD),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                IconButton.filled(
                                  tooltip: 'Aumentar texto',
                                  style: IconButton.styleFrom(
                                    backgroundColor: const Color(0xFF6A0DAD),
                                  ),
                                  onPressed: indice <
                                          Acessibilidade.escalas.length - 1
                                      ? Acessibilidade.aumentarTexto
                                      : null,
                                  icon: const Icon(Icons.add),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 28),
                      const Divider(),
                      const SizedBox(height: 12),
                      const Text(
                        'Contraste',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Aumenta o contraste de cores em todas as telas, '
                        'facilitando a leitura.',
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
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
              ),
            ],
          ),
        ),
      ),
    );
  }
}
