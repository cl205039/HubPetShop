import { UsuarioService } from '../services/usuario-service.js';
import { AppData } from '../session.js';
import { ApiError } from '../api-client.js';
import { mostrarSnackbar } from '../components/snackbar.js';

const form = document.getElementById('form-login');
const botao = document.getElementById('btn-entrar');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const email = form.email.value.trim();
  const senha = form.senha.value;

  if (!email || !email.includes('@')) {
    return mostrarSnackbar('E-mail inválido', 'erro');
  }
  if (!senha || senha.length < 6) {
    return mostrarSnackbar('Mínimo 6 caracteres', 'erro');
  }

  botao.disabled = true;
  try {
    const usuario = await UsuarioService.login(email, senha);
    if (usuario) {
      AppData.usuarioLogado = usuario;
      const destino = AppData.destinoAposLogin;
      AppData.destinoAposLogin = null;
      window.location.href = destino || 'inicio.html';
    } else {
      mostrarSnackbar('E-mail ou senha incorretos.', 'erro');
    }
  } catch (e) {
    mostrarSnackbar(e instanceof ApiError ? e.message : 'Falha inesperada ao falar com o servidor.', 'erro');
  } finally {
    botao.disabled = false;
  }
});
