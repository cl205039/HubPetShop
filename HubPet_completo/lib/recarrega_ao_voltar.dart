import 'package:flutter/widgets.dart';
import 'route_observer.dart';

// ============================================================
// RECARREGA AO VOLTAR — mixin para telas que consultam a API.
//
// Por padrão o Flutter só roda o `initState` (e o fetch) uma vez,
// quando a tela é criada. Com este mixin a tela também refaz a
// consulta toda vez que volta a ficar visível — ou seja, quando o
// usuário fecha uma tela que estava por cima dela. Assim os dados
// nunca ficam "presos" no estado de quando a tela foi aberta.
//
// Depende do `routeObserver` global registrado no MaterialApp
// (ver main.dart / route_observer.dart).
//
// Uso:
//   class _FooState extends State<Foo> with RouteAware, RecarregaAoVoltar {
//     @override
//     void recarregar() => _carregarFoo(); // mesmo método do initState
//   }
// ============================================================

mixin RecarregaAoVoltar<T extends StatefulWidget> on State<T>, RouteAware {
  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final route = ModalRoute.of(context);
    if (route is PageRoute) routeObserver.subscribe(this, route);
  }

  @override
  void dispose() {
    routeObserver.unsubscribe(this);
    super.dispose();
  }

  /// Refaz a consulta à API. Implemente chamando o mesmo método de
  /// carga usado no `initState` da tela.
  void recarregar();

  @override
  void didPopNext() {
    if (mounted) recarregar();
  }
}
