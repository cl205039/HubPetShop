# API do HubPet — contrato para implementação

Este documento especifica a API REST que o app Flutter (`lib/services/*.dart`)
espera consumir. O app já está pronto para falar com ela — falta só
implementá-la do lado do servidor seguindo este contrato.

## Decisões de design

### 1. Sem autenticação

Não há login por token/JWT nem sessão de servidor. O app identifica "o
usuário logado" enviando o `usuarioId` diretamente na URL das rotas que
precisam saber de quem é o recurso (ex.: `/usuarios/{usuarioId}/pets`).
O `usuarioId` vem da resposta de `POST /usuarios/login` e fica guardado em
memória no app enquanto a pessoa está logada.

**Isso não é seguro para produção** — qualquer um que souber um `usuarioId`
pode ler/criar dados dele. É aceitável aqui porque a API roda numa rede
local fechada para fins de um projeto acadêmico. Se algum dia isso for
exposto na internet, adicionar autenticação de verdade é obrigatório.

### 2. CORS é obrigatório

O app roda como Flutter **web** no Chrome e faz requisições para um IP
diferente do da própria página (`lib/api_config.dart`). Sem os headers de
CORS corretos, o navegador **bloqueia silenciosamente as respostas** mesmo
que a API funcione perfeitamente (isso é a causa mais provável de "funciona
no Postman/Insomnia mas não no app").

A API precisa:
- Responder toda requisição com o header `Access-Control-Allow-Origin: *`
  (ou a origin específica do app).
- Responder `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`.
- Responder `Access-Control-Allow-Headers: Content-Type`.
- Responder `200` ou `204` (sem corpo) para requisições `OPTIONS` — todo
  `POST`/`PUT`/`DELETE` com corpo JSON dispara uma requisição de
  **preflight** `OPTIONS` antes da requisição real, e o navegador cancela
  tudo se essa resposta não vier certa.

### 3. Formato geral

- **Content-Type**: `application/json; charset=utf-8` em request e response.
- **Nomes de campo em português**, iguais aos já usados no app (`nome`,
  `cpf`, `email`, `senha`, `tipoUsuario`, `preco`, `hora`, `local`,
  `duracao`, `etapa`...) — evita ficar traduzindo campo por campo.
- **IDs**: inteiros autoincrementais, devolvidos no campo `id`. O app aceita
  tanto número quanto string nesse campo, mas prefira número.
- **Datas**: string ISO 8601 (`2026-08-25T14:30:00.000`), exceto o campo
  `data` de Agendamento/Pedido, que é texto livre já formatado para exibição
  (ex. `"Hoje, 14:32"`, `"12/06, 16:20"`) — o app não faz parsing desse
  campo além de mostrar na tela.
- **Erros**: toda resposta de erro (4xx/5xx) deve ter o corpo:
  ```json
  { "erro": "codigo_snake_case", "mensagem": "Descrição legível em português" }
  ```
  O app mostra `mensagem` direto num SnackBar para o usuário.
- **Senha**: o campo `senha` só existe em requests (cadastro, login,
  redefinição). **Nunca** deve voltar em nenhuma resposta da API, nem em
  `GET /usuarios/{id}`.

---

## Usuários

### `POST /usuarios` — cadastro

Request:
```json
{
  "nome": "Maria Silva",
  "cpf": "111.222.333-44",
  "email": "maria@email.com",
  "telefone": "(11) 98888-1111",
  "senha": "maria123",
  "aceitaNewsletter": false,
  "aceitaTermos": true,
  "tipoUsuario": "pessoafisica",
  "notificacoes": true,
  "localizacao": false
}
```
`tipoUsuario` é um de: `"pessoafisica"`, `"pessoajuridica"`, `"veterinario"`.

Response `201`:
```json
{
  "id": 1,
  "nome": "Maria Silva",
  "cpf": "111.222.333-44",
  "email": "maria@email.com",
  "telefone": "(11) 98888-1111",
  "aceitaNewsletter": false,
  "aceitaTermos": true,
  "tipoUsuario": "pessoafisica",
  "notificacoes": true,
  "localizacao": false
}
```
(sem o campo `senha`)

Erros: `409` se o e-mail já existe (`"erro": "email_ja_cadastrado"`); `400`
se faltar campo obrigatório.

### `POST /usuarios/login`

Request: `{ "email": "...", "senha": "..." }`

Response `200`: mesmo formato de usuário do cadastro (sem senha).

Erro `401` se e-mail/senha não confere (`"erro": "credenciais_invalidas"`).

### `POST /usuarios/redefinir-senha`

Request: `{ "email": "...", "novaSenha": "..." }`

Response `200` (sem corpo, ou `{}`).

Erro `404` se o e-mail não está cadastrado (`"erro": "email_nao_cadastrado"`).

### `GET /usuarios/{id}`

Response `200`: usuário (sem senha). `404` se não existir.

### `GET /usuarios?nome=&email=&telefone=&cpf=&tipo=`

Busca por **um** desses parâmetros por vez (o app sempre manda exatamente
um). Sem nenhum parâmetro, devolve todos os usuários (usado só para contar
quantos existem).

- `nome`, `email`, `telefone`, `cpf`: substring, case-insensitive.
- `tipo`: substring, case-insensitive, comparado contra o **rótulo em
  português** do tipo — `"Pessoa Física"`, `"Pessoa Jurídica"`,
  `"Veterinário"` — não contra o valor interno do enum. Ex.: `?tipo=vet`
  deve encontrar usuários com `tipoUsuario: "veterinario"`.

Response `200`: `[ {usuario}, {usuario}, ... ]` (lista, pode ser vazia).

---

## Pets

### `GET /usuarios/{usuarioId}/pets`

Response `200`: lista de pets do usuário.
```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "nome": "Rex",
    "tipo": "Cachorro",
    "raca": "Labrador",
    "idade": "2 anos",
    "peso": "20kg",
    "nascimento": "10/05/2022",
    "sexo": "Macho"
  }
]
```
`idade`, `peso`, `nascimento` são texto livre (não campos numéricos/data) —
é como o formulário de cadastro no app já coleta.

### `POST /usuarios/{usuarioId}/pets`

Request: mesmo formato, sem `id`/`usuarioId`. Response `201`: o pet criado
(com `id` e `usuarioId` preenchidos).

### `PUT /pets/{id}` / `DELETE /pets/{id}`

Não usados pela versão atual do app (só cadastro e listagem), mas fazem
parte do contrato para uma futura tela de editar/remover pet.

---

## Endereços

### `GET /usuarios/{usuarioId}/enderecos`

```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "titulo": "Casa",
    "rua": "Rua das Flores",
    "numero": "123",
    "complemento": "Apto 45",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "principal": false
  }
]
```
`titulo` pode ser `null` (endereço sem apelido).

### `POST /usuarios/{usuarioId}/enderecos`

Request: mesmo formato sem `id`/`usuarioId`. Response `201`: o endereço
criado.

### `DELETE /enderecos/{id}`

Response `204`.

---

## Petshops

### `GET /petshops`

```json
[
  { "id": 1, "nome": "Petshop Bom pra Pet", "nota": 4.8, "distanciaKm": 2.4 },
  { "id": 2, "nome": "Amigos do Pet", "nota": 4.5, "distanciaKm": 0.9 }
]
```
`nota` e `distanciaKm` são **números**, não strings pré-formatadas — o app
formata (`"4.8"`, `"900 m"` / `"2.4 km"`) do lado dele.

### `GET /petshops/{id}`

Um único petshop, mesmo formato.

---

## Produtos e ofertas

Um **produto** é o item de catálogo (nome, descrição, categoria, imagem).
Uma **oferta** é esse produto vendido por um petshop específico, a um
preço. O app nunca lista produtos "soltos" — sempre como ofertas.

### `GET /petshops/{petshopId}/ofertas`

Ofertas de UM petshop (o petshop já é conhecido pela tela que chama isso).

```json
[
  {
    "ofertaId": 10,
    "produtoId": 3,
    "nome": "Ração Golden Fórmula Cães Adultos 15kg",
    "descricao": "Frango e arroz · pelo brilhante e digestão leve",
    "categoria": "racoes",
    "imagem": "assets/images/produtos/racao_golden.png",
    "preco": 189.90
  }
]
```
`categoria` é um de: `"racoes"`, `"petiscos"`, `"higiene"`, `"brinquedos"`.

`imagem` é o caminho de um asset **já embutido no app Flutter**
(`assets/images/produtos/...`) — a API só guarda essa string, não hospeda
a imagem. Se um produto novo precisar de foto, o app precisa ganhar esse
asset separadamente; sem imagem correspondente o app mostra um placeholder
automaticamente.

### `GET /produtos/ofertas?categoria=`

Ofertas de **vários** petshops, para comparação de preço (usado na tela que
agrega por categoria). `categoria` é opcional — sem ela, devolve tudo.

```json
[
  {
    "ofertaId": 10,
    "produtoId": 3,
    "nome": "Ração Golden Fórmula Cães Adultos 15kg",
    "descricao": "Frango e arroz · pelo brilhante e digestão leve",
    "categoria": "racoes",
    "imagem": "assets/images/produtos/racao_golden.png",
    "preco": 189.90,
    "petshopId": 1,
    "petshopNome": "Petshop Bom pra Pet",
    "petshopNota": 4.8,
    "petshopDistanciaKm": 2.4
  }
]
```
Mesmo formato de cima, mais os 4 campos `petshop*` (o petshop dono da
oferta) — é a diferença entre as duas rotas.

---

## Serviços de agendamento (catálogo)

### `GET /servicos`

Catálogo global de serviços que aparecem no fluxo de agendar (banho, tosa,
consulta...) — não depende de usuário nem de petshop.

```json
[
  { "id": 1, "nome": "Banho", "preco": 50.0, "icone": "bathtub" },
  { "id": 2, "nome": "Tosa", "preco": 60.0, "icone": "cut" },
  { "id": 3, "nome": "Banho e Tosa", "preco": 100.0, "icone": "pets" },
  { "id": 4, "nome": "Consulta Veterinária", "preco": 120.0, "icone": "medical_services" },
  { "id": 5, "nome": "Vacina", "preco": 90.0, "icone": "vaccines" }
]
```
`icone` é uma string de um conjunto fixo que o app reconhece: `"bathtub"`,
`"cut"`, `"pets"`, `"medical_services"`, `"vaccines"` — qualquer outro valor
cai num ícone padrão (pata de animal). Para adicionar um serviço com ícone
novo, é preciso primeiro adicionar o mapeamento em `lib/models/servico.dart`.

---

## Serviços do veterinário

CRUD dos serviços que **um veterinário específico** oferece (tela "Meus
Serviços", diferente do catálogo global acima).

### `GET /veterinarios/{veterinarioId}/servicos`

```json
[
  { "id": 1, "veterinarioId": 5, "nome": "Consulta clínica", "preco": 80.0, "duracao": "30 min" }
]
```

### `POST /veterinarios/{veterinarioId}/servicos`

Request: `{ "nome": "...", "preco": 80.0, "duracao": "30 min" }`. Response
`201`: o serviço criado.

### `DELETE /servicos-vet/{id}`

Response `204`.

---

## Agendamentos

### `GET /usuarios/{usuarioId}/agendamentos`

```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "servico": "Banho, Tosa",
    "hora": "09:00",
    "status": "Confirmado",
    "pet": "Meu pet 🐾",
    "local": "Petshop Bom pra Pet",
    "petshopId": 1,
    "data": "2026-08-25T00:00:00.000"
  }
]
```
`status` é um de: `"Confirmado"`, `"Pendente"`, `"Concluído"`.
`servico` vem como os nomes já concatenados numa string (o usuário pode
selecionar mais de um serviço no fluxo de agendar).

### `POST /usuarios/{usuarioId}/agendamentos`

Request: mesmo formato sem `id`/`usuarioId`. Response `201`: o agendamento
criado.

> **Nota de escopo**: o app não pergunta "qual veterinário vai atender" no
> fluxo de agendar — por isso este recurso não tem `veterinarioId`. A tela
> de painel do veterinário (`home_veterinario.dart`) ainda usa uma lista de
> exemplo fixa por esse motivo; ligar isso de verdade exigiria adicionar uma
> etapa de escolha de veterinário no agendamento, fora do escopo desta
> migração.

---

## Pedidos (compras no carrinho)

O carrinho de compras em si **não tem endpoint** — ele é só estado local no
app (`AppData.carrinho`) enquanto a pessoa está montando a compra. Só vira
um registro na API quando o checkout é confirmado.

### `GET /usuarios/{usuarioId}/pedidos`

```json
[
  {
    "id": 1,
    "usuarioId": 1,
    "petshopId": 2,
    "loja": "Mundo Animal",
    "itens": [
      { "nome": "Tapete Higiênico 30un", "quantidade": 1, "precoUnitario": 49.90 },
      { "nome": "Petisco Dreamies", "quantidade": 2, "precoUnitario": 6.45 }
    ],
    "total": 62.80,
    "data": "Ontem, 18:45",
    "etapa": 3
  }
]
```
`etapa`: `0` Confirmado pela clínica/loja · `1` Em preparação · `2` Saiu para
entrega · `3` Entregue. `data` é texto livre já formatado (ver seção
"Formato geral" acima). `loja` é o nome do petshop (`petshopId`), devolvido
já resolvido via JOIN — só pra exibição; não é gravado como texto solto.

### `POST /usuarios/{usuarioId}/pedidos`

Request: envie `petshopId` (o id do petshop, não o nome) em vez de `loja` —
mesmo formato de resposta sem `id`/`usuarioId`, e normalmente com
`etapa: 0`. Response `201`: o pedido criado.

---

## Resumo de rotas

| Método | Rota | Descrição |
|---|---|---|
| POST | `/usuarios` | Cadastro |
| POST | `/usuarios/login` | Login |
| POST | `/usuarios/redefinir-senha` | Redefinir senha |
| GET | `/usuarios/{id}` | Buscar usuário por id |
| GET | `/usuarios?nome=\|email=\|telefone=\|cpf=\|tipo=` | Buscar usuários |
| GET/POST | `/usuarios/{usuarioId}/pets` | Listar / cadastrar pets |
| PUT/DELETE | `/pets/{id}` | Atualizar / remover pet |
| GET/POST | `/usuarios/{usuarioId}/enderecos` | Listar / cadastrar endereços |
| DELETE | `/enderecos/{id}` | Remover endereço |
| GET | `/petshops` | Listar petshops |
| GET | `/petshops/{id}` | Buscar petshop |
| GET | `/petshops/{id}/ofertas` | Ofertas de um petshop |
| GET | `/produtos/ofertas?categoria=` | Ofertas de vários petshops |
| GET | `/servicos` | Catálogo de agendamento |
| GET/POST | `/veterinarios/{id}/servicos` | Listar / cadastrar serviços do vet |
| DELETE | `/servicos-vet/{id}` | Remover serviço do vet |
| GET/POST | `/usuarios/{usuarioId}/agendamentos` | Listar / criar agendamento |
| GET/POST | `/usuarios/{usuarioId}/pedidos` | Listar / criar pedido |

---

## Do lado do Flutter

- **IP/porta da API**: `lib/api_config.dart` — é o único lugar do projeto
  com o endereço escrito. Se a API mudar de máquina/porta, só editar
  `ApiConfig.baseUrl` ali.
- **Cliente HTTP**: `lib/api_client.dart` — todas as chamadas passam por
  ele; erros de rede, timeout (10s) e status HTTP de erro viram uma
  `ApiException` só, com `mensagem` pronta pra mostrar na tela.
- **Modelos** (`fromJson`/`toJson`): `lib/models/*.dart`.
- **Chamadas à API** (um arquivo por domínio): `lib/services/*.dart`.
