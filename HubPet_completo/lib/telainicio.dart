import 'package:flutter/material.dart';
import 'app_data.dart';
import 'api_client.dart';
import 'services/usuario_service.dart';
import 'inicio.dart';
import 'home_veterinario.dart';
import 'nova_senha.dart';
import 'escolha.dart';

class Telainicio extends StatefulWidget {
  // Quando `voltarAposLogin` é true, a tela foi aberta no meio de outro
  // fluxo (ex.: fechamento da compra). Nesse caso, ao logar com sucesso
  // ela apenas volta (`Navigator.pop(context, true)`) para quem a chamou,
  // em vez de trocar a tela raiz do app.
  final bool voltarAposLogin;
  final String? mensagem;

  const Telainicio({
    super.key,
    this.voltarAposLogin = false,
    this.mensagem,
  });

  // Portão de login usado antes de ações que exigem dono (fechar a
  // compra, confirmar agendamento). Mostra um aviso "você precisa
  // fazer login para <ação>" com um botão que leva à tela de login e,
  // se o login der certo, retorna `true` para o fluxo continuar.
  // `acao` entra na frase: 'finalizar a compra', 'finalizar o agendamento'…
  static Future<bool> solicitarLogin(
    BuildContext context, {
    required String acao,
  }) async {
    final querLogar = await showDialog<bool>(
      context: context,
      builder: (dctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const CircleAvatar(
              radius: 28,
              backgroundColor: Color(0x226A0DAD),
              child:
                  Icon(Icons.lock_outline, color: Color(0xFF6A0DAD), size: 30),
            ),
            const SizedBox(height: 14),
            Text(
              'Você precisa fazer login para $acao.',
              textAlign: TextAlign.center,
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
            ),
            const SizedBox(height: 6),
            const Text(
              'É rapidinho — depois você volta pra cá pra concluir. 🐾',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey, fontSize: 13),
            ),
          ],
        ),
        actionsAlignment: MainAxisAlignment.spaceBetween,
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dctx, false),
            child:
                const Text('Agora não', style: TextStyle(color: Colors.grey)),
          ),
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.orange,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            onPressed: () => Navigator.pop(dctx, true),
            icon: const Icon(Icons.login, size: 18),
            label: const Text('FAZER LOGIN'),
          ),
        ],
      ),
    );

    if (querLogar != true || !context.mounted) return false;

    final logou = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => Telainicio(
          voltarAposLogin: true,
          mensagem: 'Entre para $acao',
        ),
      ),
    );
    return logou == true && AppData.usuarioLogado != null;
  }

  @override
  State<Telainicio> createState() => _TelainicioState();
}

class _TelainicioState extends State<Telainicio> {
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _verSenha = false;
  bool _carregando = false;

  void _entrar() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _carregando = true);

    Usuario? usuario;
    String? erro;
    try {
      usuario =
          await UsuarioService.login(_emailCtrl.text.trim(), _senhaCtrl.text);
    } on ApiException catch (e) {
      erro = e.mensagem;
    }

    if (!mounted) return;
    setState(() => _carregando = false);

    if (usuario != null) {
      AppData.usuarioLogado = usuario;

      // Aberta a partir de outro fluxo (ex.: fechamento da compra):
      // volta sinalizando sucesso, sem trocar a tela raiz.
      if (widget.voltarAposLogin) {
        Navigator.pop(context, true);
        return;
      }

      final destino = usuario.tipoUsuario == 'veterinario'
          ? const HomeVeterinarioPage()
          : const InicioPage();

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => destino),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(erro ?? 'E-mail ou senha incorretos! 🐾'),
          backgroundColor: Colors.red.shade400,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
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
          child: Stack(
            children: [
              // Quando aberta no meio de outro fluxo, o cliente pode
              // desistir do login e voltar (a compra não é finalizada).
              if (widget.voltarAposLogin)
                Align(
                  alignment: Alignment.topLeft,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    tooltip: 'Voltar',
                    onPressed: () => Navigator.pop(context, false),
                  ),
                ),
              Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(horizontal: 25),
                  child: Container(
                    padding: const EdgeInsets.all(25),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(25),
                      boxShadow: const [
                        BoxShadow(
                            blurRadius: 20,
                            offset: Offset(0, 10),
                            color: Colors.black12),
                      ],
                    ),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Logo
                          Center(
                            child: Image.asset(
                              'assets/images/imagem.jpg.png',
                              height: 150,
                              width: 150,
                            ),
                          ),

                          const SizedBox(height: 15),

                          const Text(
                            'HubPetShop',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF6A0DAD),
                            ),
                          ),

                          Text(
                            widget.mensagem ?? 'Faça login para continuar',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                                fontSize: 14, color: Colors.grey),
                          ),

                          const SizedBox(height: 25),

                          // Campo e-mail
                          TextFormField(
                            controller: _emailCtrl,
                            keyboardType: TextInputType.emailAddress,
                            decoration: InputDecoration(
                              hintText: 'E-mail',
                              prefixIcon: const Icon(Icons.email_outlined),
                              filled: true,
                              fillColor: const Color(0xFFF5F5F5),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(15),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return 'Informe o e-mail';
                              }
                              if (!v.contains('@')) return 'E-mail inválido';
                              return null;
                            },
                          ),

                          const SizedBox(height: 15),

                          // Campo senha
                          TextFormField(
                            controller: _senhaCtrl,
                            obscureText: !_verSenha,
                            decoration: InputDecoration(
                              hintText: 'Senha',
                              prefixIcon: const Icon(Icons.lock_outline),
                              suffixIcon: IconButton(
                                icon: Icon(_verSenha
                                    ? Icons.visibility
                                    : Icons.visibility_off),
                                onPressed: () =>
                                    setState(() => _verSenha = !_verSenha),
                              ),
                              filled: true,
                              fillColor: const Color(0xFFF5F5F5),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(15),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            validator: (v) {
                              if (v == null || v.isEmpty) {
                                return 'Informe a senha';
                              }
                              if (v.length < 6) return 'Mínimo 6 caracteres';
                              return null;
                            },
                          ),

                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: () => Navigator.push(
                                context,
                                MaterialPageRoute(
                                    builder: (_) => const NovaSenhaPage()),
                              ),
                              child: const Text(
                                'Esqueci minha senha',
                                style: TextStyle(color: Color(0xFF6A0DAD)),
                              ),
                            ),
                          ),

                          const SizedBox(height: 5),

                          // Botão entrar
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.orange,
                                padding:
                                    const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(15),
                                ),
                              ),
                              onPressed: _carregando ? null : _entrar,
                              child: _carregando
                                  ? const SizedBox(
                                      height: 20,
                                      width: 20,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : const Text(
                                      'ENTRAR',
                                      style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1,
                                        color: Colors.white,
                                      ),
                                    ),
                            ),
                          ),

                          const SizedBox(height: 20),

                          const Text('Não tem uma conta?',
                              style: TextStyle(color: Colors.grey)),

                          TextButton(
                            onPressed: () async {
                              final logou = await Navigator.push<bool>(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => EscolhaPage(
                                      voltarAposLogin: widget.voltarAposLogin),
                                ),
                              );
                              // Cadastro já loga o usuário; se veio de outro
                              // fluxo, volta pra lá sinalizando sucesso.
                              if (logou != true ||
                                  !widget.voltarAposLogin ||
                                  !context.mounted) {
                                return;
                              }
                              Navigator.pop(context, true);
                            },
                            child: const Text(
                              'Cadastre-se',
                              style: TextStyle(
                                color: Color(0xFF6A0DAD),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
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
