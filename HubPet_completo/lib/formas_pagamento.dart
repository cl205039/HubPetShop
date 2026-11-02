import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum FormaPagamento { local, debito, credito, pix }

String mensagemConfirmacaoPagamento(
  FormaPagamento forma, {
  required String localTexto,
}) {
  switch (forma) {
    case FormaPagamento.local:
      return localTexto;
    case FormaPagamento.debito:
      return 'Pago no cartão de débito.';
    case FormaPagamento.credito:
      return 'Pago no cartão de crédito.';
    case FormaPagamento.pix:
      return 'Pague o Pix em até 30 minutos.';
  }
}

bool pagamentoValido(FormaPagamento forma, ControladoresCartao cartao) {
  if (forma == FormaPagamento.debito || forma == FormaPagamento.credito) {
    return cartao.valido;
  }
  return true;
}

class ControladoresCartao {
  final numero = TextEditingController();
  final nome = TextEditingController();
  final validade = TextEditingController();
  final cvv = TextEditingController();

  void dispose() {
    numero.dispose();
    nome.dispose();
    validade.dispose();
    cvv.dispose();
  }

  bool get valido {
    final digitos = numero.text.replaceAll(' ', '');
    return digitos.length == 16 &&
        nome.text.trim().isNotEmpty &&
        validade.text.length == 5 &&
        cvv.text.length >= 3;
  }
}

class SeletorFormaPagamento extends StatelessWidget {
  final FormaPagamento valor;
  final ValueChanged<FormaPagamento> onChanged;
  final String tituloLocal;
  final String subtituloLocal;
  final IconData iconeLocal;

  const SeletorFormaPagamento({
    super.key,
    required this.valor,
    required this.onChanged,
    required this.tituloLocal,
    required this.subtituloLocal,
    this.iconeLocal = Icons.local_shipping_outlined,
  });

  static const Color _roxo = Color(0xFF6A0DAD);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _opcao(
          forma: FormaPagamento.local,
          icone: iconeLocal,
          titulo: tituloLocal,
          subtitulo: subtituloLocal,
        ),
        const SizedBox(height: 10),
        _opcao(
          forma: FormaPagamento.debito,
          icone: Icons.credit_card,
          titulo: 'Cartão de débito',
          subtitulo: 'Pagamento online antecipado',
        ),
        const SizedBox(height: 10),
        _opcao(
          forma: FormaPagamento.credito,
          icone: Icons.credit_card,
          titulo: 'Cartão de crédito',
          subtitulo: 'Pagamento online antecipado',
        ),
        const SizedBox(height: 10),
        _opcao(
          forma: FormaPagamento.pix,
          icone: Icons.qr_code_2,
          titulo: 'Pix',
          subtitulo: 'Aprovação na hora',
        ),
      ],
    );
  }

  Widget _opcao({
    required FormaPagamento forma,
    required IconData icone,
    required String titulo,
    required String subtitulo,
  }) {
    final selecionado = valor == forma;
    return Semantics(
      button: true,
      selected: selecionado,
      label: '$titulo. $subtitulo${selecionado ? '. Selecionado' : ''}',
      child: GestureDetector(
        onTap: () => onChanged(forma),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: double.infinity,
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: selecionado ? _roxo.withAlpha(15) : const Color(0xFFF5F5F5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: selecionado ? _roxo : Colors.transparent,
              width: 1.5,
            ),
          ),
          child: Row(
            children: [
              Icon(icone, color: selecionado ? _roxo : Colors.grey, size: 26),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(titulo,
                        style: TextStyle(
                            fontWeight: FontWeight.bold,
                            color: selecionado ? _roxo : Colors.black87)),
                    Text(subtitulo,
                        style:
                            const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              Icon(
                selecionado
                    ? Icons.radio_button_checked
                    : Icons.radio_button_off,
                color: selecionado ? _roxo : Colors.grey,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class PainelFormaPagamento extends StatelessWidget {
  final FormaPagamento forma;
  final ControladoresCartao cartao;
  final VoidCallback onEditado;
  final String tituloLocal;
  final String subtituloLocal;
  final IconData iconeLocal;
  final Color corLocal;

  const PainelFormaPagamento({
    super.key,
    required this.forma,
    required this.cartao,
    required this.onEditado,
    required this.tituloLocal,
    required this.subtituloLocal,
    this.iconeLocal = Icons.local_shipping,
    this.corLocal = Colors.green,
  });

  static const Color _roxo = Color(0xFF6A0DAD);

  @override
  Widget build(BuildContext context) {
    Widget conteudo;
    switch (forma) {
      case FormaPagamento.local:
        conteudo = _painelLocal();
        break;
      case FormaPagamento.pix:
        conteudo = _painelPix();
        break;
      case FormaPagamento.debito:
      case FormaPagamento.credito:
        conteudo = _formularioCartao();
        break;
    }
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 220),
      child: conteudo,
    );
  }

  Widget _painelLocal() {
    return Container(
      key: const ValueKey(FormaPagamento.local),
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: corLocal,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: corLocal.withAlpha(80),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(iconeLocal, color: Colors.white, size: 30),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(tituloLocal,
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: Colors.white)),
                Text(subtituloLocal,
                    style: const TextStyle(color: Colors.white70)),
              ],
            ),
          ),
          const Icon(Icons.check_circle, color: Colors.white),
        ],
      ),
    );
  }

  Widget _painelPix() {
    return Container(
      key: const ValueKey(FormaPagamento.pix),
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF00BF7A).withAlpha(18),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFF00BF7A), width: 1.2),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.qr_code_2, color: Color(0xFF00BF7A), size: 28),
              SizedBox(width: 10),
              Text('Pagar com Pix',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
            ],
          ),
          SizedBox(height: 10),
          Text(
            'O código Pix é gerado depois de confirmar. '
            'Você terá 30 minutos para pagar.',
            style: TextStyle(color: Colors.grey, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _formularioCartao() {
    final credito = forma == FormaPagamento.credito;
    return Column(
      key: ValueKey(forma),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _previewCartao(credito: credito),
        const SizedBox(height: 20),
        TextField(
          controller: cartao.numero,
          keyboardType: TextInputType.number,
          inputFormatters: [_FormatadorNumeroCartao()],
          onChanged: (_) => onEditado(),
          decoration: _decoracaoCampo(
              'Número do cartão', Icons.credit_card, '0000 0000 0000 0000'),
        ),
        const SizedBox(height: 14),
        TextField(
          controller: cartao.nome,
          textCapitalization: TextCapitalization.characters,
          onChanged: (_) => onEditado(),
          decoration: _decoracaoCampo(
              'Nome impresso no cartão', Icons.person_outline, null),
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: cartao.validade,
                keyboardType: TextInputType.number,
                inputFormatters: [_FormatadorValidadeCartao()],
                onChanged: (_) => onEditado(),
                decoration: _decoracaoCampo(
                    'Validade', Icons.calendar_month_outlined, 'MM/AA'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: TextField(
                controller: cartao.cvv,
                keyboardType: TextInputType.number,
                obscureText: true,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(4),
                ],
                onChanged: (_) => onEditado(),
                decoration: _decoracaoCampo('CVV', Icons.lock_outline, '000'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: const [
            Icon(Icons.info_outline, size: 14, color: Colors.grey),
            SizedBox(width: 6),
            Expanded(
              child: Text(
                'Ambiente de demonstração — nenhum dado de cartão é enviado ou cobrado.',
                style: TextStyle(color: Colors.grey, fontSize: 11),
              ),
            ),
          ],
        ),
      ],
    );
  }

  InputDecoration _decoracaoCampo(String label, IconData icone, String? hint) {
    return InputDecoration(
      labelText: '$label *',
      hintText: hint,
      prefixIcon: Icon(icone, size: 20),
      filled: true,
      fillColor: const Color(0xFFF5F5F5),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide.none,
      ),
    );
  }

  Widget _previewCartao({required bool credito}) {
    final numero = cartao.numero.text.isEmpty
        ? '•••• •••• •••• ••••'
        : cartao.numero.text.padRight(19, '•');
    final nome = cartao.nome.text.trim().isEmpty
        ? 'NOME NO CARTÃO'
        : cartao.nome.text.trim().toUpperCase();
    final validade =
        cartao.validade.text.isEmpty ? 'MM/AA' : cartao.validade.text;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [_roxo, Color(0xFF9C27B0)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: _roxo.withAlpha(60),
            blurRadius: 16,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 40,
                height: 28,
                decoration: BoxDecoration(
                  color: Colors.white.withAlpha(60),
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
              Text(
                credito ? 'CRÉDITO' : 'DÉBITO',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            numero,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 19,
              fontWeight: FontWeight.w600,
              letterSpacing: 2,
            ),
          ),
          const SizedBox(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  nome,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ),
              Text(
                validade,
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _FormatadorNumeroCartao extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digitos = newValue.text.replaceAll(RegExp(r'\D'), '');
    final limitado = digitos.length > 16 ? digitos.substring(0, 16) : digitos;
    final buffer = StringBuffer();
    for (var i = 0; i < limitado.length; i++) {
      if (i != 0 && i % 4 == 0) buffer.write(' ');
      buffer.write(limitado[i]);
    }
    final texto = buffer.toString();
    return TextEditingValue(
      text: texto,
      selection: TextSelection.collapsed(offset: texto.length),
    );
  }
}

class _FormatadorValidadeCartao extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(
      TextEditingValue oldValue, TextEditingValue newValue) {
    final digitos = newValue.text.replaceAll(RegExp(r'\D'), '');
    final limitado = digitos.length > 4 ? digitos.substring(0, 4) : digitos;
    final buffer = StringBuffer();
    for (var i = 0; i < limitado.length; i++) {
      if (i == 2) buffer.write('/');
      buffer.write(limitado[i]);
    }
    final texto = buffer.toString();
    return TextEditingValue(
      text: texto,
      selection: TextSelection.collapsed(offset: texto.length),
    );
  }
}
