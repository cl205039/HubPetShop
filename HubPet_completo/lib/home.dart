import 'package:flutter/material.dart';
import 'app_data.dart';
import 'inicio.dart';
import 'meuspets.dart';
import 'meus_enderecos.dart';
import 'descricao_projeto.dart';
import 'sobre_nos.dart';
import 'telainicio.dart';
import 'rodape_nav.dart';

class Home extends StatelessWidget {
  const Home({super.key});

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
          bottom: false,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Botão de voltar para o início
              Row(
                children: [
                  GestureDetector(
                    onTap: () {
                      if (Navigator.canPop(context)) {
                        Navigator.pop(context);
                      } else {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const InicioPage()),
                        );
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(40),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.arrow_back,
                          color: Colors.white, size: 22),
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Text(
                    'Início',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Card do usuário
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Column(
                  children: [
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
                                usuario?.nome ?? 'Minha Conta',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                usuario?.email ?? '',
                                style: const TextStyle(
                                    color: Colors.grey, fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 15),
                    const Divider(),

                    // ── Itens do menu ──
                    // Meus dados / Meus Pedidos / Meus Agendamentos / Petshops
                    // agora são atalhos por ícone no rodapé (bottomNavigationBar).
                    _item(context, Icons.pets, 'Meu pet', const MeusPets()),
                    _item(context, Icons.location_on, 'Meus Endereços',
                        const MeusEnderecosPage()),

                    const Divider(),

                    // ── Páginas do projeto integrador ──
                    _item(context, Icons.info_outline, 'Sobre o Projeto',
                        const DescricaoProjetoPage()),
                    _item(context, Icons.people_outline, 'Sobre Nós',
                        const SobreNosPage()),

                    const Divider(),

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
      bottomNavigationBar: const RodapeNav(),
    );
  }

  Widget _item(
      BuildContext context, IconData icon, String texto, Widget? tela) {
    return Column(
      children: [
        ListTile(
          leading: Icon(icon, color: Colors.orange),
          title: Text(texto),
          trailing: const Icon(Icons.arrow_forward_ios, size: 16),
          onTap: () {
            if (tela != null) {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => tela),
              );
            }
          },
        ),
        const Divider(height: 1),
      ],
    );
  }
}
