import { AppData } from '../session.js';
import { montarIcone } from './icones.js';

// Preenche um placeholder do cabeçalho com "Entrar" (visitante) ou um
// perfilzinho de acesso à conta (usuário logado) — sempre ao lado do
// carrinho, no mesmo estilo dos links "Serviços" / "Meus pedidos".
export function renderizarAcessoConta(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const usuario = AppData.usuarioLogado;
  el.innerHTML = usuario
    ? `<a href="minha-conta.html" class="navbar-loja__perfil" title="Minha conta"><span>${montarIcone('user', 20)}</span>Perfil</a>`
    : `<button type="button" class="btn-entrar" onclick="window.location.href='index.html'">Entrar</button>`;
}
