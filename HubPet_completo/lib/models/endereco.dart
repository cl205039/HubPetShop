import 'json_utils.dart';

// Endereço salvo de um usuário. `titulo` é o apelido do endereço
// ("Casa", "Trabalho"...), opcional.
class Endereco {
  int? id;
  int? usuarioId;
  String? titulo;
  String rua;
  String numero;
  String complemento;
  String bairro;
  String cidade;
  bool principal;

  Endereco({
    this.id,
    this.usuarioId,
    this.titulo,
    required this.rua,
    required this.numero,
    this.complemento = '',
    required this.bairro,
    required this.cidade,
    this.principal = false,
  });

  factory Endereco.fromJson(Map<String, dynamic> json) => Endereco(
        id: paraInt(json['id']),
        usuarioId: paraInt(json['usuarioId']),
        titulo: json['titulo'] as String?,
        rua: json['rua'] as String? ?? '',
        numero: json['numero'] as String? ?? '',
        complemento: json['complemento'] as String? ?? '',
        bairro: json['bairro'] as String? ?? '',
        cidade: json['cidade'] as String? ?? '',
        principal: json['principal'] as bool? ?? false,
      );

  // Usado em POST/PUT de endereço (usuarioId já vai na URL do POST).
  Map<String, dynamic> toJson() => {
        'titulo': titulo,
        'rua': rua,
        'numero': numero,
        'complemento': complemento,
        'bairro': bairro,
        'cidade': cidade,
        'principal': principal,
      };

  /// Endereço formatado numa linha só, pra exibição em listas/resumos.
  String get resumo {
    final comp = complemento.trim().isEmpty ? '' : ' - $complemento';
    return '$rua, $numero$comp · $bairro, $cidade';
  }
}
