import 'package:flutter/widgets.dart';
import 'route_observer.dart';

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

  void recarregar();

  @override
  void didPopNext() {
    if (mounted) recarregar();
  }
}
