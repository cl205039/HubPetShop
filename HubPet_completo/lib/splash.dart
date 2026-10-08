import 'dart:async';
import 'package:flutter/material.dart';
import 'inicio.dart';

// ============================================================
// SPLASH — primeira tela ao abrir o app. Fica 4 segundos e vai
// direto para a Home do dono de pet (InicioPage). O login não é
// mais pedido aqui: ele só aparece no fechamento da compra
// (ver carrinho.dart -> _finalizar).
// ============================================================

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer(const Duration(seconds: 4), () {
      if (!mounted) return;
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const InicioPage()),
      );
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

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
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Image.asset(
                'assets/images/imagem.jpg.png',
                height: 160,
                width: 160,
              ),
              const SizedBox(height: 20),
              const Text(
                'HubPetShop',
                style: TextStyle(
                  fontSize: 30,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'O marketplace do seu pet 🐾',
                style: TextStyle(fontSize: 14, color: Colors.white70),
              ),
              const SizedBox(height: 40),
              const SizedBox(
                height: 26,
                width: 26,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2.5,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
