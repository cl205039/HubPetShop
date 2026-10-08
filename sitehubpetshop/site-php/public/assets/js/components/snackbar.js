export function mostrarSnackbar(mensagem, tipo = 'erro') {
  document.querySelectorAll('.snackbar').forEach((el) => el.remove());
  const el = document.createElement('div');
  el.className = `snackbar ${tipo}`;
  el.textContent = mensagem;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
