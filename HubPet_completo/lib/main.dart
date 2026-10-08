import 'package:flutter/material.dart';
import 'splash.dart';
import 'route_observer.dart';

void main() {
  runApp(const HubPetApp());
}

class HubPetApp extends StatelessWidget {
  const HubPetApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'HubPet',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6A0DAD),
          primary: const Color(0xFF6A0DAD),
          secondary: Colors.orange,
        ),
        useMaterial3: true,
      ),
      navigatorObservers: [routeObserver],
      home: const SplashPage(),
    );
  }
}
