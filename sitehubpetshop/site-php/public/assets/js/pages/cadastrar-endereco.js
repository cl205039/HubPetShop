import { exigirLogin } from '../components/guard.js';
import { EnderecoService } from '../services/endereco-service.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import '../components/icones.js';

const usuario = exigirLogin();
const form = document.getElementById('form-endereco');
const botao = document.getElementById('btn-salvar');
const voltarPara = new URLSearchParams(window.location.search).get('voltarPara') || 'meus-enderecos.html';
document.getElementById('btn-voltar-endereco').addEventListener('click', () => {
  window.location.href = voltarPara;
});

// Busca automática de endereço pelo CEP (API pública ViaCEP) — assim que
// os 8 dígitos são digitados, preenche rua/bairro/cidade sozinho.
const cepInput = document.getElementById('cep');

async function buscarPorCep(cep) {
  cepInput.disabled = true;
  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resposta.json();
    if (dados.erro) {
      mostrarSnackbar('CEP não encontrado.', 'erro');
      return;
    }
    form.rua.value = dados.logradouro || '';
    form.bairro.value = dados.bairro || '';
    form.cidade.value = dados.localidade || '';
    form.numero.focus();
  } catch (e) {
    mostrarSnackbar('Não foi possível buscar o CEP. Preencha o endereço manualmente.', 'aviso');
  } finally {
    cepInput.disabled = false;
  }
}

cepInput.addEventListener('input', () => {
  const digitos = cepInput.value.replace(/\D/g, '').slice(0, 8);
  cepInput.value = digitos.length > 5 ? `${digitos.slice(0, 5)}-${digitos.slice(5)}` : digitos;
  if (digitos.length === 8) buscarPorCep(digitos);
});

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const rua = form.rua.value.trim();
  const numero = form.numero.value.trim();
  const bairro = form.bairro.value.trim();
  const cidade = form.cidade.value.trim();

  if (!rua) return mostrarSnackbar('Informe a rua', 'erro');
  if (!numero) return mostrarSnackbar('Informe o número', 'erro');
  if (!bairro) return mostrarSnackbar('Informe o bairro', 'erro');
  if (!cidade) return mostrarSnackbar('Informe a cidade', 'erro');

  botao.disabled = true;
  try {
    await EnderecoService.cadastrar(usuario.id, {
      titulo: form.titulo.value.trim() || null,
      rua, numero,
      complemento: form.complemento.value.trim() || null,
      bairro, cidade,
      principal: form.principal.checked,
    });
    mostrarSnackbar('Endereço cadastrado com sucesso!', 'sucesso');
    window.location.href = voltarPara;
  } catch (e) {
    mostrarSnackbar(e.message ?? 'Falha ao cadastrar o endereço.', 'erro');
  } finally {
    botao.disabled = false;
  }
});
