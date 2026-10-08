import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'services/usuario_service.dart';
import 'inicio.dart';

class CadastroPage extends StatefulWidget {
  // Quando true, o cadastro foi iniciado no fechamento da compra:
  // ao concluir, volta (`pop(true)`) para retomar a finalização em
  // vez de ir para a home.
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

  // ── Checkboxes ──
  bool _aceitaTermos = false;
  bool _aceitaNewsletter = false;

  // ── Radio: tipo de dono ──
  String _tipoDono = 'pessoafisica';

  // ── Switch: notificações ──
  bool _notificacoes = true;
  final bool _localizacao = false;

  bool _verSenha = false;
  bool _verSenhaConf = false;
  bool _enviando = false;

  final _emailRegex = RegExp(r'^[\w\.\+\-]+@[\w\-]+\.[a-zA-Z]{2,}$');

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
      aceitaNewsletter: _aceitaNewsletter,
      aceitaTermos: _aceitaTermos,
      // FIX: usa o valor selecionado no rádio em vez de fixo.
      tipoUsuario: _tipoDono,
      notificacoes: _notificacoes,
      localizacao: _localizacao,
    );

    setState(() => _enviando = true);
    try {
      final criado = await UsuarioService.cadastrar(novoUsuario);
      AppData.usuarioLogado = criado;

      if (!mounted) return;
      _aviso('Cadastro realizado com sucesso! 🐾', cor: Colors.green);

      // Veio do fechamento da compra: volta sinalizando sucesso para
      // retomar a finalização de onde parou.
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
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextFormField(
        controller: ctrl,
        obscureText: obscure && !(ver ?? false),
        keyboardType: tipo,
        decoration: InputDecoration(
          hintText: hint,
          filled: true,
          fillColor: const Color(0xFFF5F5F5),
          suffixIcon: obscure
              ? IconButton(
                  icon: Icon(
                    (ver ?? false) ? Icons.visibility : Icons.visibility_off,
                    color: Colors.grey,
                  ),
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
              // AppBar manual
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
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
                        // ── Dados pessoais ──
                        _titulo('📋 Dados Pessoais'),

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
                            if (v == null || v.isEmpty) return 'Informe o CPF';
                            if (v.replaceAll(RegExp(r'\D'), '').length != 11) {
                              return 'CPF inválido (11 dígitos)';
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

                        // ── Radio: tipo de dono ──
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

                        // ── Switches ──
                        _titulo('⚙️ Preferência'),

                        SwitchListTile(
                          title: const Text('Receber notificações',
                              style: TextStyle(fontSize: 14)),
                          subtitle: const Text(
                              'Alertas de agendamentos e promoções',
                              style: TextStyle(fontSize: 12)),
                          value: _notificacoes,
                          activeColor: const Color(0xFF6A0DAD),
                          contentPadding: EdgeInsets.zero,
                          onChanged: (v) => setState(() => _notificacoes = v),
                        ),

                        const Divider(),

                        // ── Checkboxes ──
                        CheckboxListTile(
                          title: const Text(
                            'Quero receber novidades e promoções por e-mail',
                            style: TextStyle(fontSize: 13),
                          ),
                          value: _aceitaNewsletter,
                          activeColor: Colors.orange,
                          controlAffinity: ListTileControlAffinity.leading,
                          contentPadding: EdgeInsets.zero,
                          onChanged: (v) =>
                              setState(() => _aceitaNewsletter = v!),
                        ),

                        CheckboxListTile(
                          title: RichText(
                            text: const TextSpan(
                              style:
                                  TextStyle(fontSize: 13, color: Colors.black),
                              children: [
                                TextSpan(text: 'Li e concordo com os '),
                                TextSpan(
                                  text:
                                      'Termos de Uso e Política de Privacidade',
                                  style: TextStyle(
                                    color: Color(0xFF6A0DAD),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
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
