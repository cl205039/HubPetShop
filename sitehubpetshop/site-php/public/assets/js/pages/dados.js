import { exigirLogin } from '../components/guard.js';
import '../components/icones.js';

const usuario = exigirLogin();
if (usuario) {
  const rotulosTipo = {
    pessoafisica: 'Pessoa Física',
    pessoajuridica: 'Pessoa Jurídica',
  };
  document.getElementById('nome').value = usuario.nome;
  document.getElementById('cpf').value = usuario.cpf;
  document.getElementById('email').value = usuario.email;
  document.getElementById('telefone').value = usuario.telefone;
  document.getElementById('tipoUsuario').value = rotulosTipo[usuario.tipoUsuario] ?? usuario.tipoUsuario;
}
