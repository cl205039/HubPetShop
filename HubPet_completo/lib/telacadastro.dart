import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'services/usuario_service.dart';
import 'inicio.dart';

class CadastroPage extends StatefulWidget {
  final bool voltarAposLogin;

  const CadastroPage({super.key, this.voltarAposLogin = false});

  @override
  State<CadastroPage> createState() => _CadastroPageState();
}

class _CadastroPageState extends State<CadastroPage> {
  final _formKey = GlobalKey<FormState>();

  final _nomeCtrl = TextEditingController();
  final _cpfCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _emailConfCtrl = TextEditingController();
  final _telCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  final _senhaConfCtrl = TextEditingController();

  bool _aceitaTermos = false;

  bool _receberNovidades = true;

  String _tipoDono = 'pessoafisica';

  final bool _localizacao = false;

  late final _termosTapRecognizer = TapGestureRecognizer()
    ..onTap = _mostrarTermos;

  bool _verSenha = false;
  bool _verSenhaConf = false;
  bool _enviando = false;

  final _emailRegex = RegExp(r'^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$');

  bool _cpfValido(String cpf) {
    final digitos = cpf.replaceAll(RegExp(r'\D'), '');
    if (digitos.length != 11) return false;
    if (RegExp(r'^(\d)\1*$').hasMatch(digitos)) return false;

    int calcularDigito(String base) {
      int soma = 0;
      int peso = base.length + 1;
      for (var i = 0; i < base.length; i++) {
        soma += int.parse(base[i]) * peso;
        peso--;
      }
      final resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    }

    final d1 = calcularDigito(digitos.substring(0, 9));
    final d2 = calcularDigito(digitos.substring(0, 9) + d1.toString());
    return digitos.substring(9) == '$d1$d2';
  }

  @override
  void dispose() {
    for (var c in [
      _nomeCtrl,
      _cpfCtrl,
      _emailCtrl,
      _emailConfCtrl,
      _telCtrl,
      _senhaCtrl,
      _senhaConfCtrl,
    ]) {
      c.dispose();
    }
    _termosTapRecognizer.dispose();
    super.dispose();
  }

  void _aviso(String texto, {Color? cor}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(texto),
        backgroundColor: cor ?? Colors.red.shade400,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Future<void> _cadastrar() async {
    if (!_formKey.currentState!.validate()) return;

    if (!_aceitaTermos) {
      _aviso('Você precisa aceitar os termos de uso!');
      return;
    }

    final novoUsuario = Usuario(
      nome: _nomeCtrl.text.trim(),
      cpf: _cpfCtrl.text.trim(),
      email: _emailCtrl.text.trim(),
      telefone: _telCtrl.text.trim(),
      senha: _senhaCtrl.text,
      aceitaNewsletter: _receberNovidades,
      aceitaTermos: _aceitaTermos,
      tipoUsuario: _tipoDono,
      notificacoes: _receberNovidades,
      localizacao: _localizacao,
    );

    setState(() => _enviando = true);
    try {
      final criado = await UsuarioService.cadastrar(novoUsuario);
      AppData.usuarioLogado = criado;

      if (!mounted) return;
      _aviso('Cadastro realizado com sucesso! 🐾', cor: Colors.green);

      if (widget.voltarAposLogin) {
        Navigator.pop(context, true);
        return;
      }

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const InicioPage()),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      _aviso(
        e.statusCode == 409 ? 'E-mail já cadastrado! Faça login.' : e.mensagem,
        cor: e.statusCode == 409 ? Colors.orange : null,
      );
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  void _mostrarTermos() {
    showDialog(
      context: context,
      builder: (dctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 480, maxHeight: 560),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                child: Text(
                  'Termos de Uso e Política de Privacidade',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Color(0xFF6A0DAD),
                  ),
                ),
              ),
              const Divider(height: 1),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Text(
                    _textoTermos,
                    style: const TextStyle(fontSize: 13, height: 1.4),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF6A0DAD),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () => Navigator.pop(dctx),
                    child: const Text('FECHAR',
                        style: TextStyle(color: Colors.white)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static const _textoTermos = '''
1. Aceitação dos Termos
Ao se cadastrar e utilizar o HubPetShop, você concorda com estes Termos de Uso e com nossa Política de Privacidade. Caso não concorde, não utilize a plataforma.

2. Sobre o Serviço
O HubPetShop é uma plataforma de intermediação entre donos de pets e petshops/veterinários parceiros, permitindo o agendamento de serviços (banho, tosa, consultas) e a compra de produtos. O HubPetShop não presta diretamente os serviços anunciados, atuando apenas como facilitador entre as partes.

3. Cadastro e Responsabilidade do Usuário
Você é responsável por fornecer informações verdadeiras, completas e atualizadas (nome, CPF, e-mail, telefone e endereço) e por manter a confidencialidade de sua senha. O CPF é utilizado para identificação do usuário e emissão de comprovantes de serviço.

4. Agendamentos, Pagamentos e Cancelamentos
Agendamentos estão sujeitos à disponibilidade do petshop/veterinário escolhido. Pagamentos podem ser feitos no momento da compra ou na consulta, conforme indicado em cada serviço. Cancelamentos devem respeitar o prazo informado por cada estabelecimento parceiro.

5. Privacidade e Proteção de Dados (LGPD)
Coletamos apenas os dados necessários para o funcionamento da plataforma (identificação, contato, endereço e histórico de pedidos/agendamentos). Esses dados não são vendidos a terceiros e são compartilhados apenas com os petshops/veterinários envolvidos no atendimento solicitado. Você pode solicitar a atualização ou exclusão dos seus dados a qualquer momento pelo app.

6. Comunicações
Caso aceite receber novidades, você poderá receber e-mails e alertas sobre promoções, lançamentos e seus agendamentos. Esse recebimento pode ser desativado a qualquer momento nas configurações da sua conta.

7. Alterações destes Termos
Estes termos podem ser atualizados periodicamente. O uso contínuo da plataforma após alterações representa a aceitação dos novos termos.

8. Contato
Dúvidas sobre estes termos podem ser enviadas pelos canais de suporte indicados no aplicativo.''';

  Widget _titulo(String t) => Padding(
        padding: const EdgeInsets.only(top: 10, bottom: 6),
        child: Text(
          t,
          style: const TextStyle(
              fontWeight: FontWeight.bold, color: Color(0xFF6A0DAD)),
        ),
      );

  Widget _campo({
    required String hint,
    required TextEditingController ctrl,
    bool obscure = false,
    bool? ver,
    VoidCallback? toggleVer,
    TextInputType tipo = TextInputType.text,
    String? Function(String?)? validator,
    bool obrigatorio = true,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        obscureText: obscure && !(ver ?? false),
        keyboardType: tipo,
        decoration: InputDecoration(
          labelText: obrigatorio ? '$hint *' : hint,
          filled: true,
          fillColor: const Color(0xFFF5F5F5),
          suffixIcon: obscure
              ? IconButton(
                  icon: Icon(
                    (ver ?? false) ? Icons.visibility : Icons.visibility_off,
                    color: Colors.grey,
                  ),
                  tooltip: (ver ?? false) ? 'Ocultar senha' : 'Mostrar senha',
                  onPressed: toggleVer,
                )
              : null,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: BorderSide.none,
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: const BorderSide(color: Colors.red, width: 1),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(15),
            borderSide: const BorderSide(color: Colors.red, width: 1.5),
          ),
        ),
        validator: validator,
      ),
    );
  }

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
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                      tooltip: 'Voltar',
                    ),
                    const Text(
                      'Criar conta',
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
                  margin: const EdgeInsets.only(top: 5),
                  padding: const EdgeInsets.all(20),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: Form(
                    key: _formKey,
                    child: ListView(
                      children: [
                        _titulo('📋 Dados Pessoais'),
                        const Padding(
                          padding: EdgeInsets.only(bottom: 8),
                          child: Text(
                            '* Campos obrigatórios',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey,
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),

                        _campo(
                          hint: 'Nome completo',
                          ctrl: _nomeCtrl,
                          validator: (v) => v == null || v.trim().isEmpty
                              ? 'Informe seu nome'
                              : null,
                        ),

                        _campo(
                          hint: 'CPF (000.000.000-00)',
                          ctrl: _cpfCtrl,
                          tipo: TextInputType.number,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Informe o CPF';
                            }
                            if (!_cpfValido(v)) {
                              return 'CPF inválido';
                            }
                            return null;
                          },
                        ),

                        _campo(
                          hint: 'E-mail',
                          ctrl: _emailCtrl,
                          tipo: TextInputType.emailAddress,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Informe o e-mail';
                            }
                            if (!_emailRegex.hasMatch(v.trim())) {
                              return 'E-mail inválido';
                            }
                            return null;
                          },
                        ),

                        _campo(
                          hint: 'Confirmar e-mail',
                          ctrl: _emailConfCtrl,
                          tipo: TextInputType.emailAddress,
                          validator: (v) {
                            if (v == null || v.trim().isEmpty) {
                              return 'Confirme o e-mail';
                            }
                            if (v.trim() != _emailCtrl.text.trim()) {
                              return 'Os e-mails não coincidem';
                            }
                            return null;
                          },
                        ),

                        _campo(
                          hint: 'Telefone / WhatsApp',
                          ctrl: _telCtrl,
                          tipo: TextInputType.phone,
                          validator: (v) => v == null || v.isEmpty
                              ? 'Informe o telefone'
                              : null,
                        ),

                        _campo(
                          hint: 'Senha (mín. 6 caracteres)',
                          ctrl: _senhaCtrl,
                          obscure: true,
                          ver: _verSenha,
                          toggleVer: () =>
                              setState(() => _verSenha = !_verSenha),
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return 'Informe a senha';
                            }
                            if (v.length < 6) return 'Mínimo 6 caracteres';
                            return null;
                          },
                        ),

                        _campo(
                          hint: 'Confirmar senha',
                          ctrl: _senhaConfCtrl,
                          obscure: true,
                          ver: _verSenhaConf,
                          toggleVer: () =>
                              setState(() => _verSenhaConf = !_verSenhaConf),
                          validator: (v) {
                            if (v == null || v.isEmpty) {
                              return 'Confirme a senha';
                            }
                            if (v != _senhaCtrl.text) {
                              return 'As senhas não coincidem';
                            }
                            return null;
                          },
                        ),

                        _titulo('🐶 Tipo de perfil'),
                        Row(
                          children: [
                            Expanded(
                              child: RadioListTile<String>(
                                title: const Text('Pessoa Física',
                                    style: TextStyle(fontSize: 13)),
                                value: 'pessoafisica',
                                groupValue: _tipoDono,
                                activeColor: const Color(0xFF6A0DAD),
                                contentPadding: EdgeInsets.zero,
                                onChanged: (v) =>
                                    setState(() => _tipoDono = v!),
                              ),
                            ),
                            Expanded(
                              child: RadioListTile<String>(
                                title: const Text('Pessoa Jurídica',
                                    style: TextStyle(fontSize: 13)),
                                value: 'pessoajuridica',
                                groupValue: _tipoDono,
                                activeColor: const Color(0xFF6A0DAD),
                                contentPadding: EdgeInsets.zero,
                                onChanged: (v) =>
                                    setState(() => _tipoDono = v!),
                              ),
                            ),
                          ],
                        ),

                        _titulo('⚙️ Preferência'),

                        CheckboxListTile(
                          title: const Text(
                            'Quero receber novidades, promoções e alertas de agendamento por e-mail',
                            style: TextStyle(fontSize: 13),
                          ),
                          value: _receberNovidades,
                          activeColor: Colors.orange,
                          controlAffinity: ListTileControlAffinity.leading,
                          contentPadding: EdgeInsets.zero,
                          onChanged: (v) =>
                              setState(() => _receberNovidades = v!),
                        ),

                        const Divider(),

                        CheckboxListTile(
                          title: RichText(
                            text: TextSpan(
                              style: const TextStyle(
                                  fontSize: 13, color: Colors.black),
                              children: [
                                const TextSpan(text: 'Li e concordo com os '),
                                TextSpan(
                                  text:
                                      'Termos de Uso e Política de Privacidade',
                                  style: const TextStyle(
                                    color: Color(0xFF6A0DAD),
                                    fontWeight: FontWeight.bold,
                                    decoration: TextDecoration.underline,
                                  ),
                                  recognizer: _termosTapRecognizer,
                                ),
                                const TextSpan(text: ' *'),
                              ],
                            ),
                          ),
                          value: _aceitaTermos,
                          activeColor: const Color(0xFF6A0DAD),
                          controlAffinity: ListTileControlAffinity.leading,
                          contentPadding: EdgeInsets.zero,
                          onChanged: (v) => setState(() => _aceitaTermos = v!),
                        ),

                        const SizedBox(height: 20),

                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.orange,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                            ),
                            onPressed: _enviando ? null : _cadastrar,
                            child: _enviando
                                ? const SizedBox(
                                    height: 20,
                                    width: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : const Text(
                                    'FINALIZAR CADASTRO',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      letterSpacing: 1,
                                      color: Colors.white,
                                    ),
                                  ),
                          ),
                        ),

                        const SizedBox(height: 10),
                      ],
                    ),
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
