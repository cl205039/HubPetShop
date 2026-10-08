import 'json_utils.dart';

// Usuário (dono de pet ou veterinário). Vem da API depois de
// cadastro/login; `id` só existe depois que o servidor cria o registro.
class Usuario {
  int? id;
  String nome;
  String cpf;
  String email;
  String telefone;
  String senha;
  bool aceitaNewsletter;
  bool aceitaTermos;
  String tipoUsuario; // 'pessoafisica' | 'pessoajuridica' | 'veterinario'
  bool notificacoes;
  bool localizacao;

  Usuario({
    this.id,
    required this.nome,
    required this.cpf,
    required this.email,
    required this.telefone,
    this.senha = '',
    this.aceitaNewsletter = false,
    this.aceitaTermos = false,
    this.tipoUsuario = 'pessoafisica',
    this.notificacoes = true,
    this.localizacao = false,
  });

  factory Usuario.fromJson(Map<String, dynamic> json) => Usuario(
        id: paraInt(json['id']),
        nome: json['nome'] as String? ?? '',
        cpf: json['cpf'] as String? ?? '',
        email: json['email'] as String? ?? '',
        telefone: json['telefone'] as String? ?? '',
        // A API nunca devolve senha — fica vazia depois do login/cadastro.
        aceitaNewsletter: json['aceitaNewsletter'] as bool? ?? false,
        aceitaTermos: json['aceitaTermos'] as bool? ?? false,
        tipoUsuario: json['tipoUsuario'] as String? ?? 'pessoafisica',
        notificacoes: json['notificacoes'] as bool? ?? true,
        localizacao: json['localizacao'] as bool? ?? false,
      );

  // Usado em POST /usuarios (cadastro) e POST /usuarios/login.
  Map<String, dynamic> toJson() => {
        'nome': nome,
        'cpf': cpf,
        'email': email,
        'telefone': telefone,
        'senha': senha,
        'aceitaNewsletter': aceitaNewsletter,
        'aceitaTermos': aceitaTermos,
        'tipoUsuario': tipoUsuario,
        'notificacoes': notificacoes,
        'localizacao': localizacao,
      };
}
