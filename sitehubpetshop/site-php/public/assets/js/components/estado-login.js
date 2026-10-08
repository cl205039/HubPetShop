import { abrirModalLogin } from './modal-login.js';

// Estado exibido dentro de um container quando a página exige conta
// (Meus pets, Meus pedidos, Agendar) mas o visitante chegou até ela pelo
// menu sem estar logado — em vez de redirecionar direto pra tela de
// login, mostra a mensagem aqui e abre o modal de entrar/cadastrar.
export function renderizarEstadoDeslogado(container, mensagem) {
  container.innerHTML = `
    <div style="text-align:center; padding:40px 20px;">
      <p class="texto-vazio">${mensagem}</p>
      <button type="button" class="btn-primario" style="max-width:240px; margin:0 auto;" id="btn-estado-entrar">ENTRAR</button>
    </div>
  `;
  container.querySelector('#btn-estado-entrar').addEventListener('click', () => {
    abrirModalLogin(mensagem, () => window.location.reload());
  });
}
