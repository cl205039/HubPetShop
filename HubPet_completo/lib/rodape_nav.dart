import 'package:flutter/material.dart';
import 'lista_petshops.dart';
import 'agendamentos.dart';
import 'endereco.dart';
import 'dados.dart';

// ============================================================
// RODAPÉ DE NAVEGAÇÃO — barra de atalhos por ícone usada em todas
// as telas de navegação do dono de pet. Não tem "aba selecionada":
// é só um atalho rápido. Cada tela adiciona no seu Scaffold:
//
//   bottomNavigationBar: const RodapeNav(),
//
// e, se o corpo usa SafeArea, passa `bottom: false` nela para não
// duplicar o respiro inferior.
// ============================================================

class RodapeNav extends StatelessWidget {
  const RodapeNav({super.key});

  static const Color _roxo = Color(0xFF6A0DAD);

  void _abrir(BuildContext context, Widget destino) {
    Navigator.push(context, MaterialPageRoute(builder: (_) => destino));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black12, blurRadius: 10, offset: Offset(0, -2)),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
          child: Row(
            children: [
              _item(context, Icons.home, 'Início',
                  () => Navigator.popUntil(context, (r) => r.isFirst)),
              _item(context, Icons.storefront, 'Petshops',
                  () => _abrir(context, const ListaPetshopsPage())),
              _item(context, Icons.event_note, 'Agenda',
                  () => _abrir(context, const AgendamentosPage())),
              _item(context, Icons.receipt_long, 'Pedidos',
                  () => _abrir(context, const PedidosPage())),
              _item(context, Icons.badge, 'Meus dados',
                  () => _abrir(context, const Dados())),
            ],
          ),
        ),
      ),
    );
  }

  Widget _item(
      BuildContext context, IconData icon, String label, VoidCallback onTap) {
    return Expanded(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 6),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, color: _roxo, size: 22),
              const SizedBox(height: 3),
              Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 10.5, color: _roxo),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
