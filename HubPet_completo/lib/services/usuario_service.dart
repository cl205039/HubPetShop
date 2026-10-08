import '../api_client.dart';
import '../models/usuario.dart';

class UsuarioService {
  UsuarioService._();

  static Future<Usuario> cadastrar(Usuario usuario) async {
    final json = await ApiClient.post('usuarios', usuario.toJson());
    return Usuario.fromJson(json as Map<String, dynamic>);
  }

  /// Retorna o usuário logado, ou `null` se e-mail/senha não confere
  /// (a API responde 401 nesse caso).
  static Future<Usuario?> login(String email, String senha) async {
    try {
      final json = await ApiClient.post('usuarios/login', {
        'email': email,
        'senha': senha,
      });
      return Usuario.fromJson(json as Map<String, dynamic>);
    } on ApiException catch (e) {
      if (e.statusCode == 401) return null;
      rethrow;
    }
  }

  static Future<void> redefinirSenha(String email, String novaSenha) {
    return ApiClient.post('usuarios/redefinir-senha', {
      'email': email,
      'novaSenha': novaSenha,
    });
  }

  static Future<Usuario> buscarPorId(int id) async {
    final json = await ApiClient.get('usuarios/$id');
    return Usuario.fromJson(json as Map<String, dynamic>);
  }

  /// Busca por um único atributo por vez, espelhando busca_usuarios.dart.
  /// `atributo` é um de: nome, email, telefone, cpf, tipo.
  static Future<List<Usuario>> buscar({
    required String atributo,
    required String termo,
  }) async {
    final json = await ApiClient.get('usuarios', query: {atributo: termo});
    return (json as List)
        .map((e) => Usuario.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Total de usuários cadastrados (mostrado no topo de BuscaUsuariosPage).
  static Future<int> total() async {
    final json = await ApiClient.get('usuarios');
    return (json as List).length;
  }
}
