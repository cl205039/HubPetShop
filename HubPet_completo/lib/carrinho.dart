import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:http/http.dart' as http;

import 'app_data.dart';
import 'api_client.dart';
import 'services/pedido_service.dart';
import 'endereco.dart';
import 'telainicio.dart';
import 'formas_pagamento.dart';

class CarrinhoPage extends StatefulWidget {
  const CarrinhoPage({super.key});

  @override
  State<CarrinhoPage> createState() => _CarrinhoPageState();
}

class _CarrinhoPageState extends State<CarrinhoPage> {
  static const Color _roxo = Color(0xFF6A0DAD);

  int _passo = 0;
  bool _enviando = false;

  final _cepCtrl = TextEditingController();
  final _ruaCtrl = TextEditingController();
  final _numeroCtrl = TextEditingController();
  final _bairroCtrl = TextEditingController();
  final _cidadeCtrl = TextEditingController();
  final _complementoCtrl = TextEditingController();

  final _numeroFocus = FocusNode();

  bool _buscandoCep = false;

  FormaPagamento _formaPagamento = FormaPagamento.local;
  final _cartao = ControladoresCartao();

  @override
  void dispose() {
    _cepCtrl.dispose();
    _ruaCtrl.dispose();
    _numeroCtrl.dispose();
    _bairroCtrl.dispose();
    _cidadeCtrl.dispose();
    _complementoCtrl.dispose();
    _numeroFocus.dispose();
    _cartao.dispose();
    super.dispose();
  }

  Future<void> _buscarCep() async {
    final cep = _cepCtrl.text.replaceAll(RegExp(r'\D'), '');
    if (cep.length != 8) {
      _aviso('Informe um CEP com 8 dígitos');
      return;
    }

    setState(() => _buscandoCep = true);
    try {
      final resposta = await http
          .get(Uri.parse('https://viacep.com.br/ws/$cep/json/'))
          .timeout(const Duration(seconds: 8));

      final dados = jsonDecode(utf8.decode(resposta.bodyBytes))
          as Map<String, dynamic>;

      if (resposta.statusCode != 200 || dados['erro'] == true) {
        if (!mounted) return;
        _aviso('CEP não encontrado');
        return;
      }

      setState(() {
        _ruaCtrl.text = dados['logradouro'] as String? ?? '';
        _bairroCtrl.text = dados['bairro'] as String? ?? '';
        _cidadeCtrl.text = dados['localidade'] as String? ?? '';
        if (_complementoCtrl.text.trim().isEmpty) {
          _complementoCtrl.text = dados['complemento'] as String? ?? '';
        }
      });

      if (!mounted) return;
      _numeroFocus.requestFocus();
    } on TimeoutException {
      if (!mounted) return;
      _aviso('Tempo esgotado ao buscar o CEP. Tente novamente.');
    } on SocketException {
      if (!mounted) return;
      _aviso('Sem conexão para buscar o CEP.');
    } catch (_) {
      if (!mounted) return;
      _aviso('Não foi possível buscar o CEP.');
    } finally {
      if (mounted) setState(() => _buscandoCep = false);
    }
  }

  String _formatarPreco(double v) =>
      'R\$ ${v.toStringAsFixed(2).replaceAll('.', ',')}';

  bool get _enderecoValido =>
      _cepCtrl.text.replaceAll(RegExp(r'\D'), '').length == 8 &&
      _ruaCtrl.text.trim().isNotEmpty &&
      _numeroCtrl.text.trim().isNotEmpty &&
      _bairroCtrl.text.trim().isNotEmpty &&
      _cidadeCtrl.text.trim().isNotEmpty;

  void _avancar() {
    if (_passo == 0) {
      if (AppData.carrinho.isEmpty) {
        _aviso('Seu carrinho está vazio');
        return;
      }
      setState(() => _passo = 1);
    } else if (_passo == 1) {
      if (!_enderecoValido) {
        _aviso('Preencha o endereço de entrega (CEP com 8 dígitos)');
        return;
      }
      setState(() => _passo = 2);
    } else {
      if (!pagamentoValido(_formaPagamento, _cartao)) {
        _aviso('Preencha os dados do cartão para continuar');
        return;
      }
      _finalizar();
    }
  }

  void _aviso(String texto) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(texto),
        backgroundColor: Colors.red.shade400,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _finalizar() async {
    if (AppData.usuarioLogado == null) {
      final logou = await Telainicio.solicitarLogin(
        context,
        acao: 'finalizar a compra',
      );
      if (!mounted || !logou) return;
    }

    final usuarioId = AppData.usuarioLogado?.id;
    if (usuarioId == null) {
      _aviso('Nenhum usuário logado.');
      return;
    }

    final lojas = AppData.carrinho.map((i) => i.petshop).toSet();
    final loja = lojas.length == 1 ? lojas.first : 'Vários petshops';
    final petshopIds =
        AppData.carrinho.map((i) => i.petshopId).whereType<int>().toSet();
    final petshopId = petshopIds.length == 1 ? petshopIds.first : null;
    if (petshopId == null && lojas.length == 1) {
      debugPrint('[carrinho] pedido de "$loja" sem petshopId — '
          'itens no carrinho: '
          '${AppData.carrinho.map((i) => '${i.nome}:${i.petshopId}').toList()}');
    }
    final itens = AppData.carrinho
        .map((i) => ItemPedido(
              nome: i.nome,
              quantidade: i.quantidade,
              precoUnitario: i.preco,
            ))
        .toList();
    final agora = DateTime.now();
    final hora =
        '${agora.hour.toString().padLeft(2, '0')}:${agora.minute.toString().padLeft(2, '0')}';

    setState(() => _enviando = true);
    try {
      await PedidoService.criar(
        usuarioId,
        Pedido(
          loja: loja,
          petshopId: petshopId,
          itens: itens,
          total: AppData.totalCarrinho,
          data: 'Hoje, $hora',
          etapa: 0,
        ),
      );
      AppData.limparCarrinho();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _enviando = false);
      _aviso(e.mensagem);
      return;
    }

    if (!mounted) return;
    setState(() => _enviando = false);

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.check_circle, color: Colors.green, size: 60),
            const SizedBox(height: 12),
            const Text(
              'Pedido confirmado! 🐾',
              textAlign: TextAlign.center,
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              '${mensagemConfirmacaoPagamento(_formaPagamento, localTexto: 'Você paga na entrega.')}\n'
              'Acompanhe em "Meus Pedidos".',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.grey),
            ),
          ],
        ),
        actions: [
          Center(
            child: TextButton(
              onPressed: () {
                Navigator.pop(context);
                Navigator.popUntil(context, (rota) => rota.isFirst);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const PedidosPage()),
                );
              },
              child: const Text('VER MEUS PEDIDOS',
                  style: TextStyle(color: _roxo, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    const titulos = ['Seu carrinho', 'Endereço de entrega', 'Pagamento'];

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [_roxo, Color(0xFF9C27B0)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              Row(
                children: [
                  IconButton(
                    onPressed: () => _passo == 0
                        ? Navigator.pop(context)
                        : setState(() => _passo--),
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    tooltip: 'Voltar',
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'Carrinho',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 40),
                ],
              ),

              const SizedBox(height: 10),
              _indicadorPassos(),
              const SizedBox(height: 16),

              Expanded(
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Passo ${_passo + 1} de 3',
                          style: const TextStyle(
                              color: Colors.grey, fontSize: 12)),
                      const SizedBox(height: 4),
                      Text(titulos[_passo],
                          style: const TextStyle(
                              fontWeight: FontWeight.bold, fontSize: 18)),
                      const SizedBox(height: 16),
                      Expanded(
                        child: SingleChildScrollView(child: _conteudo()),
                      ),
                      _rodape(),
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

  Widget _indicadorPassos() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Row(
        children: List.generate(3, (i) {
          final ativo = i <= _passo;
          return Expanded(
            child: Row(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: ativo ? Colors.orange : Colors.white24,
                    shape: BoxShape.circle,
                  ),
                  child: i < _passo
                      ? const Icon(Icons.check, color: Colors.white, size: 16)
                      : Text('${i + 1}',
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12)),
                ),
                if (i < 2)
                  Expanded(
                    child: Container(
                      height: 3,
                      color: i < _passo ? Colors.orange : Colors.white24,
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _conteudo() {
    switch (_passo) {
      case 0:
        return _passoItens();
      case 1:
        return _passoEndereco();
      default:
        return _passoPagamento();
    }
  }

  Widget _passoItens() {
    if (AppData.carrinho.isEmpty) {
      return const Padding(
        padding: EdgeInsets.only(top: 40),
        child: Center(
          child: Text('Seu carrinho está vazio 🛒',
              style: TextStyle(color: Colors.grey, fontSize: 15)),
        ),
      );
    }
    return Column(
      children: [
        ...AppData.carrinho.map(_itemCarrinho),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          style: OutlinedButton.styleFrom(
            foregroundColor: _roxo,
            side: const BorderSide(color: _roxo),
            minimumSize: const Size(double.infinity, 48),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          onPressed: () => Navigator.pop(context),
          icon: const Icon(Icons.add),
          label: const Text('Adicionar mais itens'),
        ),
      ],
    );
  }

  Widget _itemCarrinho(ItemCarrinho item) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: _roxo.withAlpha(25),
            child: const Icon(Icons.shopping_bag, color: _roxo),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(item.nome,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(item.petshop,
                    style: const TextStyle(color: Colors.grey, fontSize: 12)),
                const SizedBox(height: 4),
                Text(_formatarPreco(item.subtotal),
                    style: const TextStyle(
                        color: Colors.orange, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          Column(
            children: [
              Row(
                children: [
                  _btnQtd(Icons.remove, () {
                    setState(() {
                      if (item.quantidade > 1) {
                        item.quantidade--;
                      } else {
                        AppData.removerDoCarrinho(item);
                      }
                    });
                  }, label: 'Diminuir quantidade'),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Text('${item.quantidade}',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                  _btnQtd(Icons.add, () {
                    setState(() => item.quantidade++);
                  }, label: 'Aumentar quantidade'),
                ],
              ),
              TextButton.icon(
                style: TextButton.styleFrom(
                  foregroundColor: Colors.red,
                  padding: EdgeInsets.zero,
                  minimumSize: const Size(0, 28),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                onPressed: () =>
                    setState(() => AppData.removerDoCarrinho(item)),
                icon: const Icon(Icons.delete_outline, size: 16),
                label: const Text('Remover', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _btnQtd(IconData icon, VoidCallback onTap, {required String label}) {
    return Container(
      decoration: BoxDecoration(
        color: _roxo.withAlpha(20),
        borderRadius: BorderRadius.circular(8),
      ),
      child: IconButton(
        padding: const EdgeInsets.all(4),
        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
        icon: Icon(icon, size: 16, color: _roxo),
        tooltip: label,
        onPressed: onTap,
      ),
    );
  }

  Widget _passoEndereco() {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: TextField(
            controller: _cepCtrl,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(8),
            ],
            onChanged: (v) {
              if (v.length == 8) _buscarCep();
            },
            decoration: InputDecoration(
              labelText: 'CEP *',
              hintText: 'Só números — preenche o endereço',
              prefixIcon: const Icon(Icons.local_post_office),
              filled: true,
              fillColor: const Color(0xFFF5F5F5),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none,
              ),
              suffixIcon: _buscandoCep
                  ? const Padding(
                      padding: EdgeInsets.all(12),
                      child: SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    )
                  : IconButton(
                      icon: const Icon(Icons.search),
                      tooltip: 'Buscar endereço pelo CEP',
                      onPressed: _buscarCep,
                    ),
            ),
          ),
        ),
        _campo('Rua / Avenida', _ruaCtrl, Icons.signpost),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: _campo('Número', _numeroCtrl, Icons.tag,
                  teclado: TextInputType.number, focusNode: _numeroFocus),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 3,
              child: _campo('Complemento', _complementoCtrl, Icons.home,
                  obrigatorio: false),
            ),
          ],
        ),
        _campo('Bairro', _bairroCtrl, Icons.location_city),
        _campo('Cidade', _cidadeCtrl, Icons.map),
      ],
    );
  }

  Widget _campo(String label, TextEditingController ctrl, IconData icone,
      {bool obrigatorio = true, TextInputType? teclado, FocusNode? focusNode}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: ctrl,
        focusNode: focusNode,
        keyboardType: teclado,
        onChanged: (_) => setState(() {}),
        decoration: InputDecoration(
          labelText: obrigatorio ? '$label *' : label,
          prefixIcon: Icon(icone),
          filled: true,
          fillColor: const Color(0xFFF5F5F5),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide.none,
          ),
        ),
      ),
    );
  }

  Widget _passoPagamento() {
    final endereco = '${_ruaCtrl.text}, ${_numeroCtrl.text}'
        '${_complementoCtrl.text.trim().isEmpty ? '' : ' - ${_complementoCtrl.text}'}'
        '\n${_bairroCtrl.text}, ${_cidadeCtrl.text}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _roxo.withAlpha(15),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Entregar em',
                  style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(endereco,
                  style: const TextStyle(color: Colors.grey, fontSize: 13)),
              const Divider(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${AppData.qtdCarrinho} itens',
                      style: const TextStyle(color: Colors.grey)),
                  Text(_formatarPreco(AppData.totalCarrinho),
                      style: const TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                          fontSize: 16)),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),
        const Text('Forma de pagamento',
            style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 12),

        SeletorFormaPagamento(
          valor: _formaPagamento,
          onChanged: (f) => setState(() => _formaPagamento = f),
          tituloLocal: 'Na entrega',
          subtituloLocal: 'Dinheiro ou maquininha na hora',
        ),

        const SizedBox(height: 20),
        PainelFormaPagamento(
          forma: _formaPagamento,
          cartao: _cartao,
          onEditado: () => setState(() {}),
          tituloLocal: 'Pague na entrega',
          subtituloLocal: 'Dinheiro ou maquininha na hora',
        ),
      ],
    );
  }

  Widget _rodape() {
    final ultimo = _passo == 2;
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Column(
        children: [
          if (_passo == 0)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Total',
                      style:
                          TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  Text(_formatarPreco(AppData.totalCarrinho),
                      style: const TextStyle(
                          color: Colors.orange,
                          fontWeight: FontWeight.bold,
                          fontSize: 18)),
                ],
              ),
            ),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              onPressed: _enviando ? null : _avancar,
              child: _enviando
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      ultimo ? 'CONFIRMAR PEDIDO' : 'CONTINUAR',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1,
                        color: Colors.white,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
