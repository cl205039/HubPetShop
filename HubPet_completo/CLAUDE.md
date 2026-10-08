# CLAUDE.md

Orientações para o Claude Code (claude.ai/code) ao trabalhar neste repositório.

## Visão geral

**HubPet** (pacote `flutter_application_home`) é um app **Flutter** — um
marketplace de serviços para pets ("Projeto Integrador" acadêmico). Conecta
**donos de pets** a **petshops e veterinários**: login/cadastro, agendamento de
serviços (banho, tosa, vet), gestão de pets e endereços, e um painel separado
para o veterinário.

A interface é toda em **português (pt-BR)**. O app está configurado para rodar
na **web** (somente a pasta `web/` existe; não há `android/`, `ios/` etc.).

## Comandos

```powershell
flutter pub get              # instala dependências
flutter run -d chrome        # executa no navegador (alvo principal)
flutter analyze              # lint estático (usa flutter_lints)
flutter test                 # testes (não há testes escritos ainda)
flutter build web            # build de produção web
```

> Pré-requisitos: Flutter SDK com Dart `^3.5.0`. Dependências externas:
> `cupertino_icons` e `http` (cliente HTTP para a API) — todo o resto é
> Flutter/Material puro.

## Arquitetura

- **Backend real via API REST, sem autenticação.** O app consome uma API
  HTTP própria rodando na rede local (endereço em `lib/api_config.dart` —
  **único lugar a editar se o IP/porta mudar**). O contrato completo de
  rotas/JSON está documentado em `docs/API.md`. Sem login por token/sessão:
  o "usuário logado" é identificado passando `usuarioId` na URL das rotas
  que precisam disso.
  - `lib/api_client.dart` — cliente HTTP fino (timeout, parsing de erro em
    `ApiException`), usado por todos os `lib/services/*.dart`. Corpo de
    `POST`/`PUT` é serializado só com ASCII (`_jsonAscii` → acentos viram
    `\uXXXX`) — contorna a API quebrar o parse com UTF-8 cru; ver `docapi.md`.
  - `lib/models/*.dart` — um arquivo por entidade, com `fromJson`/`toJson`.
  - `lib/services/*.dart` — um arquivo por domínio (usuários, pets,
    endereços, petshops, produtos, serviços, serviços do vet, agendamentos,
    pedidos), cada um encapsulando as chamadas HTTP daquele domínio.
  - `lib/app_data.dart` **não é mais "banco de dados"** — guarda só a sessão
    (`AppData.usuarioLogado`) e o carrinho de compras (`AppData.carrinho`,
    estado local até o checkout virar um Pedido de verdade via API).
  - Padrão de tela: `initState` dispara a chamada assíncrona ao service
    correspondente → `setState` alterna entre carregando / erro (com botão
    "Tentar novamente") / dados — sem introduzir Provider/Riverpod/Bloc.
    Veja `lib/meuspets.dart` como referência do padrão.
  - **`lib/recarrega_ao_voltar.dart` (mixin `RecarregaAoVoltar`):** as telas que
    consultam a API não buscam só uma vez — usam
    `with RouteAware, RecarregaAoVoltar` e implementam
    `void recarregar() => _carregarXxx();`. Assim, além do fetch no `initState`,
    a consulta é refeita toda vez que a tela volta a ficar visível (o usuário
    fechou outra tela que estava por cima). Depende do `routeObserver` global
    (`route_observer.dart` / `main.dart`). Já aplicado em: `inicio`,
    `lista_petshops`, `meuspets`, `meus_enderecos`, `endereco` (Pedidos),
    `agendamentos`, `produtos_categoria`, `produtos_petshop`, `servicos_vet`,
    `busca_usuarios`. **Fora:** `agendar` (assistente de passos — não recarrega
    p/ não perder o progresso) e telas sem consulta (`dados`, `home`, perfis).
  - `home_veterinario.dart` mantém um mock local de "atendimentos do dia"
    (marcado com `// TODO(api)`) — agendamentos não guardam qual veterinário
    atendeu, então não há como popular isso com dados reais sem também
    mudar o fluxo de agendamento.
- **Sem gerenciamento de estado / DI / rotas nomeadas.** A navegação é feita
  manualmente com `Navigator.push(MaterialPageRoute(...))`. O estado de tela usa
  `StatefulWidget` + `setState`. Não use Provider/Riverpod/Bloc a menos que seja
  pedido — siga o padrão existente.
- **Uma tela ≈ um arquivo** em `lib/` (sem subpastas). Cada arquivo expõe uma
  página `Widget` pública e, às vezes, widgets auxiliares privados (prefixados
  com `_`) no mesmo arquivo.
- **Ponto de entrada:** `lib/main.dart` → `HubPetApp` (MaterialApp, Material 3)
  → `home: SplashPage()` (`lib/splash.dart`): splash de 4 s e então
  `pushReplacement` direto para `InicioPage` (dono de pet). **O app abre sem
  pedir login.**
- **Login sob demanda:** o login só é exigido ao concluir uma ação que precisa
  de dono — fechar a compra (`carrinho.dart` → `_finalizar`) ou confirmar um
  agendamento (`pagamentos.dart` → `_confirmar`). Se não houver
  `AppData.usuarioLogado`, chama **`Telainicio.solicitarLogin(context, acao:
  ...)`** (static): mostra um `AlertDialog` "Você precisa fazer login para
  \<ação\>" com os botões "Agora não" / "FAZER LOGIN"; só quando o usuário
  confirma é que abre `Telainicio(voltarAposLogin: true)`. Ao logar/cadastrar com
  sucesso a tela faz `Navigator.pop(context, true)`, `solicitarLogin` devolve
  `true` e a ação continua de onde parou; qualquer cancelamento (diálogo ou tela
  de login) devolve `false` e aborta a ação, sem criar nada. O flag
  `voltarAposLogin` é repassado por `EscolhaPage` e `CadastroPage` para o mesmo
  comportamento quando o cliente cria conta no meio do fluxo. `InicioPage` mostra
  um botão laranja **"Entrar"** no cabeçalho enquanto não há usuário logado;
  depois do login o cabeçalho passa a "Olá, <primeiro nome>".
- **`lib/rodape_nav.dart` — rodapé de atalhos (`RodapeNav`):** barra de ícones
  fixa (Início · Petshops · Agenda · Pedidos · Meus dados) adicionada como
  `bottomNavigationBar: const RodapeNav()` em **todas as telas de navegação do
  dono de pet**: `inicio`, `home`, `lista_petshops`, `produtos_categoria`,
  `produtos_petshop`, `endereco` (Pedidos), `agendamentos`, `dados`, `meuspets`,
  `meus_enderecos`. **Não** aparece nos fluxos de checkout (`carrinho`,
  `pagamentos`), no assistente `agendar`, nos formulários (`cadastrar_*`), na
  autenticação (`splash`, `telainicio`, `escolha`, `telacadastro`, `nova_senha`)
  nem nas telas do veterinário. Não tem "aba selecionada" — é só atalho:
  "Início" faz `popUntil(isFirst)`, os outros `Navigator.push`. Cada tela que o
  usa passa `bottom: false` no `SafeArea` do corpo. Meus dados / Meus Pedidos /
  Meus Agendamentos / Petshops foram **retirados da lista** do menu de
  `home.dart` (que agora só tem Meu pet, Meus Endereços, Sobre o Projeto,
  Sobre Nós e Sair).
- **`lib/route_observer.dart`:** `routeObserver` global registrado em
  `MaterialApp.navigatorObservers`. `InicioPage` é `RouteAware` e faz `setState`
  no `didPopNext()` para reler `AppData.usuarioLogado` quando volta ao topo da
  pilha (o login/cadastro pode ter acontecido em outra tela). É o único uso hoje
  — não é um mecanismo geral de estado.
- **Bifurcação por tipo de usuário:** quando `Telainicio` é usada como tela cheia
  (logout, sem `voltarAposLogin`), após o login redireciona para
  `HomeVeterinarioPage` se `tipoUsuario == 'veterinario'`, senão para
  `InicioPage` (dono de pet).

## Mapa das telas (`lib/`)

| Arquivo | Página | Função |
|---|---|---|
| `main.dart` | `HubPetApp` | Raiz do MaterialApp / tema |
| `splash.dart` | `SplashPage` | Splash de 4 s na abertura → `InicioPage` |
| `rodape_nav.dart` | `RodapeNav` | Rodapé de atalhos por ícone; usado como `bottomNavigationBar` nas telas de navegação |
| `route_observer.dart` | `routeObserver` | Observer global de rotas (registrado no `MaterialApp`) |
| `recarrega_ao_voltar.dart` | `RecarregaAoVoltar` (mixin) | Telas que refazem a consulta à API ao voltarem a ficar visíveis |
| `telainicio.dart` | `Telainicio` | Login (sob demanda no checkout; ou tela cheia no logout) |
| `carrinho.dart` | `CarrinhoPage` | Checkout em 3 passos (itens/endereço/pagamento); pede login em `_finalizar` |
| `escolha.dart` | `EscolhaPage` | Tela de escolha de perfil (atualmente só "Dono de Pet") |
| `telacadastro.dart` | `CadastroPage` | Cadastro de dono de pet |
| `nova_senha.dart` | `NovaSenhaPage` | Recuperação de senha |
| `inicio.dart` | `InicioPage` | Home do dono de pet (menu/serviços) + `RodapeNav` |
| `home.dart` / `home_vet.dart` | `Home` / `HomeVet` | "Minha Conta" (perfil); `Home` tem `RodapeNav` + menu enxuto |
| `home_veterinario.dart` | `HomeVeterinarioPage` | Painel do veterinário |
| `dados.dart` / `dados_vet.dart` | `Dados` / `DadosVet` | Exibe dados do perfil |
| `meuspets.dart` | `MeusPets` | Lista/cadastro de pets |
| `cadastrar_pet.dart` | `CadastroPetPage` | Formulário de novo pet |
| `endereco.dart` | `PedidosPage` | "Meus Pedidos" (nome do arquivo não bate com a página — legado) |
| `meus_enderecos.dart` / `cadastrar_endereco.dart` | `MeusEnderecosPage` / `CadastrarEnderecoPage` | Endereços salvos |
| `agendar.dart` | `AgendarPage` | Agendar serviço (4 passos) → `PagamentosPage` |
| `agendamentos.dart` | `AgendamentosPage` | Lista de agendamentos |
| `servicos_vet.dart` | `ServicosVetPage` | Serviços oferecidos pelo vet |
| `lista_petshops.dart` | `ListaPetshopsPage` | Busca/lista de petshops |
| `busca_usuarios.dart` | `BuscaUsuariosPage` | Busca de usuários |
| `pagamentos.dart` | `PagamentosPage` | Confirmação do agendamento (pagar na consulta); pede login em `_confirmar` |
| `descricao_projeto.dart` | `DescricaoProjetoPage` | "Sobre o Projeto" |
| `sobre_nos.dart` | `SobreNosPage` | "Sobre Nós" (equipe) |
| `app_data.dart` | `AppData` / `Usuario` (re-exportado) | Sessão (usuário logado) + carrinho |
| `api_config.dart` | `ApiConfig` | Endereço da API — editar aqui se o IP mudar |
| `api_client.dart` | `ApiClient` / `ApiException` | Cliente HTTP usado pelos services |
| `models/*.dart` | — | Modelos com `fromJson`/`toJson`, um por entidade |
| `services/*.dart` | — | Chamadas HTTP, um arquivo por domínio |
| `docs/API.md` | — | Contrato de rotas/JSON da API (implementação fica a cargo do backend) |

## Credenciais de demonstração

Mostradas na própria tela de login (`telainicio.dart`):
- Dono de pet: `admin@hubpetshop.com` / `123456`
- Veterinário: `veterinario@hubpetshop.com` / `123456`

## Convenções

- **Idioma:** nomes de classes/arquivos/variáveis e textos de UI em
  português. Mantenha esse padrão.
- **Tema:** cor primária roxo `Color(0xFF6A0DAD)`, secundária laranja
  (`Colors.orange`). Telas usam um `LinearGradient` roxo
  (`0xFF6A0DAD` → `0xFF9C27B0`) no fundo. Reaproveite essas cores em telas novas.
- **Lints:** `analysis_options.yaml` inclui `package:flutter_lints`. Rode
  `flutter analyze` antes de finalizar mudanças.
- **Assets:** imagens em `assets/images/` (logo: `imagem.jpg.png`); declaradas
  em `pubspec.yaml`. Ao adicionar assets, registre-os lá.
