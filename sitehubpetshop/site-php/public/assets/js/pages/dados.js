import { exigirLogin } from '../components/guard.js';
import { UsuarioService } from '../services/usuario-service.js';
import { AppData } from '../session.js';
import { ApiError } from '../api-client.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import '../components/icones.js';

const REGEX_EMAIL = /^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$/;

const form = document.getElementById('form-dados');
const campos = [...form.querySelectorAll('input, select')];
const btnEditar = document.getElementById('btn-editar');
const btnCancelar = document.getElementById('btn-cancelar');
const btnSalvar = document.getElementById('btn-salvar');
const acoesEdicao = document.getElementById('acoes-edicao');

let usuario = exigirLogin();

function preencher(u) {
  form.nome.value = u.nome ?? '';
  form.cpf.value = u.cpf ?? '';
  form.email.value = u.email ?? '';
  form.telefone.value = u.telefone ?? '';
  form.tipoUsuario.value = u.tipoUsuario;
}

function modoEdicao(ativo) {
  campos.forEach((c) => { c.disabled = !ativo; });
  btnEditar.hidden = ativo;
  acoesEdicao.hidden = !ativo;
  if (ativo) form.nome.focus();
}

if (usuario) {
  preencher(usuario);

  btnEditar.addEventListener('click', () => modoEdicao(true));

  btnCancelar.addEventListener('click', () => {
    preencher(usuario); // descarta o que foi digitado
    modoEdicao(false);
  });

  form.addEventListener('submit', async (evento) => {
    evento.preventDefault();

    const nome = form.nome.value.trim();
    const cpf = form.cpf.value.trim();
    const email = form.email.value.trim();
    const telefone = form.telefone.value.trim();
    const tipoUsuario = form.tipoUsuario.value;

    if (!nome) return mostrarSnackbar('Informe seu nome', 'erro');
    if (cpf.replace(/\D/g, '').length !== 11) return mostrarSnackbar('CPF inválido (11 dígitos)', 'erro');
    if (!REGEX_EMAIL.test(email)) return mostrarSnackbar('E-mail inválido', 'erro');
    if (!telefone) return mostrarSnackbar('Informe o telefone', 'erro');

    btnSalvar.disabled = true;
    try {
      const atualizado = await UsuarioService.atualizar(usuario.id, {
        nome, cpf, email, telefone, tipoUsuario,
      });
      usuario = atualizado;
      AppData.usuarioLogado = atualizado; // mantém o resto do site em sincronia
      preencher(atualizado);
      modoEdicao(false);
      mostrarSnackbar('Dados atualizados com sucesso!', 'sucesso');
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 409) {
        mostrarSnackbar('Este e-mail já está em uso por outra conta.', 'aviso');
      } else {
        mostrarSnackbar(e instanceof ApiError ? e.message : 'Falha inesperada ao falar com o servidor.', 'erro');
      }
    } finally {
      btnSalvar.disabled = false;
    }
  });
}