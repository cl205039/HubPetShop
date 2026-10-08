import 'package:flutter/material.dart';
import 'app_data.dart';

class DadosVet extends StatelessWidget {
  const DadosVet({super.key});

  @override
  Widget build(BuildContext context) {
    final u = AppData.usuarioLogado;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF4A148C), Color(0xFF6A1B9A)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
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
                    'Meus dados',
                    style: TextStyle(
                        color: Colors.white,
                        fontSize: 20,
                        fontWeight: FontWeight.bold),
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
                    Stack(
                      alignment: Alignment.bottomRight,
                      children: [
                        CircleAvatar(
                          radius: 45,
                          backgroundColor:
                              const Color(0xFF6A0DAD).withAlpha(40),
                          child: const Icon(Icons.person,
                              size: 50, color: Color(0xFF6A0DAD)),
                        ),
                        Container(
                          decoration: const BoxDecoration(
                              color: Colors.orange, shape: BoxShape.circle),
                          padding: const EdgeInsets.all(6),
                          child: const Icon(Icons.edit,
                              color: Colors.white, size: 16),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6A0DAD).withAlpha(20),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        '🩺 Veterinário',
                        style: TextStyle(
                            color: Color(0xFF6A0DAD),
                            fontWeight: FontWeight.bold,
                            fontSize: 12),
                      ),
                    ),
                    const SizedBox(height: 20),
                    _InfoItem(
                        icon: Icons.person,
                        label: 'Nome completo',
                        value: u?.nome ?? '-'),
                    const Divider(),
                    _InfoItem(
                        icon: Icons.badge, label: 'CRMV', value: u?.cpf ?? '-'),
                    const Divider(),
                    _InfoItem(
                        icon: Icons.email,
                        label: 'E-mail',
                        value: u?.email ?? '-'),
                    const Divider(),
                    _InfoItem(
                        icon: Icons.phone,
                        label: 'Telefone',
                        value: u?.telefone ?? '-'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoItem(
      {required this.icon, required this.label, required this.value});

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
                Text(label,
                    style: const TextStyle(color: Colors.grey, fontSize: 13)),
                const SizedBox(height: 4),
                Text(value, style: const TextStyle(fontSize: 16)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
