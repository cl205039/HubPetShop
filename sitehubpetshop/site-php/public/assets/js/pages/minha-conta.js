import { exigirLogin } from '../components/guard.js';
import { AppData } from '../session.js';
import '../components/icones.js';

const usuario = exigirLogin();
if (usuario) {
  document.getElementById('saudacao').textContent = `Olá, ${usuario.nome.split(' ')[0]}!`;
}

function sair() {
  AppData.logout();
  window.location.href = 'inicio.html';
}

document.getElementById('btn-sair').addEventListener('click', sair);
document.getElementById('btn-sair-rodape').addEventListener('click', sair);
