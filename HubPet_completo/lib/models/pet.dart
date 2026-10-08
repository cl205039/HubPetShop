import 'json_utils.dart';

// Pet de um usuário. Idade/peso/nascimento ficam como texto livre
// (como já eram no formulário de cadastro), não campos tipados.
class Pet {
  int? id;
  int? usuarioId;
  String nome;
  String tipo;
  String raca;
  String idade;
  String peso;
  String nascimento;
  String sexo;

  Pet({
    this.id,
    this.usuarioId,
    required this.nome,
    required this.tipo,
    required this.raca,
    required this.idade,
    required this.peso,
    required this.nascimento,
    required this.sexo,
  });

  factory Pet.fromJson(Map<String, dynamic> json) => Pet(
        id: paraInt(json['id']),
        usuarioId: paraInt(json['usuarioId']),
        nome: json['nome'] as String? ?? '',
        tipo: json['tipo'] as String? ?? '',
        raca: json['raca'] as String? ?? '',
        idade: json['idade'] as String? ?? '',
        peso: json['peso'] as String? ?? '',
        nascimento: json['nascimento'] as String? ?? '',
        sexo: json['sexo'] as String? ?? '',
      );

  // Usado em POST /usuarios/{usuarioId}/pets (usuarioId já vai na URL).
  Map<String, dynamic> toJson() => {
        'nome': nome,
        'tipo': tipo,
        'raca': raca,
        'idade': idade,
        'peso': peso,
        'nascimento': nascimento,
        'sexo': sexo,
      };
}
