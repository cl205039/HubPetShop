import 'package:flutter/material.dart';

class DescricaoProjetoPage extends StatelessWidget {
  const DescricaoProjetoPage({super.key});

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
                      'Sobre o Projeto',
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
                    borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: ListView(
                    padding: const EdgeInsets.all(25),
                    children: [
                      // Logo grande
                      Center(
                        child: Container(
                          child: Center(
                            child: Image.asset('assets/images/imagem.jpg.png', height: 150, width: 150,),
                          ),
                        ),
                      ),

                      const SizedBox(height: 20),

                      const Center(
                        child: Text(
                          'HubPetShop',
                          style: TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF6A0DAD),
                          ),
                        ),
                      ),

                      const Center(
                        child: Text(
                          'Conectando pets e pessoas 🐶🐱',
                          style: TextStyle(color: Colors.grey, fontSize: 14),
                        ),
                      ),

                      const SizedBox(height: 25),

                      // Descrição
                      _secao(
                        emoji: '📌',
                        titulo: 'O que é o HubPet?',
                        texto:
                            'O HubPet é um aplicativo desenvolvido como Projeto Integrador que conecta donos de pets a serviços veterinários, petshops e profissionais da área pet. '
                            'Com ele você consegue agendar banho, tosa, consultas, encontrar petshops próximos e muito mais — tudo em um só lugar!',
                      ),

                      const SizedBox(height: 20),

                      // Cards de funcionalidades
                      const Text(
                        '⚡ Funcionalidades',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),

                      const SizedBox(height: 12),

                      Wrap(
                        spacing: 10,
                        runSpacing: 10,
                        children: [
                          _chip('🛁 Banho & Tosa', Colors.blue),
                          _chip('🩺 Consulta Vet', Colors.green),
                          _chip('💉 Vacinas', Colors.orange),
                          _chip('📅 Agendamentos', Colors.purple),
                          _chip('🗺️ Petshops no mapa', Colors.red),
                          _chip('🐾 Meus Pets', Colors.teal),
                          _chip('💳 Pagamentos', Colors.indigo),
                          _chip('📦 Pedidos', Colors.brown),
                        ],
                      ),

                      const SizedBox(height: 25),

                      _secao(
                        emoji: '🎯',
                        titulo: 'Objetivo',
                        texto:
                            'Facilitar o acesso dos tutores a serviços de qualidade para seus pets, '
                            'centralizando agendamentos, histórico de atendimentos e pagamentos em um aplicativo moderno e intuitivo.',
                      ),

                      const SizedBox(height: 20),

                      _secao(
                        emoji: '🛠️',
                        titulo: 'Tecnologias Utilizadas',
                        texto:
                            'O app foi desenvolvido em Flutter (Dart), utilizando widgets nativos do Material Design, '
                            'navegação entre telas, estado com StatefulWidget e armazenamento em memória (vetores) para simular um banco de dados.',
                      ),

                      const SizedBox(height: 20),

                      // Destaque colorido
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF6A0DAD), Color(0xFF9C27B0)],
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: const [
                            Text(
                              '💡 Projeto Integrador',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Este aplicativo foi criado como parte do Projeto Integrador do curso de Desenvolvimento de Sistemas, '
                              'integrando conceitos de programação mobile, UI/UX e lógica de programação.',
                              style: TextStyle(color: Colors.white70, fontSize: 13),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),
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

  Widget _secao({required String emoji, required String titulo, required String texto}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$emoji $titulo',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
          ),
          const SizedBox(height: 8),
          Text(
            texto,
            style: const TextStyle(color: Colors.black87, height: 1.5, fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, Color cor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: cor.withAlpha(25),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: cor.withAlpha(80)),
      ),
      child: Text(label, style: TextStyle(color: cor, fontSize: 13, fontWeight: FontWeight.w500)),
    );
  }
}
