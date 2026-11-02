import 'package:flutter/material.dart';
import 'splash.dart';
import 'route_observer.dart';
import 'acessibilidade.dart';
import 'acessibilidade_flutuante.dart';

void main() {
  runApp(const HubPetApp());
}

class HubPetApp extends StatelessWidget {
  const HubPetApp({super.key});

  static const _filtroAltoContraste = ColorFilter.matrix(<double>[
    1.4, 0, 0, 0, -51.2,
    0, 1.4, 0, 0, -51.2,
    0, 0, 1.4, 0, -51.2,
    0, 0, 0, 1, 0,
  ]);

  static const _filtroModoEscuro = ColorFilter.matrix(<double>[
    -1, 0, 0, 0, 255,
    0, -1, 0, 0, 255,
    0, 0, -1, 0, 255,
    0, 0, 0, 1, 0,
  ]);

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([
        Acessibilidade.escalaTexto,
        Acessibilidade.altoContraste,
        Acessibilidade.modoEscuro,
      ]),
      builder: (context, _) {
        return MaterialApp(
          title: 'HubPet',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            colorScheme: ColorScheme.fromSeed(
              seedColor: const Color(0xFF6A0DAD),
              primary: const Color(0xFF6A0DAD),
              secondary: Colors.orange
            ),
            useMaterial3: true,
          ),
          navigatorKey: Acessibilidade.navigatorKey,
          navigatorObservers: [routeObserver],
          builder: (context, child) {
            Widget conteudo = Stack(
              children: [
                MediaQuery(
                  data: MediaQuery.of(context).copyWith(
                    textScaler:
                        TextScaler.linear(Acessibilidade.escalaTexto.value),
                  ),
                  child: child!,
                ),
                const BotaoAcessibilidade(),
              ],
            );
            if (Acessibilidade.modoEscuro.value) {
              conteudo = ColorFiltered(
                colorFilter: _filtroModoEscuro,
                child: conteudo,
              );
            }
            if (Acessibilidade.altoContraste.value) {
              conteudo = ColorFiltered(
                colorFilter: _filtroAltoContraste,
                child: conteudo,
              );
            }
            return conteudo;
          },
          home: const SplashPage(),
        );
      },
    );
  }
}
