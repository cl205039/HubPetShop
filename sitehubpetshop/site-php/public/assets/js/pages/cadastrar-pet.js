import { exigirLogin } from '../components/guard.js';
import { PetService } from '../services/pet-service.js';
import { mostrarSnackbar } from '../components/snackbar.js';
import '../components/icones.js';

const usuario = exigirLogin();
const form = document.getElementById('form-pet');
const botao = document.getElementById('btn-salvar');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const nome = form.nome.value.trim();
  if (!nome) return mostrarSnackbar('Informe o nome do pet', 'erro');

  botao.disabled = true;
  try {
    await PetService.cadastrar(usuario.id, {
      nome,
      tipo: form.tipo.value,
      raca: form.raca.value.trim() || null,
      sexo: form.sexo.value,
      idade: form.idade.value.trim() || null,
      peso: form.peso.value.trim() || null,
      nascimento: form.nascimento.value.trim() || null,
    });
    mostrarSnackbar('Pet cadastrado com sucesso!', 'sucesso');
    window.location.href = 'meus-pets.html';
  } catch (e) {
    mostrarSnackbar(e.message ?? 'Falha ao cadastrar o pet.', 'erro');
  } finally {
    botao.disabled = false;
  }
});
