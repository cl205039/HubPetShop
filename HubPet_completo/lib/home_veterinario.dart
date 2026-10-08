import 'package:flutter/material.dart';
import 'sobre_nos.dart';
import 'descricao_projeto.dart';
import 'app_data.dart';
import 'telainicio.dart';
import 'home_vet.dart';

class HomeVeterinarioPage extends StatefulWidget {
  const HomeVeterinarioPage({super.key});

  @override
  State<HomeVeterinarioPage> createState() => _HomeVeterinarioPageState();
}

class _HomeVeterinarioPageState extends State<HomeVeterinarioPage> {
  // TODO(api): não migrado para a API — um agendamento hoje não guarda
  // qual veterinário atendeu (agendar.dart nunca pergunta isso), então
  // não há como popular esta lista com agendamentos reais sem também
  // mudar o fluxo de agendamento. Fica como mock local por enquanto.
  final List<Map<String, String>> atendimentos = [
    {"pet": "Rex 🐶", "servico": "Consulta", "hora": "09:00"},
    {"pet": "Luna 🐩", "servico": "Vacina", "hora": "10:30"},
    {"pet": "Mia 🐱", "servico": "Cirurgia", "hora": "14:00"},
    {"pet": "Bob 🐕", "servico": "Consulta", "hora": "15:00"},
    {"pet": "Nina 🐈", "servico": "Vacina", "hora": "16:30"},
  ];

  List<Map<String, String>> atendimentosFiltrados = [];
  String _textoBusca = '';
  String _filtroServico = 'Todos';

  final List<String> _servicos = ['Todos', 'Consulta', 'Vacina', 'Cirurgia'];

  @override
  void initState() {
    super.initState();
    atendimentosFiltrados = List.from(atendimentos);
  }

  void _aplicarFiltros({String? texto, String? servico}) {
    final busca = texto ?? _textoBusca;
    final filtro = servico ?? _filtroServico;

    setState(() {
      _textoBusca = busca;
      _filtroServico = filtro;
      atendimentosFiltrados = atendimentos.where((item) {
        final nomeBate =
            item["pet"]!.toLowerCase().contains(busca.toLowerCase());
        final servicoBate = filtro == 'Todos' || item["servico"] == filtro;
        return nomeBate && servicoBate;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final usuario = AppData.usuarioLogado;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Color(0xFF6A0DAD), Color(0xFF9C27B0)],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    GestureDetector(
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const HomeVet()),
                      ),
                      child: const CircleAvatar(
                        radius: 25,
                        backgroundColor: Colors.white,
                        child: Icon(Icons.person,
                            color: Colors.deepPurple, size: 30),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Bem-vindo 👋",
                            style: TextStyle(color: Colors.white70),
                          ),
                          Text(
                            usuario?.nome.split(' ').first ?? 'Veterinário',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.logout, color: Colors.white70),
                      onPressed: () {
                        AppData.logout();
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => const Telainicio()),
                        );
                      },
                    ),
                  ],
                ),
              ),

              // Busca por nome
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 15),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: TextField(
                    onChanged: (v) => _aplicarFiltros(texto: v),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      icon: Icon(Icons.search),
                      hintText: "Pesquisar paciente...",
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Chips de filtro por serviço
              SizedBox(
                height: 38,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  scrollDirection: Axis.horizontal,
                  itemCount: _servicos.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, i) {
                    final selecionado = _filtroServico == _servicos[i];
                    return GestureDetector(
                      onTap: () => _aplicarFiltros(servico: _servicos[i]),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 8),
                        decoration: BoxDecoration(
                          color: selecionado ? Colors.white : Colors.white24,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _servicos[i],
                          style: TextStyle(
                            color: selecionado
                                ? const Color(0xFF6A0DAD)
                                : Colors.white,
                            fontWeight: selecionado
                                ? FontWeight.bold
                                : FontWeight.normal,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 12),

              // Cards de info
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _cardInfo("Hoje", "3"),
                    _cardInfo("Pacientes", "124"),
                    _cardInfo("Avaliação", "4.9⭐"),
                    _cardInfo("Cirurgias", "18"),
                  ],
                ),
              ),

              const SizedBox(height: 12),

              // Próximo atendimento
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.deepPurple.shade400,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.access_time,
                          color: Colors.white, size: 40),
                      const SizedBox(width: 15),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Próximo Atendimento",
                            style: TextStyle(color: Colors.white70),
                          ),
                          Text(
                            atendimentos.isNotEmpty
                                ? "${atendimentos.first["pet"]} • ${atendimentos.first["hora"]}"
                                : "Sem atendimentos",
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),

              // Área branca
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(35)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Cards Sobre Nós / Sobre o Projeto
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) =>
                                          const DescricaoProjetoPage())),
                              child: Container(
                                padding: const EdgeInsets.all(15),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF6A0DAD).withAlpha(20),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                      color: const Color(0xFF6A0DAD)
                                          .withAlpha(50)),
                                ),
                                child: const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('📋', style: TextStyle(fontSize: 28)),
                                    SizedBox(height: 6),
                                    Text(
                                      'Sobre o Projeto',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color: Color(0xFF6A0DAD),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => const SobreNosPage())),
                              child: Container(
                                padding: const EdgeInsets.all(15),
                                decoration: BoxDecoration(
                                  color: Colors.teal.withAlpha(20),
                                  borderRadius: BorderRadius.circular(18),
                                  border: Border.all(
                                      color: Colors.teal.withAlpha(50)),
                                ),
                                child: const Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text('👥', style: TextStyle(fontSize: 28)),
                                    SizedBox(height: 6),
                                    Text(
                                      'Sobre Nós',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        color: Colors.teal,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 12,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Título com contador
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            "Atendimentos de Hoje",
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFF6A0DAD).withAlpha(20),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              "${atendimentosFiltrados.length} resultado${atendimentosFiltrados.length != 1 ? 's' : ''}",
                              style: const TextStyle(
                                color: Color(0xFF6A0DAD),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 12),

                      // Lista ou mensagem vazia
                      Expanded(
                        child: atendimentosFiltrados.isEmpty
                            ? Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Text('🔍',
                                        style: TextStyle(fontSize: 48)),
                                    const SizedBox(height: 12),
                                    Text(
                                      _filtroServico != 'Todos'
                                          ? 'Nenhum paciente com\n"$_filtroServico" encontrado'
                                          : 'Nenhum paciente encontrado\npara "$_textoBusca"',
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                          color: Colors.grey, fontSize: 15),
                                    ),
                                  ],
                                ),
                              )
                            : ListView.builder(
                                itemCount: atendimentosFiltrados.length,
                                itemBuilder: (context, index) {
                                  final item = atendimentosFiltrados[index];
                                  return Card(
                                    elevation: 4,
                                    margin: const EdgeInsets.only(bottom: 12),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: ListTile(
                                      leading: CircleAvatar(
                                        backgroundColor:
                                            Colors.deepPurple.shade100,
                                        child: const Icon(Icons.pets,
                                            color: Colors.deepPurple),
                                      ),
                                      title: Text(
                                        item["pet"]!,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold),
                                      ),
                                      subtitle: Text(item["servico"]!),
                                      trailing: Text(
                                        item["hora"]!,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 16,
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ),
                      ),

                      // Botões
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              icon: const Icon(Icons.calendar_month),
                              label: const Text("AGENDA"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                foregroundColor: Colors.white,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 15),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                              onPressed: () {},
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: ElevatedButton.icon(
                              icon: const Icon(Icons.medical_services),
                              label: const Text("SERVIÇOS"),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.deepPurple,
                                foregroundColor: Colors.white,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 15),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                              onPressed: () {},
                            ),
                          ),
                        ],
                      ),
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

  Widget _cardInfo(String titulo, String valor) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        children: [
          Text(titulo, style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 5),
          Text(
            valor,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
