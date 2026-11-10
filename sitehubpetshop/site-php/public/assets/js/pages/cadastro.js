import { UsuarioService } from '../services/usuario-service.js';
import { AppData } from '../session.js';
import { ApiError } from '../api-client.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import '../components/icones.js';

const REGEX_EMAIL = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/;

const form = document.getElementById('form-cadastro');
const botao = document.getElementById('btn-cadastrar');

// =============================================
// VALIDAÇÃO MATEMÁTICA DO CPF
// Verifica os dois dígitos verificadores
// =============================================
function validarCPF(cpf) {
  const digitos = cpf.replace(/\D/g, '');

  if (digitos.length !== 11) return false;

  // Rejeita CPFs com todos os dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  // Valida primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(digitos[i]) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[9])) return false;

  // Valida segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(digitos[i]) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digitos[10])) return false;

  return true;
}

// =============================================
// FEEDBACK VISUAL NOS CAMPOS
// =============================================
function marcarCampo(campo, valido) {
  campo.style.outline = valido
    ? '2px solid #4CAF50'   // verde = válido
    : '2px solid #EF5350';  // vermelho = inválido
}

function limparCampo(campo) {
  campo.style.outline = '';
}

// Valida CPF em tempo real enquanto digita
const campoCpf = form.cpf;
campoCpf.addEventListener('input', () => {
  const digitos = campoCpf.value.replace(/\D/g, '');
  if (digitos.length === 11) {
    marcarCampo(campoCpf, validarCPF(digitos));
  } else {
    limparCampo(campoCpf);
  }
});

// Valida e-mail em tempo real enquanto digita
const campoEmail = form.email;
campoEmail.addEventListener('input', () => {
  const email = campoEmail.value.trim();
  if (email.length > 5) {
    marcarCampo(campoEmail, REGEX_EMAIL.test(email));
  } else {
    limparCampo(campoEmail);
  }
});

// =============================================
// SUBMIT DO FORMULÁRIO
// =============================================
form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const nome          = form.nome.value.trim();
  const cpfRaw        = form.cpf.value.trim();
  const cpfDigitos    = cpfRaw.replace(/\D/g, '');
  const email         = form.email.value.trim();
  const confirmarEmail = form.confirmarEmail.value.trim();
  const telefone      = form.telefone.value.trim();
  const senha         = form.senha.value;
  const confirmarSenha = form.confirmarSenha.value;
  const tipoUsuario   = form.tipoUsuario.value;

  // --- Validações básicas ---
  if (!nome) return mostrarSnackbar('Informe seu nome', 'erro');

  // CPF: quantidade de dígitos
  if (cpfDigitos.length !== 11) return mostrarSnackbar('CPF deve ter 11 dígitos', 'erro');

  // CPF: validação matemática
  if (!validarCPF(cpfDigitos)) {
    marcarCampo(campoCpf, false);
    return mostrarSnackbar('CPF inválido. Verifique os dígitos.', 'erro');
  }

  // E-mail: formato
  if (!REGEX_EMAIL.test(email)) {
    marcarCampo(campoEmail, false);
    return mostrarSnackbar('E-mail inválido', 'erro');
  }

  if (email !== confirmarEmail) return mostrarSnackbar('Os e-mails não coincidem', 'erro');
  if (!telefone) return mostrarSnackbar('Informe o telefone', 'erro');
  if (senha.length < 6) return mostrarSnackbar('Mínimo 6 caracteres na senha', 'erro');
  if (senha !== confirmarSenha) return mostrarSnackbar('As senhas não coincidem', 'erro');
  if (!form.aceitaTermos.checked) return mostrarSnackbar('Você precisa aceitar os termos de uso!', 'erro');

  // --- Verificação de e-mail e CPF já cadastrados (antes de enviar) ---
  botao.disabled = true;
  botao.textContent = 'Verificando...';

  try {
    // Verifica se e-mail já existe
    const usuariosEmail = await UsuarioService.buscar('email', email);
    if (usuariosEmail && usuariosEmail.length > 0) {
      marcarCampo(campoEmail, false);
      mostrarSnackbar('Este e-mail já está cadastrado. Faça login.', 'aviso');
      return;
    }

    // Verifica se CPF já existe
    const usuariosCpf = await UsuarioService.buscar('cpf', cpfDigitos);
    if (usuariosCpf && usuariosCpf.length > 0) {
      marcarCampo(campoCpf, false);
      mostrarSnackbar('Este CPF já está cadastrado.', 'aviso');
      return;
    }

    // --- Tudo certo — cadastra o usuário ---
    const usuario = await UsuarioService.cadastrar({
      nome,
      cpf: cpfRaw,
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
      marcarCampo(campoEmail, false);
      mostrarSnackbar('E-mail já cadastrado! Faça login.', 'aviso');
    } else {
      mostrarSnackbar(
        e instanceof ApiError ? e.message : 'Falha inesperada ao falar com o servidor.',
        'erro'
      );
    }
  } finally {
    botao.disabled = false;
    botao.textContent = 'Cadastrar';
  }
});