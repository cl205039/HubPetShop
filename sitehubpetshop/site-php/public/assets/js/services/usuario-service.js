import { ApiClient, ApiError } from '../api-client.js';

export const UsuarioService = {
  cadastrar(usuario) {
    return ApiClient.post('usuarios', usuario);
  },
  // Retorna o usuário logado, ou null se e-mail/senha não confere
  // (a API responde 401 nesse caso).
  async login(email, senha) {
    try {
      return await ApiClient.post('usuarios/login', { email, senha });
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 401) return null;
      throw e;
    }
  },
  redefinirSenha(email, novaSenha) {
    return ApiClient.post('usuarios/redefinir-senha', { email, novaSenha });
  },
  buscarPorId(id) {
    return ApiClient.get(`usuarios/${id}`);
  },
  // Busca por um único atributo por vez: nome | email | telefone | cpf | tipo.
  buscar(atributo, termo) {
    return ApiClient.get('usuarios', { [atributo]: termo });
  },
  async total() {
    const lista = await ApiClient.get('usuarios');
    return lista.length;
  },
};
