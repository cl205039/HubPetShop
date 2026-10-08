import { AppData } from '../session.js';
import { UsuarioService } from '../services/usuario-service.js';
import { ApiError } from '../api-client.js';
import { mostrarSnackbar } from './snackbar.js';
import { montarIcone } from './icones.js';

// Modal de login usado ao finalizar a compra: o visitante monta o
// carrinho e navega livremente sem conta, e só precisa entrar (ou criar
// conta) nesse momento. Login bem-sucedido aqui chama `aoEntrar(usuario)`
// sem sair da página; "Cadastre-se agora" leva para o cadastro e volta
// pra cá depois (via AppData.destinoAposLogin), igual ao restante do site.
export function abrirModalLogin(mensagem, aoEntrar) {
  document.querySelectorAll('.modal-overlay').forEach((el) => el.remove());

  const destino = window.location.pathname.split('/').pop() + window.location.search;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-caixa">
      <button type="button" class="modal-fechar" aria-label="Fechar">${montarIcone('x', 16)}</button>
      <div style="display:flex; justify-content:center; color:var(--cor-primaria); margin-bottom:4px;">${montarIcone('paw', 30)}</div>
      <p class="modal-mensagem">${mensagem}</p>
      <form id="form-modal-login" novalidate style="text-align:left;">
        <div class="campo">
          <label for="modal-login-email">E-mail</label>
          <input type="email" id="modal-login-email" autocomplete="username" required>
        </div>
        <div class="campo" style="margin-bottom:10px;">
          <label for="modal-login-senha">Senha</label>
          <input type="password" id="modal-login-senha" autocomplete="current-password" minlength="6" required>
        </div>
        <button type="submit" class="btn-primario" id="modal-login-btn">ENTRAR</button>
      </form>
      <p class="link-secundario">Não tem conta? <a href="#" id="modal-login-cadastro">Cadastre-se agora</a></p>
    </div>
  `;
  document.body.appendChild(overlay);

  const form = overlay.querySelector('#form-modal-login');
  const botao = overlay.querySelector('#modal-login-btn');

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const email = overlay.querySelector('#modal-login-email').value.trim();
    const senha = overlay.querySelector('#modal-login-senha').value;

    if (!email || !email.includes('@')) return mostrarSnackbar('E-mail inválido', 'erro');
    if (!senha || senha.length < 6) return mostrarSnackbar('Mínimo 6 caracteres', 'erro');

    botao.disabled = true;
    try {
      const usuario = await UsuarioService.login(email, senha);
      if (usuario) {
        AppData.usuarioLogado = usuario;
        overlay.remove();
        aoEntrar(usuario);
      } else {
        mostrarSnackbar('E-mail ou senha incorretos.', 'erro');
      }
    } catch (e) {
      mostrarSnackbar(e instanceof ApiError ? e.message : 'Falha inesperada ao falar com o servidor.', 'erro');
    } finally {
      botao.disabled = false;
    }
  });

  overlay.querySelector('#modal-login-cadastro').addEventListener('click', (evento) => {
    evento.preventDefault();
    AppData.destinoAposLogin = destino;
    window.location.href = 'cadastro.html';
  });
  overlay.querySelector('.modal-fechar').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (evento) => {
    if (evento.target === overlay) overlay.remove();
  });
}
