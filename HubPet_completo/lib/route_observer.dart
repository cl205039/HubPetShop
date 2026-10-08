import 'package:flutter/widgets.dart';

// ============================================================
// ROUTE OBSERVER — observer global de rotas registrado no
// MaterialApp (ver main.dart). Telas que precisam se reconstruir
// quando voltam a ficar no topo da pilha se inscrevem nele via
// `RouteAware` e reagem no `didPopNext()`.
//
// Uso hoje: InicioPage relê `AppData.usuarioLogado` para atualizar
// o cabeçalho ("Olá, <nome>") depois que o login/cadastro acontece
// em outra tela (fechamento da compra, botão "Entrar", etc.).
// ============================================================

final RouteObserver<PageRoute<dynamic>> routeObserver =
    RouteObserver<PageRoute<dynamic>>();
