import { AppData } from '../session.js';

// Toda página protegida chama isso no topo do seu pages/*.js — não existe
// roteador central, então cada tela confia que só chega aqui quem logou.
export function exigirLogin() {
  const usuario = AppData.usuarioLogado;
  if (!usuario) {
    window.location.href = 'index.html';
    return null;
  }
  return usuario;
}
