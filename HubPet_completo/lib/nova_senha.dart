import 'package:flutter/material.dart';
import 'api_client.dart';
import 'services/usuario_service.dart';
import 'telainicio.dart';

class NovaSenhaPage extends StatefulWidget {
  const NovaSenhaPage({super.key});

  @override
  State<NovaSenhaPage> createState() => _NovaSenhaPageState();
}

class _NovaSenhaPageState extends State<NovaSenhaPage> {
  final FocusNode senhaFocus = FocusNode();
  final FocusNode confirmarFocus = FocusNode();

  final emailCtrl = TextEditingController();
  final senhaCtrl = TextEditingController();
  final confirmarCtrl = TextEditingController();

  double scaleSenha = 1.0;
  double scaleConfirmar = 1.0;

  bool verSenha = false;
  bool verConfirmar = false;
  bool _enviando = false;

  @override
  void initState() {
    super.initState();

    senhaFocus.addListener(() {
      setState(() {
        scaleSenha = senhaFocus.hasFocus ? 1.05 : 1.0;
      });
    });

    confirmarFocus.addListener(() {
      setState(() {
        scaleConfirmar =
            confirmarFocus.hasFocus ? 1.05 : 1.0;
      });
    });
  }

  @override
  void dispose() {
    senhaFocus.dispose();
    confirmarFocus.dispose();
    emailCtrl.dispose();
    senhaCtrl.dispose();
    confirmarCtrl.dispose();
    super.dispose();
  }

  void _aviso(String texto, {bool sucesso = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(texto),
        backgroundColor: sucesso ? Colors.green : Colors.red.shade400,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  // Pede pra API redefinir a senha do e-mail informado.
  Future<void> _confirmar() async {
    final email = emailCtrl.text.trim();
    final senha = senhaCtrl.text;
    final confirmar = confirmarCtrl.text;

    if (email.isEmpty || senha.isEmpty || confirmar.isEmpty) {
      _aviso('Preencha todos os campos');
      return;
    }
    if (senha.length < 6) {
      _aviso('A senha deve ter no mínimo 6 caracteres');
      return;
    }
    if (senha != confirmar) {
      _aviso('As senhas não coincidem');
      return;
    }

    setState(() => _enviando = true);
    try {
      await UsuarioService.redefinirSenha(email, senha);
      if (!mounted) return;
      _aviso('Senha alterada com sucesso! 🐾', sucesso: true);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const Telainicio()),
      );
    } on ApiException catch (e) {
      if (!mounted) return;
      _aviso(e.statusCode == 404 ? 'E-mail não cadastrado' : e.mensagem);
    } finally {
      if (mounted) setState(() => _enviando = false);
    }
  }

  Widget campoSenha({
    required String hint,
    required TextEditingController controller,
    required FocusNode focus,
    required double scale,
    required bool obscure,
    required VoidCallback toggle,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: AnimatedScale(
        scale: scale,
        duration: const Duration(milliseconds: 200),
        child: TextField(
          controller: controller,
          focusNode: focus,
          obscureText: obscure,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: const Color(0xFFF5F5F5),
            suffixIcon: IconButton(
              icon: Icon(
                obscure
                    ? Icons.visibility_off
                    : Icons.visibility,
              ),
              onPressed: toggle,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(15),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [
              Color(0xFF6A0DAD),
              Color(0xFF9C27B0),
            ],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius:
                        BorderRadius.circular(25),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text(
                        "Nova senha",
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        "Informe seu e-mail cadastrado para redefinir",
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const SizedBox(height: 20),

                      // Campo de e-mail (identifica o usuário na API)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 15),
                        child: TextField(
                          controller: emailCtrl,
                          keyboardType: TextInputType.emailAddress,
                          decoration: InputDecoration(
                            hintText: "E-mail cadastrado",
                            prefixIcon: const Icon(Icons.email_outlined),
                            filled: true,
                            fillColor: const Color(0xFFF5F5F5),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(15),
                              borderSide: BorderSide.none,
                            ),
                          ),
                        ),
                      ),

                      campoSenha(
                        hint: "Nova senha",
                        controller: senhaCtrl,
                        focus: senhaFocus,
                        scale: scaleSenha,
                        obscure: !verSenha,
                        toggle: () {
                          setState(() {
                            verSenha = !verSenha;
                          });
                        },
                      ),
                      campoSenha(
                        hint: "Repetir nova senha",
                        controller: confirmarCtrl,
                        focus: confirmarFocus,
                        scale: scaleConfirmar,
                        obscure: !verConfirmar,
                        toggle: () {
                          setState(() {
                            verConfirmar = !verConfirmar;
                          });
                        },
                      ),
                      const SizedBox(height: 15),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          style:
                              ElevatedButton.styleFrom(
                            backgroundColor:
                                Colors.orange,
                            padding:
                                const EdgeInsets.symmetric(
                                    vertical: 16),
                            shape:
                                RoundedRectangleBorder(
                              borderRadius:
                                  BorderRadius.circular(
                                      30),
                            ),
                          ),
                          onPressed: _enviando ? null : _confirmar,
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
                                  "CONFIRMAR",
                                  style: TextStyle(
                                    fontWeight:
                                        FontWeight.bold,
                                    letterSpacing: 1,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
