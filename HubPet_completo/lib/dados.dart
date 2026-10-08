import 'package:flutter/material.dart';
import 'app_data.dart';
import 'rodape_nav.dart';

class Dados extends StatelessWidget {
  const Dados({super.key});

  @override
  Widget build(BuildContext context) {
    // FIX: antes essa tela era 100% hardcoded e nem lia o usuário
    // logado — agora mostra os dados de verdade, como já fazia DadosVet.
    final u = AppData.usuarioLogado;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF4A148C),
              Color(0xFF6A1B9A),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          bottom: false,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  const Text(
                    "Meus dados",
                    style: TextStyle(color: Colors.white, fontSize: 20),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              Container(
                padding:
                    const EdgeInsets.symmetric(vertical: 25, horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    const Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 45,
                          backgroundColor: Colors.grey,
                          child:
                              Icon(Icons.person, size: 50, color: Colors.white),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: Colors.orange,
                              shape: BoxShape.circle,
                            ),
                            child: Padding(
                              padding: EdgeInsets.all(6),
                              child: Icon(Icons.edit,
                                  color: Colors.white, size: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 25),
                    InfoItem(
                      icon: Icons.person,
                      label: "Nome completo",
                      value: u?.nome ?? '-',
                    ),
                    const Divider(),
                    InfoItem(
                      icon: Icons.badge,
                      label: "CPF",
                      value: u?.cpf ?? '-',
                    ),
                    const Divider(),
                    InfoItem(
                      icon: Icons.email,
                      label: "E-mail",
                      value: u?.email ?? '-',
                    ),
                    const Divider(),
                    InfoItem(
                      icon: Icons.phone,
                      label: "Telefone",
                      value: u?.telefone ?? '-',
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      bottomNavigationBar: const RodapeNav(),
    );
  }
}

class InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const InfoItem({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.orange),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: const TextStyle(color: Colors.grey, fontSize: 13),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: const TextStyle(fontSize: 16),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
