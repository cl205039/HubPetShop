import { exigirLogin } from '../components/guard.js';
import { AppData } from '../session.js';
import { PedidoService } from '../services/pedido-service.js';
import { EnderecoService } from '../services/endereco-service.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import { montarIcone } from '../components/icones.js';

const usuario = exigirLogin();
const itens = AppData.carrinho;

if (itens.length === 0) {
  window.location.href = 'carrinho.html';
}

document.getElementById('resumo-itens').innerHTML = itens.map((i) => `
  <div class="linha-total">
    <span>${i.quantidade}x ${i.nome}</span>
    <span>R$ ${(i.preco * i.quantidade).toFixed(2).replace('.', ',')}</span>
  </div>
`).join('');
document.getElementById('total-pedido').textContent = `R$ ${AppData.totalCarrinho.toFixed(2).replace('.', ',')}`;

function atualizarSelecaoVisual(seletorGrupo) {
  document.querySelectorAll(seletorGrupo).forEach((label) => {
    label.classList.toggle('selecionada', label.querySelector('input').checked);
  });
}

function renderizarEndereco(endereco) {
  return `
    <label class="opcao-radio">
      <input type="radio" name="endereco" value="${endereco.id}" ${endereco.principal ? 'checked' : ''}>
      <span class="opcao-radio__icone">${montarIcone('map-pin', 20)}</span>
      <span class="opcao-radio__texto">
        <strong>${endereco.titulo ?? 'Endereço'}${endereco.principal ? ' · Principal' : ''}</strong>
        <small>${endereco.rua}, ${endereco.numero} — ${endereco.bairro}, ${endereco.cidade}</small>
      </span>
    </label>
  `;
}

const LINK_CADASTRAR_ENDERECO = 'cadastrar-endereco.html?voltarPara=pagamentos.html';

async function carregarEnderecos() {
  const container = document.getElementById('lista-enderecos-checkout');
  container.innerHTML = '<div class="spinner"></div>';
  try {
    const enderecos = await EnderecoService.listar(usuario.id);
    if (enderecos.length === 0) {
      container.innerHTML = `
        <p class="texto-vazio">Você ainda não tem um endereço cadastrado.</p>
        <a href="${LINK_CADASTRAR_ENDERECO}" class="btn-outline" style="display:block; box-sizing:border-box; width:100%; text-align:center; text-decoration:none; color:var(--cor-primaria); font-weight:bold;">+ CADASTRAR ENDEREÇO</a>
      `;
      return;
    }
    container.innerHTML = enderecos.map(renderizarEndereco).join('')
      + `<p class="link-secundario" style="text-align:left; margin-top:4px;"><a href="${LINK_CADASTRAR_ENDERECO}">+ Cadastrar novo endereço</a></p>`;
    container.querySelectorAll('input[name="endereco"]').forEach((input) => {
      input.addEventListener('change', () => atualizarSelecaoVisual('#lista-enderecos-checkout .opcao-radio'));
    });
    atualizarSelecaoVisual('#lista-enderecos-checkout .opcao-radio');
  } catch (e) {
    container.innerHTML = `<p class="texto-erro">${e.message}</p>`;
  }
}

document.querySelectorAll('#opcoes-pagamento input[name="pagamento"]').forEach((input) => {
  input.addEventListener('change', () => {
    atualizarSelecaoVisual('#opcoes-pagamento .opcao-radio');
    document.getElementById('campo-tipo-cartao').hidden = input.value !== 'cartao';
  });
});

document.getElementById('btn-finalizar').addEventListener('click', async (evento) => {
  const enderecoInput = document.querySelector('input[name="endereco"]:checked');
  if (!enderecoInput) return mostrarSnackbar('Selecione um endereço de entrega', 'erro');

  const pagamentoInput = document.querySelector('input[name="pagamento"]:checked');
  if (!pagamentoInput) return mostrarSnackbar('Selecione a forma de pagamento', 'erro');

  const botao = evento.currentTarget;
  botao.disabled = true;
  try {
    const petshopId = itens[0]?.petshopId;
    await PedidoService.cadastrar(usuario.id, {
      petshopId,
      itens: itens.map((i) => ({ nome: i.nome, quantidade: i.quantidade, precoUnitario: i.preco })),
      total: AppData.totalCarrinho,
      data: new Date().toLocaleDateString('pt-BR'),
      etapa: 0,
    });
    AppData.limparCarrinho();
    mostrarSnackbar('Pedido realizado com sucesso!', 'sucesso');
    window.location.href = 'meus-pedidos.html';
  } catch (e) {
    mostrarSnackbar(e.message ?? 'Falha ao finalizar o pedido.', 'erro');
  } finally {
    botao.disabled = false;
  }
});

carregarEnderecos();
