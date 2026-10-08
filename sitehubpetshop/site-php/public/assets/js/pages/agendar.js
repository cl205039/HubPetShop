import { AppData } from '../session.js';
import { PetService } from '../services/pet-service.js';
import { AgendamentoService } from '../services/agendamento-service.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import { abrirModalLogin } from '../components/modal-login.js';
import { montarIcone } from '../components/icones.js';

const parametros = new URLSearchParams(window.location.search);
const petshopId = parametros.get('petshopId');
const nomePetshop = parametros.get('nome');
const nomeServico = parametros.get('servico');
const preco = parseFloat(parametros.get('preco'));

const painel = document.getElementById('conteudo-agendar');

// Petshop e serviço já vêm escolhidos da tela anterior (servicos-petshop.html);
// sem eles não tem o que confirmar aqui.
if (!petshopId || !nomeServico) {
  painel.innerHTML = `
    <p class="texto-vazio">Escolha um serviço para agendar.</p>
    <a href="petshops.html?para=servicos" class="btn-outline" style="display:block; box-sizing:border-box; width:100%; text-align:center; text-decoration:none; color:var(--cor-primaria); font-weight:bold;">VER PETSHOPS</a>
  `;
} else {
  document.getElementById('resumo-servico').innerHTML = `
    <span class="icone">${montarIcone('activity', 22)}</span>
    <div class="conteudo">
      <p class="titulo">${nomeServico}</p>
      <p class="subtitulo">${nomePetshop}</p>
    </div>
    <span class="preco">R$ ${preco.toFixed(2).replace('.', ',')}</span>
  `;

  const form = document.getElementById('form-agendar');
  const botao = document.getElementById('btn-agendar');

  async function preencherPets(usuario) {
    const select = document.getElementById('pet');
    if (!usuario) {
      select.innerHTML = '<option value="">Entre na sua conta para escolher um pet</option>';
      return;
    }
    try {
      const pets = await PetService.listar(usuario.id);
      select.innerHTML = pets.length
        ? pets.map((p) => `<option value="${p.nome}">${p.nome}</option>`).join('')
        : '<option value="">Nenhum pet cadastrado</option>';
    } catch (e) {
      select.innerHTML = '<option value="">Erro ao carregar pets</option>';
    }
  }

  async function confirmarAgendamento(usuario) {
    const dataHora = form.dataHora.value;
    const data = new Date(dataHora);
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    botao.disabled = true;
    try {
      await AgendamentoService.cadastrar(usuario.id, {
        servico: nomeServico,
        hora,
        pet: form.pet.value || null,
        local: nomePetshop,
        petshopId,
        data: dataHora.replace('T', ' ') + ':00',
        status: 'Pendente',
      });
      mostrarSnackbar('Agendamento confirmado!', 'sucesso');
      window.location.href = 'agendamentos.html';
    } catch (e) {
      mostrarSnackbar(e.message ?? 'Falha ao criar o agendamento.', 'erro');
    } finally {
      botao.disabled = false;
    }
  }

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const dataHora = form.dataHora.value;
    if (!dataHora) return mostrarSnackbar('Selecione data e hora', 'erro');

    // Mesmo fluxo do carrinho: navega e monta o agendamento livremente,
    // e só pede conta (login ou cadastro) neste botão final.
    const usuario = AppData.usuarioLogado;
    if (usuario) {
      confirmarAgendamento(usuario);
    } else {
      abrirModalLogin('Entre na sua conta para confirmar o agendamento.', (usuarioLogado) => {
        confirmarAgendamento(usuarioLogado);
      });
    }
  });

  preencherPets(AppData.usuarioLogado);
}
