import 'package:flutter/material.dart';

class Acessibilidade {
  Acessibilidade._();

  static const List<double> escalas = [0.85, 1.0, 1.15, 1.3];
  static const List<String> nomesEscala = [
    'Pequeno',
    'Normal',
    'Grande',
    'Enorme',
  ];

  static final ValueNotifier<double> escalaTexto = ValueNotifier(1.0);
  static final ValueNotifier<bool> altoContraste = ValueNotifier(false);

  static final ValueNotifier<bool> modoEscuro = ValueNotifier(false);

  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static int get indiceEscalaAtual => escalas.indexOf(escalaTexto.value);

  static void aumentarTexto() {
    final i = indiceEscalaAtual;
    if (i < escalas.length - 1) escalaTexto.value = escalas[i + 1];
  }

  static void diminuirTexto() {
    final i = indiceEscalaAtual;
    if (i > 0) escalaTexto.value = escalas[i - 1];
  }

  static void alternarContraste(bool valor) {
    altoContraste.value = valor;
  }

  static void alternarModoEscuro(bool valor) {
    modoEscuro.value = valor;
  }
}
