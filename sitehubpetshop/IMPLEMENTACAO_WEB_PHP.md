# Implementação Web (HTML + CSS + JavaScript + PHP) — HubPet

Este documento especifica como construir uma **versão site** do HubPet —
hoje um app Flutter (`lib/`) — usando **HTML/CSS/JavaScript puro** no
front-end e **PHP** no back-end, consumindo **o mesmo contrato de API**
já definido em [`docs/API.md`](./API.md) e reproduzindo os mesmos
padrões visuais e de UX do app.

Não existe framework envolvido dos dois lados, de propósito: assim como
o Flutter usa só `StatefulWidget` + `setState` (sem Provider/Riverpod/
Bloc), o site usa HTML/CSS/JS "vanilla" (sem React/Vue) e o backend usa
PHP puro com PDO (sem Laravel/Symfony). Isso é intencional — é um
projeto acadêmico e o objetivo é dar pra qualquer membro do grupo ler o
código sem aprender um framework novo.

> Este arquivo documenta uma implementação **nova**, que ainda não
> existe no repositório. `docs/API.md` descreve o contrato (o "o quê");
> este arquivo descreve o "como" construir o site + a API em PHP que
> implementa esse contrato, e como estruturar o front-end pra manter a
> mesma cara e o mesmo comportamento do app Flutter.

---

## 1. Objetivo e escopo

- **Objetivo:** oferecer uma versão navegador (desktop/mobile web) do
  HubPet, com as mesmas telas, o mesmo fluxo de navegação e a mesma
  identidade visual do app Flutter, para quem não puder/quiser instalar
  o app.
- **Mesma API, dois consumidores:** o app Flutter e o site vão consumir
  exatamente o mesmo contrato REST (`docs/API.md`). Isso implica:
  - **Sem autenticação por token/sessão** — o "usuário logado" também é
    identificado por `usuarioId` na URL, exatamente como no app.
  - **Mesmos nomes de campo em português** (`nome`, `cpf`, `email`,
    `senha`, `tipoUsuario`, `preco`...).
  - **Mesmo formato de erro** — `{ "erro": "...", "mensagem": "..." }`.
- **Escopo desta implementação de backend:** como hoje a API "real" do
  projeto roda em outra máquina/stack (endereço configurado em
  `lib/api_config.dart`) e sua implementação está fora deste repositório
  (`docs/API.md` diz explicitamente "implementação fica a cargo do
  backend"), este documento assume que o **PHP é uma implementação nova
  desse mesmo contrato**, com seu próprio banco de dados — não um proxy
  para a API já existente. Se no futuro o requisito for "o site fala com
  a MESMA instância de API que o app Flutter usa hoje", pule a seção 8
  (o site já funciona só trocando `API_BASE_URL`, ver seção 7.1).
- **Fora de escopo:** autenticação real (JWT/sessão), HTTPS, painel
  administrativo, testes automatizados de UI. Podem ser adicionados
  depois sem quebrar o contrato.

---

## 2. Arquitetura geral

```
┌─────────────────────────┐        JSON/HTTP        ┌──────────────────────────┐
│  Navegador               │ ───────────────────────▶ │  API PHP (site-php/api)  │
│  site-php/public/*.html  │ ◀─────────────────────── │  PDO + MySQL/MariaDB     │
│  + CSS + JS (fetch)      │      mesmo contrato       │  (schema.sql)            │
└─────────────────────────┘      de docs/API.md       └──────────────────────────┘
```

- O **front-end** é um site multi-página (uma página HTML por tela,
  igual "uma tela ≈ um arquivo" do Flutter) servido como arquivos
  estáticos.
- O **backend** é uma API HTTP em PHP, com um banco relacional próprio,
  que implementa todas as rotas de `docs/API.md`.
- **Sem SPA, sem build step:** não há bundler (Webpack/Vite) nem
  transpilação — só `<script type="module">` nativo do navegador. Isso
  mantém o mesmo espírito "sem ferramentas extras" do projeto Flutter
  atual (só `flutter pub get`, sem geração de código).

---

## 3. Estrutura de pastas proposta

Novo diretório na raiz do repositório, **irmão** de `lib/`. Não reaproveitar
a pasta `web/` existente — ela é o scaffold do Flutter Web
(`flutter build web` a usa) e não deve ser mexida.

```
HubPet_completo/
├── lib/                        # app Flutter (existente, não mexe)
├── web/                        # scaffold Flutter Web (existente, não mexe)
├── docs/
│   ├── API.md                  # contrato da API (existente)
│   └── IMPLEMENTACAO_WEB_PHP.md  # este documento
└── site-php/                   # NOVO — site + API PHP
    ├── public/                 # front-end estático (document root do site)
    │   ├── index.html          # login (equivalente a telainicio.dart)
    │   ├── escolha.html
    │   ├── cadastro.html
    │   ├── nova-senha.html
    │   ├── inicio.html
    │   ├── minha-conta.html         # "Home" no Flutter (nome confuso lá também)
    │   ├── dados.html
    │   ├── meus-pets.html
    │   ├── cadastrar-pet.html
    │   ├── meus-enderecos.html
    │   ├── cadastrar-endereco.html
    │   ├── petshops.html
    │   ├── produtos-petshop.html
    │   ├── produtos-categoria.html
    │   ├── carrinho.html
    │   ├── agendar.html
    │   ├── agendamentos.html
    │   ├── meus-pedidos.html        # "endereco.dart" no Flutter (legado)
    │   ├── pagamentos.html
    │   ├── servicos-vet.html
    │   ├── home-veterinario.html
    │   ├── dados-vet.html
    │   ├── busca-usuarios.html
    │   ├── descricao-projeto.html
    │   ├── sobre-nos.html
    │   └── assets/
    │       ├── css/
    │       │   ├── tokens.css       # design tokens (cores, raios, sombra)
    │       │   ├── components.css   # botão, input, card, snackbar, spinner
    │       │   └── layout.css       # header + painel branco por tela
    │       ├── js/
    │       │   ├── api-config.js    # endereço da API (só lugar a editar)
    │       │   ├── api-client.js    # fetch wrapper + ApiError
    │       │   ├── session.js       # AppData (usuário logado + carrinho)
    │       │   ├── services/        # 1 arquivo por domínio, espelha lib/services/
    │       │   │   ├── usuario-service.js
    │       │   │   ├── pet-service.js
    │       │   │   ├── endereco-service.js
    │       │   │   ├── petshop-service.js
    │       │   │   ├── produto-service.js
    │       │   │   ├── servico-service.js
    │       │   │   ├── servico-vet-service.js
    │       │   │   ├── agendamento-service.js
    │       │   │   └── pedido-service.js
    │       │   ├── components/
    │       │   │   └── snackbar.js
    │       │   └── pages/           # 1 arquivo por página, mesma lógica das telas .dart
    │       │       ├── login.js
    │       │       ├── cadastro.js
    │       │       ├── inicio.js
    │       │       ├── meus-pets.js
    │       │       └── ...
    │       └── images/              # mesmos arquivos de assets/images/ do Flutter
    └── api/                     # backend PHP (document root da API)
        ├── config.php           # credenciais do banco — único lugar a editar
        ├── db.php               # conexão PDO (singleton)
        ├── cors.php             # headers de CORS + resposta a OPTIONS
        ├── helpers.php          # responder(), erro(), corpoRequisicao()
        ├── index.php            # front controller (roteador)
        ├── .htaccess            # rewrite de tudo para index.php (Apache)
        ├── usuarios.php
        ├── pets.php
        ├── enderecos.php
        ├── petshops.php
        ├── produtos.php
        ├── servicos.php
        ├── servicos_vet.php
        ├── agendamentos.php
        ├── pedidos.php
        └── schema.sql           # DDL + seed (usuários demo, catálogo)
```

---

## 4. Design system extraído do app Flutter

Estes tokens foram extraídos direto do código (`lib/*.dart`) — não são
uma nova proposta visual, são a tradução para CSS do que já existe, pra
o site parecer o mesmo produto.

### 4.1 Paleta de cores

| Token CSS | Valor | Uso no Flutter |
|---|---|---|
| `--cor-primaria` | `#6A0DAD` | Cor primária do `ColorScheme`, textos de destaque, ícones de ação |
| `--cor-primaria-clara` | `#9C27B0` | Fim do gradiente de fundo padrão (`inicio.dart`, `telainicio.dart`, `agendar.dart`, `busca_usuarios.dart`...) |
| `--cor-primaria-escura` | `#4A148C` | Início do gradiente "escuro" usado em telas internas (`meuspets.dart`, `home.dart`, `endereco.dart`) |
| `--cor-primaria-escura-2` | `#6A1B9A` | Fim do gradiente escuro |
| `--cor-secundaria` (laranja) | `#FF9800` | Botões de ação principal (`ElevatedButton` laranja), badges |
| `--cor-secundaria-clara` | `#FFB74D` | Variante clara do laranja (card de categoria "Petiscos") |
| `--cor-fundo-input` | `#F5F5F5` | `fillColor` de todo `TextFormField` |
| `--cor-cinza-card` | `#F5F5F5` (grey.shade100) | Fundo dos cards de lista (petshops na Home) |
| `--cor-texto-secundario` | `#9E9E9E` (`Colors.grey`) | Textos auxiliares, hints |
| `--cor-erro` | `#EF5350` (`Colors.red.shade400`) | SnackBar de erro |
| `--cor-sucesso` | `#4CAF50` (`Colors.green`) | SnackBar de sucesso (cadastro concluído) |
| `--cor-aviso` | `#FF9800` (`Colors.orange`) | SnackBar de aviso (ex.: e-mail já cadastrado) |

Cores fixas dos cards de categoria na Home (`inicio.dart`), cada uma com
seu próprio gradiente diagonal:

| Categoria | Gradiente |
|---|---|
| Rações | `#6A0DAD` → `#9C27B0` (roxo, igual à marca) |
| Petiscos | `#FF9800` → `#FFB74D` (laranja) |
| Higiene | `#00ACC1` → `#26C6DA` (ciano) |
| Brinquedos | `#E91E63` → `#F06292` (rosa) |
| Serviços | `#43A047` → `#66BB6A` (verde) |

### 4.2 Gradientes de fundo

Duas variantes usadas conforme a tela (ver `lib/*.dart` — cada tela
escolhe uma das duas, não há uma terceira variação):

```css
/* Telas "principais" — login, home, agendar, busca */
.fundo-gradiente-principal {
  background: linear-gradient(to bottom, #6A0DAD, #9C27B0);
}

/* Telas "internas" — meus pets, minha conta, endereços */
.fundo-gradiente-escuro {
  background: linear-gradient(to bottom, #4A148C, #6A1B9A);
}
```

### 4.3 Raios de borda e sombra

| Token | Valor | Onde |
|---|---|---|
| `--raio-input` | `15px` | Campos de formulário |
| `--raio-card` | `20px` | Cards (pet, oferta, categoria) |
| `--raio-painel` | `30px` (só topo) | Painel branco que "sobe" sobre o gradiente |
| `--raio-login-card` | `25px` | Card flutuante do login |
| `--raio-botao` | `15px`–`20px` | Botões |
| `--sombra-card` | `0 10px 20px rgba(0,0,0,.12)` | Card de login (`boxShadow` com blur 20, offset (0,10), `Colors.black12`) |

### 4.4 Tipografia e ícones

- **Fonte:** o app não define fonte customizada (`pubspec.yaml` não tem
  bloco `fonts:`) — usa a fonte padrão do Material (Roboto). No site, use:
  ```css
  --fonte-base: "Roboto", system-ui, -apple-system, "Segoe UI", sans-serif;
  ```
  Opcionalmente importe **Roboto** do Google Fonts para consistência
  entre plataformas; um `system-ui` como fallback já fica muito próximo.
- **Ícones:** o app usa `Icons.*` (Material Icons). O equivalente web
  com nomes idênticos é a fonte **Material Symbols** do Google Fonts —
  os nomes dos ícones batem 1:1 com os usados no Flutter:

  | Uso | Ícone Flutter | Nome Material Symbols |
  |---|---|---|
  | Pata / pet genérico | `Icons.pets` | `pets` |
  | E-mail (login) | `Icons.email_outlined` | `mail` |
  | Senha | `Icons.lock_outline` | `lock` |
  | Mostrar/ocultar senha | `Icons.visibility` / `visibility_off` | `visibility` / `visibility_off` |
  | Voltar | `Icons.arrow_back` | `arrow_back` |
  | Buscar | `Icons.search` | `search` |
  | Nota (estrela) | `Icons.star` | `star` |
  | Sair | `Icons.logout` | `logout` |
  | Editar | `Icons.edit` | `edit` |
  | Adicionar | `Icons.add` | `add` |
  | Seta de item de lista | `Icons.arrow_forward_ios` | `arrow_forward_ios` |
  | Banho | `bathtub` | `bathtub` |
  | Tosa | `cut` | `cut` |
  | Consulta vet | `medical_services` | `medical_services` |
  | Vacina | `vaccines` | `vaccines` |
  | Ração | `rice_bowl` | `rice_bowl` |
  | Petisco | `cookie` | `cookie` |
  | Higiene | `shower` | `shower` |
  | Brinquedo | `toys` | `toys` |
  | Idade do pet | `Icons.cake` | `cake` |
  | Peso do pet | `Icons.monitor_weight` | `monitor_weight` |
  | Nascimento | `Icons.calendar_today` | `calendar_today` |

  Baixe a fonte localmente (self-host) em vez de depender de CDN, já
  que o app roda numa rede local fechada sem garantia de internet — o
  mesmo motivo pelo qual `docs/API.md` enfatiza que tudo roda offline.

### 4.5 Componentes

**Botão primário** (`ElevatedButton` laranja — "ENTRAR", "FINALIZAR
CADASTRO", "Cadastrar novo pet"):
```css
.btn-primario {
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 20px;
  background: var(--cor-secundaria);
  color: #fff;
  font-weight: bold;
  letter-spacing: 1px;
  cursor: pointer;
}
.btn-primario:disabled { opacity: .7; cursor: not-allowed; }
```

**Botão outline** ("Tentar novamente" sobre fundo roxo):
```css
.btn-outline {
  padding: 10px 18px;
  border-radius: 20px;
  border: 1px solid currentColor;
  background: transparent;
  cursor: pointer;
}
```

**Card branco padrão** (pet, oferta):
```css
.card {
  background: #fff;
  border-radius: var(--raio-card);
  padding: 15px;
}
```

**Painel branco com topo arredondado** (o "bottom sheet" que cobre a
maior parte da tela sobre o gradiente — ver `inicio.dart`,
`telacadastro.dart`):
```css
.painel-branco {
  background: #fff;
  border-radius: 30px 30px 0 0;
  padding: 20px;
  flex: 1;
}
```

**Snackbar** (substitui `ScaffoldMessenger.showSnackBar` — flutuante,
cantos arredondados, cor por tipo):
```css
.snackbar {
  position: fixed;
  left: 16px; right: 16px; bottom: 16px;
  padding: 14px 18px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
  animation: snackbar-subir .2s ease-out;
}
.snackbar.erro     { background: var(--cor-erro); }
.snackbar.sucesso  { background: var(--cor-sucesso); }
.snackbar.aviso    { background: var(--cor-aviso); }
@keyframes snackbar-subir {
  from { transform: translateY(20px); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}
```

**Spinner de carregamento** (substitui `CircularProgressIndicator`):
```css
.spinner {
  width: 32px; height: 32px;
  margin: 40px auto;
  border: 3px solid rgba(0,0,0,.1);
  border-top-color: var(--cor-primaria);
  border-radius: 50%;
  animation: spinner-girar .8s linear infinite;
}
@keyframes spinner-girar { to { transform: rotate(360deg); } }
```

### 4.6 Padrão de tela: carregando / erro / vazio / dados

Todo `StatefulWidget` de listagem no Flutter segue este padrão (ver
`lib/meuspets.dart`, referenciado em `CLAUDE.md` como a tela-modelo):
`initState` dispara a chamada → `setState` alterna entre **carregando**
(spinner), **erro** (mensagem + botão "Tentar novamente") e **dados**
(lista renderizada) — nunca deixa a tela em branco sem feedback.

No site, a mesma máquina de estados vira uma função JS reutilizável
(ver código completo na seção 7.3). Toda página que lista dados da API
deve usá-la, exatamente como toda tela Flutter de listagem segue o
mesmo padrão de `_carregando` / `_erro` / lista vazia / dados.

---

## 5. Mapa de telas → páginas do site

| Arquivo Flutter | Página / Widget | Arquivo HTML novo | JS de página |
|---|---|---|---|
| `telainicio.dart` | `Telainicio` (login) | `index.html` | `login.js` |
| `escolha.dart` | `EscolhaPage` | `escolha.html` | `escolha.js` |
| `telacadastro.dart` | `CadastroPage` | `cadastro.html` | `cadastro.js` |
| `nova_senha.dart` | `NovaSenhaPage` | `nova-senha.html` | `nova-senha.js` |
| `inicio.dart` | `InicioPage` | `inicio.html` | `inicio.js` |
| `home.dart` / `home_vet.dart` | `Home` / `HomeVet` ("Minha Conta") | `minha-conta.html` | `minha-conta.js` |
| `home_veterinario.dart` | `HomeVeterinarioPage` | `home-veterinario.html` | `home-veterinario.js` |
| `dados.dart` / `dados_vet.dart` | `Dados` / `DadosVet` | `dados.html` | `dados.js` |
| `meuspets.dart` | `MeusPets` | `meus-pets.html` | `meus-pets.js` |
| `cadastrar_pet.dart` | `CadastroPetPage` | `cadastrar-pet.html` | `cadastrar-pet.js` |
| `endereco.dart` | `PedidosPage` ("Meus Pedidos" — nome do arquivo não bate, legado) | `meus-pedidos.html` | `meus-pedidos.js` |
| `meus_enderecos.dart` / `cadastrar_endereco.dart` | `MeusEnderecosPage` / `CadastrarEnderecoPage` | `meus-enderecos.html` / `cadastrar-endereco.html` | idem |
| `lista_petshops.dart` | `ListaPetshopsPage` | `petshops.html` | `petshops.js` |
| `produtos_petshop.dart` | `ProdutosPetshopPage` | `produtos-petshop.html?petshopId=` | `produtos-petshop.js` |
| `produtos_categoria.dart` | `ProdutosCategoriaPage` | `produtos-categoria.html?categoria=` | `produtos-categoria.js` |
| `carrinho.dart` | `CarrinhoPage` | `carrinho.html` | `carrinho.js` |
| `agendar.dart` | `AgendarPage` | `agendar.html` | `agendar.js` |
| `agendamentos.dart` | `AgendamentosPage` | `agendamentos.html` | `agendamentos.js` |
| `servicos_vet.dart` | `ServicosVetPage` | `servicos-vet.html` | `servicos-vet.js` |
| `pagamentos.dart` | `PagamentosPage` | `pagamentos.html` | `pagamentos.js` |
| `busca_usuarios.dart` | `BuscaUsuariosPage` | `busca-usuarios.html` | `busca-usuarios.js` |
| `descricao_projeto.dart` | `DescricaoProjetoPage` | `descricao-projeto.html` | — (estático) |
| `sobre_nos.dart` | `SobreNosPage` | `sobre-nos.html` | — (estático) |

**Navegação:** o Flutter usa `Navigator.push`/`pushReplacement` — sem
rotas nomeadas, sem menu de navegação persistente (sem bottom nav bar).
O site replica isso com **navegação de página inteira**
(`window.location.href = '...'`), passando dados entre páginas por
**query string** (ex.: `produtos-petshop.html?petshopId=3&nome=...`) ou
via `session.js` quando o dado é o usuário logado/carrinho. Não crie uma
SPA com client-side router — não é o padrão do projeto.

---

## 6. Sessão e carrinho no navegador

Equivalente web de `lib/app_data.dart`. Como o Flutter guarda isso **em
memória** (dura enquanto o app está aberto, some ao fechar), o
equivalente mais fiel no navegador é `sessionStorage` (dura enquanto a
aba está aberta, some ao fechá-la) — não `localStorage`, que
sobreviveria a sessões demais e fugiria do comportamento original.

`site-php/public/assets/js/session.js`:
```js
const CHAVE_USUARIO = 'hubpet.usuarioLogado';
const CHAVE_CARRINHO = 'hubpet.carrinho';

export const AppData = {
  get usuarioLogado() {
    const bruto = sessionStorage.getItem(CHAVE_USUARIO);
    return bruto ? JSON.parse(bruto) : null;
  },
  set usuarioLogado(usuario) {
    if (usuario) sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
    else sessionStorage.removeItem(CHAVE_USUARIO);
  },
  // Não há sessão/token no servidor pra invalidar — só limpa localmente,
  // igual a AppData.logout() no Flutter.
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
  adicionarAoCarrinho(nome, preco, petshop) {
    const itens = this.carrinho;
    const existente = itens.find((i) => i.nome === nome && i.petshop === petshop);
    if (existente) existente.quantidade++;
    else itens.push({ nome, preco, petshop, quantidade: 1 });
    this.carrinho = itens;
  },
  removerDoCarrinho(nome, petshop) {
    this.carrinho = this.carrinho.filter((i) => !(i.nome === nome && i.petshop === petshop));
  },
  limparCarrinho() {
    this.carrinho = [];
  },
};
```

Toda página protegida (que exige login) deve checar
`AppData.usuarioLogado` no topo do seu `pages/*.js` e redirecionar pra
`index.html` se for `null` — não existe middleware/guard central porque
não existe roteador central (mesma limitação que o Flutter tem: cada
tela confia que só chega lá quem já passou pelo login).

---

## 7. Camada de acesso à API em JavaScript

### 7.1 `api-config.js` — equivalente a `lib/api_config.dart`

```js
// ============================================================
// CONFIGURAÇÃO DA API — altere aqui se o endereço do backend
// mudar. Único lugar do site com a URL escrita, igual
// lib/api_config.dart no app Flutter.
// ============================================================
export const API_BASE_URL = 'http://localhost/hubpet/api/';
```

### 7.2 `api-client.js` — equivalente a `lib/api_client.dart`

Mesmo contrato de erro único (`ApiError`), mesmo timeout (10s), mesmo
tratamento de 204/corpo vazio:

```js
import { API_BASE_URL } from './api-config.js';

export class ApiError extends Error {
  constructor(mensagem, statusCode = null, codigo = null) {
    super(mensagem);
    this.statusCode = statusCode;
    this.codigo = codigo;
  }
}

const TIMEOUT_MS = 10000;

function montarUrl(caminho, query) {
  const url = new URL(caminho.replace(/^\//, ''), API_BASE_URL);
  if (query) {
    for (const [chave, valor] of Object.entries(query)) {
      if (valor !== undefined && valor !== null && valor !== '') {
        url.searchParams.set(chave, valor);
      }
    }
  }
  return url;
}

async function executar(metodo, caminho, { corpo, query } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let resposta;
  try {
    resposta = await fetch(montarUrl(caminho, query), {
      method: metodo,
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    if (e.name === 'AbortError') {
      throw new ApiError('O servidor demorou demais para responder. Tente novamente.');
    }
    throw new ApiError(
      'Não foi possível conectar à API. Verifique o endereço em api-config.js e se o servidor está ligado.',
    );
  } finally {
    clearTimeout(timer);
  }

  if (resposta.status === 204) return null;

  const texto = await resposta.text();
  const dados = texto ? JSON.parse(texto) : null;

  if (resposta.ok) return dados;

  throw new ApiError(
    dados?.mensagem ?? `Erro no servidor (${resposta.status}).`,
    resposta.status,
    dados?.erro ?? null,
  );
}

export const ApiClient = {
  get: (caminho, query) => executar('GET', caminho, { query }),
  post: (caminho, corpo) => executar('POST', caminho, { corpo }),
  put: (caminho, corpo) => executar('PUT', caminho, { corpo }),
  delete: (caminho) => executar('DELETE', caminho),
};
```

### 7.3 Padrão de "carregando / erro / dados" reutilizável

Equivalente genérico ao bloco `if (_carregando) ... else if (_erro !=
null) ... else ...` repetido em toda tela de listagem do Flutter:

```js
// assets/js/components/estado-lista.js
export async function carregarEm(container, buscarDados, renderizarItem, vazioMsg = 'Nenhum item encontrado.') {
  container.innerHTML = '<div class="spinner" role="status" aria-label="Carregando"></div>';
  try {
    const itens = await buscarDados();
    container.innerHTML = itens.length
      ? itens.map(renderizarItem).join('')
      : `<p class="texto-vazio">${vazioMsg}</p>`;
  } catch (e) {
    container.innerHTML = `
      <p class="texto-erro">${e.message}</p>
      <button type="button" class="btn-outline" data-acao="tentar-novamente">Tentar novamente</button>
    `;
    container.querySelector('[data-acao="tentar-novamente"]')
      .addEventListener('click', () => carregarEm(container, buscarDados, renderizarItem, vazioMsg));
  }
}
```

### 7.4 Serviços — um arquivo por domínio

Espelha `lib/services/*.dart` 1:1. Exemplo completo,
`usuario-service.js` (compare com `lib/services/usuario_service.dart`):

```js
import { ApiClient, ApiError } from '../api-client.js';

export const UsuarioService = {
  cadastrar(usuario) {
    return ApiClient.post('usuarios', usuario);
  },
  // Retorna o usuário logado, ou null se e-mail/senha não confere
  // (a API responde 401 nesse caso) — mesmo comportamento do Dart.
  async login(email, senha) {
    try {
      return await ApiClient.post('usuarios/login', { email, senha });
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 401) return null;
      throw e;
    }
  },
  redefinirSenha(email, novaSenha) {
    return ApiClient.post('usuarios/redefinir-senha', { email, novaSenha });
  },
  buscarPorId(id) {
    return ApiClient.get(`usuarios/${id}`);
  },
  // Busca por um único atributo por vez: nome | email | telefone | cpf | tipo.
  buscar(atributo, termo) {
    return ApiClient.get('usuarios', { [atributo]: termo });
  },
  async total() {
    const lista = await ApiClient.get('usuarios');
    return lista.length;
  },
};
```

Os demais services (`pet-service.js`, `endereco-service.js`,
`petshop-service.js`, `produto-service.js`, `servico-service.js`,
`servico-vet-service.js`, `agendamento-service.js`, `pedido-service.js`)
seguem o mesmo molde: um método por rota de `docs/API.md`, sem lógica
além de montar o caminho e devolver a Promise do `ApiClient`.

### 7.5 Exemplo de página completa — login (`pages/login.js`)

Compare com `lib/telainicio.dart` — mesma validação, mesma decisão de
destino por `tipoUsuario`, mesma mensagem de erro:

```js
import { UsuarioService } from '../services/usuario-service.js';
import { AppData } from '../session.js';
import { ApiError } from '../api-client.js';
import { mostrarSnackbar } from '../components/snackbar.js';

const form = document.getElementById('form-login');
const botao = document.getElementById('btn-entrar');

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  const email = form.email.value.trim();
  const senha = form.senha.value;

  if (!email || !email.includes('@')) {
    return mostrarSnackbar('E-mail inválido', 'erro');
  }
  if (!senha || senha.length < 6) {
    return mostrarSnackbar('Mínimo 6 caracteres', 'erro');
  }

  botao.disabled = true;
  try {
    const usuario = await UsuarioService.login(email, senha);
    if (usuario) {
      AppData.usuarioLogado = usuario;
      window.location.href = usuario.tipoUsuario === 'veterinario'
        ? 'home-veterinario.html'
        : 'inicio.html';
    } else {
      mostrarSnackbar('E-mail ou senha incorretos! 🐾', 'erro');
    }
  } catch (e) {
    mostrarSnackbar(e instanceof ApiError ? e.message : 'Falha inesperada ao falar com o servidor.', 'erro');
  } finally {
    botao.disabled = false;
  }
});
```

`components/snackbar.js` (substitui `ScaffoldMessenger.showSnackBar`):
```js
export function mostrarSnackbar(mensagem, tipo = 'erro') {
  document.querySelectorAll('.snackbar').forEach((el) => el.remove());
  const el = document.createElement('div');
  el.className = `snackbar ${tipo}`;
  el.textContent = mensagem;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
```

---

## 8. Backend PHP

### 8.1 Infraestrutura compartilhada

`api/config.php` — equivalente a `lib/api_config.dart`, único lugar com
credenciais do banco:
```php
<?php
// ============================================================
// CONFIGURAÇÃO DO BANCO — altere aqui se usuário/senha/host do
// MySQL mudarem. Único lugar do backend com essas credenciais.
// ============================================================
define('DB_HOST', 'localhost');
define('DB_NAME', 'hubpet');
define('DB_USER', 'root');
define('DB_SENHA', '');
```

`api/db.php` — conexão PDO única por requisição:
```php
<?php
require_once __DIR__ . '/config.php';

function conexao(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_SENHA, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}
```

`api/cors.php` — igual à seção "CORS é obrigatório" de `docs/API.md`,
incluído em toda requisição:
```php
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
```

`api/helpers.php` — respostas e leitura de corpo padronizadas (o
"`ApiException` do lado do servidor"):
```php
<?php
function corpoRequisicao(): array {
    $dados = json_decode(file_get_contents('php://input'), true);
    return is_array($dados) ? $dados : [];
}

function responder(int $status, $dados = null): void {
    http_response_code($status);
    if ($dados !== null) echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

// Sempre no formato { "erro": "...", "mensagem": "..." } exigido por docs/API.md.
function erro(int $status, string $codigo, string $mensagem): void {
    responder($status, ['erro' => $codigo, 'mensagem' => $mensagem]);
}

function campoObrigatorio(array $dados, string $campo): bool {
    return isset($dados[$campo]) && $dados[$campo] !== '';
}
```

`api/index.php` — front controller/roteador único:
```php
<?php
require __DIR__ . '/cors.php';
require __DIR__ . '/helpers.php';

$metodo = $_SERVER['REQUEST_METHOD'];
$caminho = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
// Se a API estiver publicada em /hubpet/api/, remova esse prefixo antes de rotear.
$caminho = preg_replace('#^hubpet/api/?#', '', $caminho);

// [método, regex, arquivo, função]
$rotas = [
    ['POST',   '#^usuarios$#',                    'usuarios.php',    'usuarios_cadastrar'],
    ['POST',   '#^usuarios/login$#',              'usuarios.php',    'usuarios_login'],
    ['POST',   '#^usuarios/redefinir-senha$#',    'usuarios.php',    'usuarios_redefinir_senha'],
    ['GET',    '#^usuarios/(\d+)$#',              'usuarios.php',    'usuarios_buscar_por_id'],
    ['GET',    '#^usuarios$#',                    'usuarios.php',    'usuarios_buscar'],

    ['GET',    '#^usuarios/(\d+)/pets$#',         'pets.php',        'pets_listar'],
    ['POST',   '#^usuarios/(\d+)/pets$#',         'pets.php',        'pets_cadastrar'],
    ['PUT',    '#^pets/(\d+)$#',                  'pets.php',        'pets_atualizar'],
    ['DELETE', '#^pets/(\d+)$#',                  'pets.php',        'pets_remover'],

    ['GET',    '#^usuarios/(\d+)/enderecos$#',    'enderecos.php',   'enderecos_listar'],
    ['POST',   '#^usuarios/(\d+)/enderecos$#',    'enderecos.php',   'enderecos_cadastrar'],
    ['DELETE', '#^enderecos/(\d+)$#',             'enderecos.php',   'enderecos_remover'],

    ['GET',    '#^petshops$#',                    'petshops.php',    'petshops_listar'],
    ['GET',    '#^petshops/(\d+)$#',               'petshops.php',    'petshops_buscar_por_id'],
    ['GET',    '#^petshops/(\d+)/ofertas$#',       'produtos.php',    'ofertas_por_petshop'],
    ['GET',    '#^produtos/ofertas$#',             'produtos.php',    'ofertas_todas'],

    ['GET',    '#^servicos$#',                     'servicos.php',    'servicos_listar'],

    ['GET',    '#^veterinarios/(\d+)/servicos$#',  'servicos_vet.php', 'servicos_vet_listar'],
    ['POST',   '#^veterinarios/(\d+)/servicos$#',  'servicos_vet.php', 'servicos_vet_cadastrar'],
    ['DELETE', '#^servicos-vet/(\d+)$#',           'servicos_vet.php', 'servicos_vet_remover'],

    ['GET',    '#^usuarios/(\d+)/agendamentos$#',  'agendamentos.php', 'agendamentos_listar'],
    ['POST',   '#^usuarios/(\d+)/agendamentos$#',  'agendamentos.php', 'agendamentos_cadastrar'],

    ['GET',    '#^usuarios/(\d+)/pedidos$#',       'pedidos.php',     'pedidos_listar'],
    ['POST',   '#^usuarios/(\d+)/pedidos$#',       'pedidos.php',     'pedidos_cadastrar'],
];

foreach ($rotas as [$metodoRota, $regex, $arquivo, $funcao]) {
    if ($metodo !== $metodoRota) continue;
    if (preg_match($regex, $caminho, $m)) {
        array_shift($m);
        require __DIR__ . '/' . $arquivo;
        $funcao(...$m);
        exit;
    }
}

erro(404, 'rota_nao_encontrada', 'Rota não encontrada.');
```

`api/.htaccess` (Apache com `mod_rewrite`) — manda tudo pro roteador:
```apacheconf
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [QSA,L]
```

### 8.2 Banco de dados — `api/schema.sql`

```sql
CREATE DATABASE IF NOT EXISTS hubpet
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hubpet;

CREATE TABLE usuarios (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  nome              VARCHAR(150) NOT NULL,
  cpf               VARCHAR(20)  NOT NULL,
  email             VARCHAR(150) NOT NULL UNIQUE,
  telefone          VARCHAR(30)  NOT NULL,
  senha_hash        VARCHAR(255) NOT NULL,
  aceita_newsletter TINYINT(1)   NOT NULL DEFAULT 0,
  aceita_termos     TINYINT(1)   NOT NULL DEFAULT 0,
  tipo_usuario      ENUM('pessoafisica','pessoajuridica','veterinario') NOT NULL,
  notificacoes      TINYINT(1)   NOT NULL DEFAULT 1,
  localizacao       TINYINT(1)   NOT NULL DEFAULT 0,
  criado_em         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  nome        VARCHAR(100) NOT NULL,
  tipo        VARCHAR(50)  NOT NULL,
  raca        VARCHAR(100),
  idade       VARCHAR(50),
  peso        VARCHAR(50),
  nascimento  VARCHAR(50),
  sexo        VARCHAR(20),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE enderecos (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id   INT NOT NULL,
  titulo       VARCHAR(100) NULL,
  rua          VARCHAR(150) NOT NULL,
  numero       VARCHAR(20)  NOT NULL,
  complemento  VARCHAR(100),
  bairro       VARCHAR(100) NOT NULL,
  cidade       VARCHAR(100) NOT NULL,
  principal    TINYINT(1)   NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE petshops (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(150)  NOT NULL,
  nota          DECIMAL(2,1)  NOT NULL DEFAULT 0,
  distancia_km  DECIMAL(5,2)  NOT NULL DEFAULT 0
);

CREATE TABLE produtos (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  nome       VARCHAR(200) NOT NULL,
  descricao  VARCHAR(255),
  categoria  ENUM('racoes','petiscos','higiene','brinquedos') NOT NULL,
  imagem     VARCHAR(255)
);

-- Um produto vendido por um petshop, a um preço — nunca exposto "solto".
CREATE TABLE ofertas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  produto_id  INT NOT NULL,
  petshop_id  INT NOT NULL,
  preco       DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
  FOREIGN KEY (petshop_id) REFERENCES petshops(id) ON DELETE CASCADE
);

-- Catálogo global de agendamento (banho, tosa, consulta...).
CREATE TABLE servicos (
  id     INT AUTO_INCREMENT PRIMARY KEY,
  nome   VARCHAR(100)  NOT NULL,
  preco  DECIMAL(10,2) NOT NULL,
  icone  VARCHAR(50)   NOT NULL DEFAULT 'pets'
);

-- Serviços que um veterinário específico oferece ("Meus Serviços").
CREATE TABLE servicos_vet (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  veterinario_id  INT NOT NULL,
  nome            VARCHAR(150)  NOT NULL,
  preco           DECIMAL(10,2) NOT NULL,
  duracao         VARCHAR(30),
  FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE agendamentos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  servico     VARCHAR(255) NOT NULL, -- nomes já concatenados, vindos prontos do front
  hora        VARCHAR(20)  NOT NULL,
  status      ENUM('Confirmado','Pendente','Concluído') NOT NULL DEFAULT 'Pendente',
  pet         VARCHAR(100),
  local       VARCHAR(150),
  petshop_id  INT NULL,
  data        DATETIME NOT NULL,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (petshop_id) REFERENCES petshops(id) ON DELETE SET NULL
);

CREATE TABLE pedidos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id  INT NOT NULL,
  loja        VARCHAR(150)  NOT NULL,
  total       DECIMAL(10,2) NOT NULL,
  data        VARCHAR(50)   NOT NULL, -- texto livre já formatado, igual ao contrato
  etapa       TINYINT       NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE itens_pedido (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id        INT NOT NULL,
  nome             VARCHAR(200)  NOT NULL,
  quantidade       INT           NOT NULL DEFAULT 1,
  preco_unitario   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- ── Seed: usuários de demonstração (mesmas credenciais mostradas na
-- tela de login do Flutter) — senha "123456" com hash bcrypt real.
INSERT INTO usuarios (nome, cpf, email, telefone, senha_hash, aceita_termos, tipo_usuario)
VALUES
  ('Administrador HubPet', '000.000.000-00', 'admin@hubpetshop.com', '(11) 90000-0000',
   '$2y$10$lceWjpgdi2ljcjDQopy.XOJf6VuYuH2zK4YOEbrGNDxrXRn6swO8O', 1, 'pessoafisica'),
  ('Veterinário HubPet', '000.000.000-01', 'veterinario@hubpetshop.com', '(11) 90000-0001',
   '$2y$10$lceWjpgdi2ljcjDQopy.XOJf6VuYuH2zK4YOEbrGNDxrXRn6swO8O', 1, 'veterinario');

-- ── Seed: catálogo de serviços de agendamento (igual ao exemplo de docs/API.md).
INSERT INTO servicos (nome, preco, icone) VALUES
  ('Banho', 50.0, 'bathtub'),
  ('Tosa', 60.0, 'cut'),
  ('Banho e Tosa', 100.0, 'pets'),
  ('Consulta Veterinária', 120.0, 'medical_services'),
  ('Vacina', 90.0, 'vaccines');

-- ── Seed: petshops de exemplo.
INSERT INTO petshops (nome, nota, distancia_km) VALUES
  ('Petshop Bom pra Pet', 4.8, 2.4),
  ('Amigos do Pet', 4.5, 0.9);
```

> O hash acima foi gerado com `password_hash('123456', PASSWORD_BCRYPT)`
> e confirmado com `password_verify('123456', $hash)`. Gere o seu se
> quiser trocar a senha de demonstração.

### 8.3 Endpoints — `usuarios.php` (implementação de referência completa)

```php
<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function usuarios_linha_para_json(array $linha): array {
    // Nunca inclui senha_hash — equivale a "senha nunca volta em
    // nenhuma resposta da API", exigido em docs/API.md.
    return [
        'id'               => (int) $linha['id'],
        'nome'             => $linha['nome'],
        'cpf'              => $linha['cpf'],
        'email'            => $linha['email'],
        'telefone'         => $linha['telefone'],
        'aceitaNewsletter' => (bool) $linha['aceita_newsletter'],
        'aceitaTermos'     => (bool) $linha['aceita_termos'],
        'tipoUsuario'      => $linha['tipo_usuario'],
        'notificacoes'     => (bool) $linha['notificacoes'],
        'localizacao'      => (bool) $linha['localizacao'],
    ];
}

function usuarios_cadastrar(): void {
    $dados = corpoRequisicao();
    foreach (['nome', 'cpf', 'email', 'telefone', 'senha', 'tipoUsuario'] as $campo) {
        if (!campoObrigatorio($dados, $campo)) {
            erro(400, 'campo_obrigatorio', "Informe o campo obrigatório: $campo.");
        }
    }

    $pdo = conexao();
    $existe = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $existe->execute([$dados['email']]);
    if ($existe->fetch()) {
        erro(409, 'email_ja_cadastrado', 'Este e-mail já está cadastrado.');
    }

    $stmt = $pdo->prepare(
        'INSERT INTO usuarios
           (nome, cpf, email, telefone, senha_hash, aceita_newsletter, aceita_termos, tipo_usuario, notificacoes, localizacao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $dados['nome'], $dados['cpf'], $dados['email'], $dados['telefone'],
        password_hash($dados['senha'], PASSWORD_BCRYPT),
        !empty($dados['aceitaNewsletter']) ? 1 : 0,
        !empty($dados['aceitaTermos']) ? 1 : 0,
        $dados['tipoUsuario'],
        array_key_exists('notificacoes', $dados) ? (!empty($dados['notificacoes']) ? 1 : 0) : 1,
        !empty($dados['localizacao']) ? 1 : 0,
    ]);

    responder(201, usuarios_linha_para_json(buscarUsuarioPorId($pdo, (int) $pdo->lastInsertId())));
}

function usuarios_login(): void {
    $dados = corpoRequisicao();
    if (!campoObrigatorio($dados, 'email') || !campoObrigatorio($dados, 'senha')) {
        erro(400, 'campo_obrigatorio', 'Informe e-mail e senha.');
    }

    $pdo = conexao();
    $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE email = ?');
    $stmt->execute([$dados['email']]);
    $linha = $stmt->fetch();

    if (!$linha || !password_verify($dados['senha'], $linha['senha_hash'])) {
        erro(401, 'credenciais_invalidas', 'E-mail ou senha incorretos.');
    }

    responder(200, usuarios_linha_para_json($linha));
}

function usuarios_redefinir_senha(): void {
    $dados = corpoRequisicao();
    if (!campoObrigatorio($dados, 'email') || !campoObrigatorio($dados, 'novaSenha')) {
        erro(400, 'campo_obrigatorio', 'Informe e-mail e nova senha.');
    }

    $pdo = conexao();
    $stmt = $pdo->prepare('SELECT id FROM usuarios WHERE email = ?');
    $stmt->execute([$dados['email']]);
    $linha = $stmt->fetch();
    if (!$linha) erro(404, 'email_nao_cadastrado', 'E-mail não cadastrado.');

    $pdo->prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?')
        ->execute([password_hash($dados['novaSenha'], PASSWORD_BCRYPT), $linha['id']]);

    responder(200, new stdClass());
}

function usuarios_buscar_por_id(string $id): void {
    $linha = buscarUsuarioPorId(conexao(), (int) $id);
    if (!$linha) erro(404, 'usuario_nao_encontrado', 'Usuário não encontrado.');
    responder(200, usuarios_linha_para_json($linha));
}

// Busca por UM atributo por vez: nome | email | telefone | cpf (substring,
// case-insensitive) ou tipo (substring contra o rótulo em português).
function usuarios_buscar(): void {
    $pdo = conexao();
    $mapaColuna = ['nome' => 'nome', 'email' => 'email', 'telefone' => 'telefone', 'cpf' => 'cpf'];

    if (!empty($_GET['tipo'])) {
        $rotulos = [
            'pessoafisica'   => 'Pessoa Física',
            'pessoajuridica' => 'Pessoa Jurídica',
            'veterinario'    => 'Veterinário',
        ];
        $termo = mb_strtolower($_GET['tipo']);
        $tipos = array_keys(array_filter($rotulos, fn($r) => str_contains(mb_strtolower($r), $termo)));
        if (empty($tipos)) responder(200, []);
        $marcadores = implode(',', array_fill(0, count($tipos), '?'));
        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE tipo_usuario IN ($marcadores)");
        $stmt->execute($tipos);
    } else {
        $filtro = null;
        foreach ($mapaColuna as $param => $coluna) {
            if (!empty($_GET[$param])) { $filtro = [$coluna, $_GET[$param]]; break; }
        }
        if ($filtro) {
            [$coluna, $termo] = $filtro;
            $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE $coluna LIKE ?");
            $stmt->execute(['%' . $termo . '%']);
        } else {
            $stmt = $pdo->query('SELECT * FROM usuarios');
        }
    }

    responder(200, array_map('usuarios_linha_para_json', $stmt->fetchAll()));
}

function buscarUsuarioPorId(PDO $pdo, int $id): array|false {
    $stmt = $pdo->prepare('SELECT * FROM usuarios WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}
```

### 8.4 Endpoints — `pets.php` (segundo exemplo de referência: CRUD simples)

```php
<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function pets_linha_para_json(array $l): array {
    return [
        'id' => (int) $l['id'], 'usuarioId' => (int) $l['usuario_id'],
        'nome' => $l['nome'], 'tipo' => $l['tipo'], 'raca' => $l['raca'],
        'idade' => $l['idade'], 'peso' => $l['peso'],
        'nascimento' => $l['nascimento'], 'sexo' => $l['sexo'],
    ];
}

function pets_listar(string $usuarioId): void {
    $stmt = conexao()->prepare('SELECT * FROM pets WHERE usuario_id = ?');
    $stmt->execute([$usuarioId]);
    responder(200, array_map('pets_linha_para_json', $stmt->fetchAll()));
}

function pets_cadastrar(string $usuarioId): void {
    $dados = corpoRequisicao();
    foreach (['nome', 'tipo'] as $campo) {
        if (!campoObrigatorio($dados, $campo)) {
            erro(400, 'campo_obrigatorio', "Informe o campo obrigatório: $campo.");
        }
    }
    $pdo = conexao();
    $stmt = $pdo->prepare(
        'INSERT INTO pets (usuario_id, nome, tipo, raca, idade, peso, nascimento, sexo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $usuarioId, $dados['nome'], $dados['tipo'], $dados['raca'] ?? null,
        $dados['idade'] ?? null, $dados['peso'] ?? null,
        $dados['nascimento'] ?? null, $dados['sexo'] ?? null,
    ]);
    $novo = $pdo->prepare('SELECT * FROM pets WHERE id = ?');
    $novo->execute([$pdo->lastInsertId()]);
    responder(201, pets_linha_para_json($novo->fetch()));
}

function pets_atualizar(string $id): void {
    $dados = corpoRequisicao();
    $pdo = conexao();
    $pdo->prepare(
        'UPDATE pets SET nome=?, tipo=?, raca=?, idade=?, peso=?, nascimento=?, sexo=? WHERE id=?'
    )->execute([
        $dados['nome'] ?? null, $dados['tipo'] ?? null, $dados['raca'] ?? null,
        $dados['idade'] ?? null, $dados['peso'] ?? null, $dados['nascimento'] ?? null,
        $dados['sexo'] ?? null, $id,
    ]);
    $atual = $pdo->prepare('SELECT * FROM pets WHERE id = ?');
    $atual->execute([$id]);
    $linha = $atual->fetch();
    if (!$linha) erro(404, 'pet_nao_encontrado', 'Pet não encontrado.');
    responder(200, pets_linha_para_json($linha));
}

function pets_remover(string $id): void {
    conexao()->prepare('DELETE FROM pets WHERE id = ?')->execute([$id]);
    responder(204);
}
```

`enderecos.php` segue **exatamente o mesmo molde** de `pets.php`
(listar/cadastrar/remover), trocando as colunas pelas de `enderecos`.

### 8.5 Endpoints — consultas com `JOIN` (produtos/ofertas)

Estas duas rotas de `docs/API.md` precisam juntar `ofertas` com
`produtos` (e com `petshops`, na segunda):

```php
<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function ofertas_linha_para_json(array $l, bool $comPetshop): array {
    $base = [
        'ofertaId'  => (int) $l['ofertaId'],
        'produtoId' => (int) $l['produtoId'],
        'nome'      => $l['nome'],
        'descricao' => $l['descricao'],
        'categoria' => $l['categoria'],
        'imagem'    => $l['imagem'],
        'preco'     => (float) $l['preco'],
    ];
    if ($comPetshop) {
        $base += [
            'petshopId'          => (int) $l['petshopId'],
            'petshopNome'        => $l['petshopNome'],
            'petshopNota'        => (float) $l['petshopNota'],
            'petshopDistanciaKm' => (float) $l['petshopDistanciaKm'],
        ];
    }
    return $base;
}

function ofertas_por_petshop(string $petshopId): void {
    $stmt = conexao()->prepare(
        'SELECT o.id AS ofertaId, p.id AS produtoId, p.nome, p.descricao, p.categoria, p.imagem, o.preco
         FROM ofertas o
         JOIN produtos p ON p.id = o.produto_id
         WHERE o.petshop_id = ?'
    );
    $stmt->execute([$petshopId]);
    responder(200, array_map(fn($l) => ofertas_linha_para_json($l, false), $stmt->fetchAll()));
}

function ofertas_todas(): void {
    $sql = 'SELECT o.id AS ofertaId, p.id AS produtoId, p.nome, p.descricao, p.categoria, p.imagem, o.preco,
                   ps.id AS petshopId, ps.nome AS petshopNome, ps.nota AS petshopNota, ps.distancia_km AS petshopDistanciaKm
            FROM ofertas o
            JOIN produtos p ON p.id = o.produto_id
            JOIN petshops ps ON ps.id = o.petshop_id';
    $params = [];
    if (!empty($_GET['categoria'])) {
        $sql .= ' WHERE p.categoria = ?';
        $params[] = $_GET['categoria'];
    }
    $stmt = conexao()->prepare($sql);
    $stmt->execute($params);
    responder(200, array_map(fn($l) => ofertas_linha_para_json($l, true), $stmt->fetchAll()));
}
```

`petshops.php` (listar / buscar por id) e `servicos.php` (catálogo
global, só `SELECT * FROM servicos`) são `SELECT`s diretos, sem
segredo — siga o molde de `pets_listar`.

`servicos_vet.php` segue o molde de `pets.php` (listar por
`veterinario_id`, cadastrar, remover por id) trocando as colunas.

`agendamentos.php` (listar/cadastrar) também segue o molde de
`pets.php` — note que o campo `servico` já chega **pronto, como texto
concatenado** do front-end (o usuário pode marcar mais de um serviço no
fluxo de agendar), então o backend só grava a string, sem lógica extra.

### 8.6 Endpoints — `pedidos.php` (transação com itens aninhados)

Único caso que não é CRUD simples: um pedido tem uma lista de itens, que
mora em outra tabela. Precisa de transação pra não gravar pedido sem
item (ou vice-versa):

```php
<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/helpers.php';

function pedidos_linha_para_json(PDO $pdo, array $pedido): array {
    $stmt = $pdo->prepare('SELECT nome, quantidade, preco_unitario AS precoUnitario FROM itens_pedido WHERE pedido_id = ?');
    $stmt->execute([$pedido['id']]);
    return [
        'id'        => (int) $pedido['id'],
        'usuarioId' => (int) $pedido['usuario_id'],
        'loja'      => $pedido['loja'],
        'itens'     => array_map(fn($i) => [
            'nome' => $i['nome'],
            'quantidade' => (int) $i['quantidade'],
            'precoUnitario' => (float) $i['precoUnitario'],
        ], $stmt->fetchAll()),
        'total' => (float) $pedido['total'],
        'data'  => $pedido['data'],
        'etapa' => (int) $pedido['etapa'],
    ];
}

function pedidos_listar(string $usuarioId): void {
    $pdo = conexao();
    $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE usuario_id = ?');
    $stmt->execute([$usuarioId]);
    responder(200, array_map(fn($p) => pedidos_linha_para_json($pdo, $p), $stmt->fetchAll()));
}

function pedidos_cadastrar(string $usuarioId): void {
    $dados = corpoRequisicao();
    if (empty($dados['loja']) || empty($dados['itens']) || !is_array($dados['itens'])) {
        erro(400, 'campo_obrigatorio', 'Informe loja e ao menos um item.');
    }

    $pdo = conexao();
    $pdo->beginTransaction();
    try {
        $pdo->prepare('INSERT INTO pedidos (usuario_id, loja, total, data, etapa) VALUES (?, ?, ?, ?, ?)')
            ->execute([$usuarioId, $dados['loja'], $dados['total'] ?? 0, $dados['data'] ?? '', $dados['etapa'] ?? 0]);
        $pedidoId = (int) $pdo->lastInsertId();

        $itemStmt = $pdo->prepare('INSERT INTO itens_pedido (pedido_id, nome, quantidade, preco_unitario) VALUES (?, ?, ?, ?)');
        foreach ($dados['itens'] as $item) {
            $itemStmt->execute([$pedidoId, $item['nome'], $item['quantidade'] ?? 1, $item['precoUnitario'] ?? 0]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        erro(500, 'erro_interno', 'Não foi possível criar o pedido.');
    }

    $stmt = $pdo->prepare('SELECT * FROM pedidos WHERE id = ?');
    $stmt->execute([$pedidoId]);
    responder(201, pedidos_linha_para_json($pdo, $stmt->fetch()));
}
```

### 8.7 Segurança (o que muda em relação a `docs/API.md`)

`docs/API.md` já avisa: sem autenticação, aceitável só porque a API
roda numa rede local fechada. Isso é mantido — o site também não
implementa login por token. Mesmo assim, a implementação em PHP
**deve** aplicar estas duas práticas mínimas, que não quebram o
contrato (porque `senha` nunca é devolvida em nenhuma resposta):

1. **Hash de senha** (`password_hash`/`password_verify`, como nos
   exemplos acima) em vez de gravar a senha em texto puro — o contrato
   já promete que `senha` nunca volta numa resposta, então trocar o
   texto puro por hash no banco é transparente para os dois front-ends.
2. **Prepared statements (PDO)** em toda query com dado de entrada —
   já seguido em todos os exemplos acima — para evitar SQL injection.

Fora isso, valem as mesmas ressalvas já documentadas: qualquer um que
souber um `usuarioId` pode ler/criar dados dele; não expor isso na
internet sem adicionar autenticação de verdade antes.

---

## 9. Regras de negócio replicadas do Flutter

Estas validações existem nos formulários Flutter e devem aparecer
**client-side no JS** (pra dar feedback imediato) **e também
server-side no PHP** (pra não confiar só no navegador) — mesmas
mensagens em português, pra não haver diferença de UX entre app e site:

| Campo | Regra | Mensagem exata |
|---|---|---|
| Nome | não vazio | `Informe seu nome` |
| CPF | 11 dígitos após remover não-numéricos | `CPF inválido (11 dígitos)` |
| E-mail | regex `^[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}$` | `E-mail inválido` |
| Confirmar e-mail | igual ao e-mail | `Os e-mails não coincidem` |
| Telefone | não vazio | `Informe o telefone` |
| Senha | mínimo 6 caracteres | `Mínimo 6 caracteres` |
| Confirmar senha | igual à senha | `As senhas não coincidem` |
| Termos de uso | checkbox marcado (bloqueia o envio antes mesmo de chamar a API) | `Você precisa aceitar os termos de uso!` |
| Login: e-mail/senha errados | resposta 401 da API | `E-mail ou senha incorretos! 🐾` |
| Cadastro: e-mail duplicado | resposta 409 da API | `E-mail já cadastrado! Faça login.` |

Regras de navegação a replicar:
- Login com `tipoUsuario == 'veterinario'` → `home-veterinario.html`;
  qualquer outro tipo → `inicio.html`.
- Home mostra só os **3 primeiros** petshops, com um link "Ver todos"
  que abre `petshops.html` (lista completa).
- Na grade de categorias da Home, "Serviços" **não** abre uma lista de
  produtos — abre `agendar.html` direto (as outras 4 categorias abrem
  `produtos-categoria.html?categoria=...`).

---

## 10. Limitação conhecida herdada do Flutter

`home_veterinario.dart` usa uma lista mockada de "atendimentos do dia"
(comentário `// TODO(api)` no código) porque agendamentos não guardam
qual veterinário atendeu — não há como popular isso com dados reais sem
mudar também o fluxo de agendamento (adicionar uma etapa de "escolher
veterinário"). O site herda a mesma limitação: `home-veterinario.html`
também deve usar dados de exemplo fixos nessa seção específica, com o
mesmo comentário de TODO, até que o fluxo de agendamento ganhe esse
campo.

---

## 11. Como rodar localmente

1. **Banco de dados:** suba um MySQL/MariaDB local (ex.: XAMPP,
   Laragon ou `docker run mariadb`) e importe `api/schema.sql`.
2. **Backend PHP:** aponte o document root do Apache (ou
   `php -S localhost:8080` a partir de `site-php/api/`, servindo
   `index.php` como front controller) para `site-php/api/`. Ajuste
   `api/config.php` com usuário/senha do banco.
3. **Front-end:** sirva `site-php/public/` como arquivos estáticos
   (Apache, `python -m http.server`, extensão "Live Server" do
   VS Code, etc.) e ajuste `API_BASE_URL` em `api-config.js` para
   apontar pro endereço do passo 2.
4. Para evitar CORS por completo em produção/apresentação, sirva os
   dois (site estático + API PHP) sob o **mesmo domínio/porta** (ex.:
   Apache com `public/` como raiz e um alias `/api` apontando pra
   `site-php/api/`) — os headers de CORS do `cors.php` continuam lá
   como rede de segurança para desenvolvimento com portas diferentes.

## 12. Roteiro de teste manual

Mesmo roteiro já validado contra a API real neste projeto — repita
contra o PHP local trocando só a URL base:

```bash
API="http://localhost/hubpet/api"

# 1) Cadastro
curl -s -X POST "$API/usuarios" -H "Content-Type: application/json" -d '{
  "nome": "Usuario Teste", "cpf": "111.222.333-44", "email": "teste@teste.com",
  "telefone": "(11) 99999-0000", "senha": "senha123",
  "aceitaNewsletter": false, "aceitaTermos": true,
  "tipoUsuario": "pessoafisica", "notificacoes": true, "localizacao": false
}'
# esperado: 201 + usuário sem campo "senha"

# 2) Login
curl -s -X POST "$API/usuarios/login" -H "Content-Type: application/json" \
  -d '{"email":"teste@teste.com","senha":"senha123"}'
# esperado: 200 + mesmo usuário

# 3) E-mail duplicado
curl -s -X POST "$API/usuarios" -H "Content-Type: application/json" -d '{
  "nome": "Outro", "cpf": "555.666.777-88", "email": "teste@teste.com",
  "telefone": "(11) 90000-0000", "senha": "outraSenha", "aceitaTermos": true,
  "tipoUsuario": "pessoafisica"
}'
# esperado: 409 { "erro": "email_ja_cadastrado", ... }

# 4) Credenciais de demonstração (seed do schema.sql)
curl -s -X POST "$API/usuarios/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@hubpetshop.com","senha":"123456"}'
curl -s -X POST "$API/usuarios/login" -H "Content-Type: application/json" \
  -d '{"email":"veterinario@hubpetshop.com","senha":"123456"}'
```

No navegador, o roteiro equivalente por tela: abrir `index.html` →
tentar entrar com credencial errada (deve aparecer o snackbar vermelho)
→ ir em "Cadastre-se" → preencher e enviar (deve navegar pra
`inicio.html` já logado) → abrir de novo o cadastro com o mesmo e-mail
(deve mostrar "E-mail já cadastrado! Faça login." em laranja).

---

## 13. Roadmap de implementação sugerido

1. **Fase 1 — Fundação:** `schema.sql`, `config.php`/`db.php`/
   `cors.php`/`helpers.php`, `index.php` roteador, `usuarios.php`
   completo. Front: `tokens.css`/`components.css`, `api-client.js`,
   `session.js`, `index.html` (login) + `cadastro.html`.
2. **Fase 2 — Perfil do dono:** `pets.php`, `enderecos.php` +
   `meus-pets.html`, `cadastrar-pet.html`, `meus-enderecos.html`,
   `cadastrar-endereco.html`, `minha-conta.html`, `dados.html`.
3. **Fase 3 — Catálogo e compras:** `petshops.php`, `produtos.php` +
   `inicio.html`, `petshops.html`, `produtos-petshop.html`,
   `produtos-categoria.html`, `carrinho.html`.
4. **Fase 4 — Agendamento:** `servicos.php`, `servicos_vet.php`,
   `agendamentos.php` + `agendar.html`, `agendamentos.html`,
   `servicos-vet.html`, `home-veterinario.html`.
5. **Fase 5 — Pedidos e polimento:** `pedidos.php` + `meus-pedidos.html`,
   `pagamentos.html`, `busca-usuarios.html`, responsividade mobile,
   revisão de acessibilidade (labels, contraste, foco de teclado).
