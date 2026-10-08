import 'package:flutter/material.dart';

class SobreNosPage extends StatelessWidget {
  const SobreNosPage({super.key});

  // ── Substitua pelos dados reais dos desenvolvedores ──
  static const List<Map<String, dynamic>> devs = [
    {
      'nome': 'Laura Soares Machado',
      'funcao': 'Desenvolvedor Mobile',
      'bio':
          'Responsável pela interface do usuário e navegação entre telas. Apaixonado por design e experiência do usuário.',
      'emoji': '👨‍💻',
      'cor': Color(0xFF6A0DAD),
      'skills': [
        'HTML',
        'CSS',
        'JavaScript',
        'Flutter Web',
        'Responsividade',
        'Dart'
      ],
    },
    {
      'nome': 'Lavignia Gabrielli da Silva ',
      'funcao': 'Desenvolvedor de Backend (Desktop)',
      'bio':
          'Responsável pela lógica de negócio, estrutura de dados e fluxo da aplicação. ',
      'emoji': '👩‍💻',
      'cor': Colors.orange,
      'skills': ['Dart', 'Lógica', 'Estrutura de Dados', 'UML', 'Electron'],
    },
    {
      'nome': 'Luiza França',
      'funcao': 'Desenvolvedor Mobile',
      'bio':
          'Responsável pela interface do usuário e navegação entre telas. Apaixonado por design e experiência do usuário.',
      'emoji': '🧑‍💻',
      'cor': Color(0xFF00BCD4),
      'skills': [
        'HTML',
        'CSS',
        'JavaScript',
        'Flutter Web',
        'Responsividade',
        'Dart'
      ],
    },
    {
      'nome': 'Nayara Silva',
      'funcao': 'Desenvolvimento WEB',
      'bio':
          'Responsável pelo desenvolvimento das interfaces web, garantindo design responsivo e boa experiência ao usuário.',
      'emoji': '🧑‍💻',
      'cor': Color(0xFF00BCD4),
      'skills': [
        'HTML',
        'CSS',
        'JavaScript',
        'Flutter Web',
        'Responsividade',
        'PHP'
      ],
    },
  ];

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
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const Text(
                      'Sobre Nós',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),

              Expanded(
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: ListView(
                    padding: const EdgeInsets.all(20),
                    children: [
                      // Banner equipe
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6A0DAD), Color(0xFF9C27B0)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Column(
                          children: [
                            Text('👥', style: TextStyle(fontSize: 40)),
                            SizedBox(height: 8),
                            Text(
                              'Nossa Equipe',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 5),
                            Text(
                              'Projeto Integrador',
                              style: TextStyle(
                                  color: Colors.white70, fontSize: 13),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),

                      // Cards dos devs
                      ...devs.map((dev) => _CardDev(dev: dev)),

                      const SizedBox(height: 10),

                      // Sobre o projeto
                      Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '🏫 Sobre o Projeto',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold, fontSize: 15),
                            ),
                            SizedBox(height: 10),
                            _InfoRow(
                                icon: Icons.school,
                                label: 'Instituição',
                                valor: 'Cotil - Unicamp'),
                            _InfoRow(
                                icon: Icons.class_,
                                label: 'Curso',
                                valor: 'Desenvolvimento de Sistemas'),
                            _InfoRow(
                                icon: Icons.person,
                                label: 'Professora',
                                valor: 'Tânia'),
                            _InfoRow(
                                icon: Icons.calendar_today,
                                label: 'Ano',
                                valor: '2026'),
                          ],
                        ),
                      ),

                      const SizedBox(height: 10),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _CardDev extends StatelessWidget {
  final Map<String, dynamic> dev;
  const _CardDev({required this.dev});

  @override
  Widget build(BuildContext context) {
    final Color cor = dev['cor'] as Color;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cor.withAlpha(60)),
        boxShadow: [
          BoxShadow(
            color: cor.withAlpha(30),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: cor.withAlpha(25),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Center(
                  child:
                      Text(dev['emoji'], style: const TextStyle(fontSize: 28)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      dev['nome'],
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Text(
                      dev['funcao'],
                      style: TextStyle(
                          color: cor,
                          fontSize: 13,
                          fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            dev['bio'],
            style: const TextStyle(
                color: Colors.black54, fontSize: 13, height: 1.4),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 6,
            runSpacing: 6,
            children: (dev['skills'] as List<String>)
                .map((skill) => Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: cor.withAlpha(20),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        skill,
                        style: TextStyle(
                            color: cor,
                            fontSize: 11,
                            fontWeight: FontWeight.bold),
                      ),
                    ))
                .toList(),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String valor;

  const _InfoRow(
      {required this.icon, required this.label, required this.valor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 18, color: const Color(0xFF6A0DAD)),
          const SizedBox(width: 8),
          Text('$label: ',
              style:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Expanded(
            child: Text(valor,
                style: const TextStyle(color: Colors.black54, fontSize: 13)),
          ),
        ],
      ),
    );
  }
}
