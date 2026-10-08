import 'package:flutter/material.dart';
import 'telacadastro.dart';

class EscolhaPage extends StatelessWidget {
  // Repassado ao cadastro: quando true, o fluxo foi iniciado no
  // fechamento da compra e deve voltar para lá ao concluir.
  final bool voltarAposLogin;

  const EscolhaPage({super.key, this.voltarAposLogin = false});

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
          child: Padding(
            padding: const EdgeInsets.all(25),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Image.asset(
                  'assets/images/imagem.jpg.png',
                  height: 150,
                  width: 150,
                ),
                const SizedBox(height: 15),
                const Text(
                  'Como você deseja usar o HubPetShop?',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 22,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 50),
                _CardOpcao(
                  titulo: 'Sou Dono de Pet',
                  descricao: 'Buscar serviços para meu pet',
                  icone: Icons.pets,
                  onTap: () async {
                    final logou = await Navigator.push<bool>(
                      context,
                      MaterialPageRoute(
                        builder: (_) =>
                            CadastroPage(voltarAposLogin: voltarAposLogin),
                      ),
                    );
                    // Repassa o sucesso do cadastro para quem abriu a
                    // escolha (fluxo de fechamento da compra).
                    if (logou != true || !voltarAposLogin || !context.mounted) {
                      return;
                    }
                    Navigator.pop(context, true);
                  },
                ),
                const SizedBox(height: 30),
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text(
                    'Já tenho conta — Fazer login',
                    style: TextStyle(color: Colors.white70),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _CardOpcao extends StatefulWidget {
  final String titulo;
  final String descricao;
  final IconData icone;
  final VoidCallback onTap;

  const _CardOpcao({
    required this.titulo,
    required this.descricao,
    required this.icone,
    required this.onTap,
  });

  @override
  State<_CardOpcao> createState() => _CardOpcaoState();
}

class _CardOpcaoState extends State<_CardOpcao> {
  double _scale = 1.0;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: (_) => setState(() => _scale = 0.96),
      onTapUp: (_) {
        setState(() => _scale = 1.0);
        widget.onTap();
      },
      onTapCancel: () => setState(() => _scale = 1.0),
      child: AnimatedScale(
        scale: _scale,
        duration: const Duration(milliseconds: 120),
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: const [
              BoxShadow(
                  blurRadius: 15, offset: Offset(0, 8), color: Colors.black12),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF6A0DAD).withAlpha(25),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Icon(widget.icone,
                    color: const Color(0xFF6A0DAD), size: 30),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.titulo,
                      style: const TextStyle(
                          fontSize: 16, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.descricao,
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
