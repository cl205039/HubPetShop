import { UsuarioService } from '../services/usuario-service.js';
import { AppData } from '../session.js';
import { ApiError } from '../api-client.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import '../components/icones.js';

const REGEX_EMAIL = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/;

const form = document.getElementById('form-cadastro');
const botao = document.getElementById('btn-cadastrar');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nome = form.nome.value.trim();
  const cpfDigitos = form.cpf.value.replace(/\D/g, '');
  const email = form.email.value.trim();
  const confirmarEmail = form.confirmarEmail.value.trim();
  const telefone = form.telefone.value.trim();
  const senha = form.senha.value;
  const confirmarSenha = form.confirmarSenha.value;
  const tipoUsuario = form.tipoUsuario.value;

  if (!nome) return mostrarSnackbar('Informe seu nome', 'erro');
  if (cpfDigitos.length !== 11) return mostrarSnackbar('CPF inválido (11 dígitos)', 'erro');
  if (!REGEX_EMAIL.test(email)) return mostrarSnackbar('E-mail inválido', 'erro');
  if (email !== confirmarEmail) return mostrarSnackbar('Os e-mails não coincidem', 'erro');
  if (!telefone) return mostrarSnackbar('Informe o telefone', 'erro');
  if (senha.length < 6) return mostrarSnackbar('Mínimo 6 caracteres', 'erro');
  if (senha !== confirmarSenha) return mostrarSnackbar('As senhas não coincidem', 'erro');
  if (!form.aceitaTermos.checked) return mostrarSnackbar('Você precisa aceitar os termos de uso!', 'erro');

  botao.disabled = true;
  try {
    const usuario = await UsuarioService.cadastrar({
      nome,
      cpf: form.cpf.value.trim(),
      email,
      telefone,
      senha,
      aceitaNewsletter: form.aceitaNewsletter.checked,
      aceitaTermos: form.aceitaTermos.checked,
      tipoUsuario,
      notificacoes: true,
      localizacao: false,
    });

    AppData.usuarioLogado = usuario;
    AppData.boasVindasCadastro = true;
    const destino = AppData.destinoAposLogin;
    AppData.destinoAposLogin = null;
    window.location.href = destino || 'inicio.html';
  } catch (e) {
    if (e instanceof ApiError && e.statusCode === 409) {
      mostrarSnackbar('E-mail já cadastrado! Faça login.', 'aviso');
    } else {
      mostrarSnackbar(e instanceof ApiError ? e.message : 'Falha inesperada ao falar com o servidor.', 'erro');
    }
  } finally {
    botao.disabled = false;
  }
});
