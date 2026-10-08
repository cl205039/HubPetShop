import 'package:flutter/material.dart';
import 'app_data.dart';
import 'dados_vet.dart';
import 'servicos_vet.dart';
import 'agendamentos.dart';
import 'descricao_projeto.dart';
import 'sobre_nos.dart';
import 'busca_usuarios.dart';
import 'telainicio.dart';

class HomeVet extends StatelessWidget {
  const HomeVet({super.key});

  @override
  Widget build(BuildContext context) {
    final usuario = AppData.usuarioLogado;

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF4A148C), Color(0xFF6A1B9A)],
          ),
        ),
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
                    // Card do veterinário
                    Row(
                      children: [
                        const CircleAvatar(
                          radius: 28,
                          backgroundColor: Color(0xFF6A0DAD),
                          child:
                              Icon(Icons.person, color: Colors.white, size: 28),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                usuario?.nome ?? 'Veterinário',
                                style: const TextStyle(
                                    fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              Text(
                                usuario?.email ?? '',
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 12),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF6A0DAD).withAlpha(20),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Text(
                                  '🩺 Veterinário',
                                  style: TextStyle(
                                    color: Color(0xFF6A0DAD),
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 15),
                    const Divider(),

                    // ── Itens principais ──
                    _item(context, Icons.badge, 'Meus dados', const DadosVet()),
                    _item(context, Icons.medical_services, 'Meus serviços',
                        const ServicosVetPage()),
                    _item(context, Icons.calendar_today, 'Minha agenda',
                        const AgendamentosPage()),

                    const Divider(),

                    // ── Projeto integrador ──
                    _item(context, Icons.info_outline, 'Sobre o Projeto',
                        const DescricaoProjetoPage()),
                    _item(context, Icons.people_outline, 'Sobre Nós',
                        const SobreNosPage()),
                    _item(context, Icons.search, 'Buscar Usuários',
                        const BuscaUsuariosPage()),

                    const Divider(),

                    // ── Sair ──
                    ListTile(
                      leading: const Icon(Icons.logout, color: Colors.red),
                      title: const Text('Sair',
                          style: TextStyle(color: Colors.red)),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: () {
                        AppData.logout();
                        Navigator.pushAndRemoveUntil(
                          context,
                          MaterialPageRoute(builder: (_) => const Telainicio()),
                          (_) => false,
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _item(BuildContext context, IconData icon, String texto, Widget tela) {
    return Column(
      children: [
        ListTile(
          leading: Icon(icon, color: Colors.orange),
          title: Text(texto),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => tela),
          ),
        ),
        const Divider(height: 1),
      ],
    );
  }
}
