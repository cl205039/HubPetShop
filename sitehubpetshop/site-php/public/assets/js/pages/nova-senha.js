import { UsuarioService } from '../services/usuario-service.js';
import { ApiError } from '../api-client.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import '../components/icones.js';

const form = document.getElementById('form-nova-senha');
const botao = document.getElementById('btn-redefinir');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const email = form.email.value.trim();
  const novaSenha = form.novaSenha.value;
  const confirmarSenha = form.confirmarSenha.value;

  if (!email || !email.includes('@')) return mostrarSnackbar('E-mail inválido', 'erro');
  if (novaSenha.length < 6) return mostrarSnackbar('Mínimo 6 caracteres', 'erro');
  if (novaSenha !== confirmarSenha) return mostrarSnackbar('As senhas não coincidem', 'erro');

  botao.disabled = true;
  try {
    await UsuarioService.redefinirSenha(email, novaSenha);
    mostrarSnackbar('Senha redefinida com sucesso! Faça login.', 'sucesso');
    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
  } catch (e) {
    if (e instanceof ApiError && e.statusCode === 404) {
      mostrarSnackbar('E-mail não cadastrado.', 'erro');
    } else {
      mostrarSnackbar(e instanceof ApiError ? e.message : 'Falha inesperada ao falar com o servidor.', 'erro');
    }
  } finally {
    botao.disabled = false;
  }
});
