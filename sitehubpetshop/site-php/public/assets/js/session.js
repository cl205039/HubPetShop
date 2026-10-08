const CHAVE_USUARIO = 'hubpet.usuarioLogado';
const CHAVE_CARRINHO = 'hubpet.carrinho';
const CHAVE_DESTINO = 'hubpet.destinoAposLogin';
const CHAVE_BOAS_VINDAS = 'hubpet.boasVindasCadastro';

export const AppData = {
  get usuarioLogado() {
    const bruto = sessionStorage.getItem(CHAVE_USUARIO);
    return bruto ? JSON.parse(bruto) : null;
  },
  set usuarioLogado(usuario) {
    if (usuario) sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    else sessionStorage.removeItem(CHAVE_USUARIO);
  },
  // Não há sessão/token no servidor pra invalidar — só limpa localmente.
  logout() {
    sessionStorage.removeItem(CHAVE_USUARIO);
  },

  get carrinho() {
    const bruto = sessionStorage.getItem(CHAVE_CARRINHO);
    return bruto ? JSON.parse(bruto) : [];
  },
  set carrinho(itens) {
    sessionStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens));
  },
  get totalCarrinho() {
    return this.carrinho.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
  },
  get qtdCarrinho() {
    return this.carrinho.reduce((soma, i) => soma + i.quantidade, 0);
  },
  adicionarAoCarrinho(nome, preco, petshopId, petshop) {
    const itens = this.carrinho;
    const existente = itens.find((i) => i.nome === nome && i.petshopId === petshopId);
    if (existente) existente.quantidade++;
    else itens.push({ nome, preco, petshopId, petshop, quantidade: 1 });
    this.carrinho = itens;
  },
  removerDoCarrinho(nome, petshopId) {
    this.carrinho = this.carrinho.filter((i) => !(i.nome === nome && i.petshopId === petshopId));
  },
  limparCarrinho() {
    this.carrinho = [];
  },

  // Página para onde voltar depois de um login/cadastro disparado pelo
  // modal "você precisa entrar" (ex.: ao tentar adicionar ao carrinho).
  get destinoAposLogin() {
    return sessionStorage.getItem(CHAVE_DESTINO);
  },
  set destinoAposLogin(caminho) {
    if (caminho) sessionStorage.setItem(CHAVE_DESTINO, caminho);
    else sessionStorage.removeItem(CHAVE_DESTINO);
  },

  // Marca que o usuário acabou de se cadastrar, pra exibir a saudação
  // personalizada uma única vez ao chegar na página inicial.
  set boasVindasCadastro(valor) {
    if (valor) sessionStorage.setItem(CHAVE_BOAS_VINDAS, '1');
    else sessionStorage.removeItem(CHAVE_BOAS_VINDAS);
  },
  // Lê a flag e já limpa, garantindo que a saudação apareça só uma vez.
  consumirBoasVindasCadastro() {
    const veioDoCadastro = sessionStorage.getItem(CHAVE_BOAS_VINDAS) === '1';
    sessionStorage.removeItem(CHAVE_BOAS_VINDAS);
    return veioDoCadastro;
  },
};
