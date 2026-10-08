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
  tipo_usuario      ENUM('pessoafisica','pessoajuridica') NOT NULL,
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

-- Serviços de agendamento cadastrados por cada petshop (banho, tosa, consulta...).
-- Só aparece pra agendar o que o próprio petshop cadastrou.
CREATE TABLE servicos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  petshop_id  INT NOT NULL,
  nome        VARCHAR(100)  NOT NULL,
  preco       DECIMAL(10,2) NOT NULL,
  icone       VARCHAR(50)   NOT NULL DEFAULT 'pets',
  FOREIGN KEY (petshop_id) REFERENCES petshops(id) ON DELETE CASCADE
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
  petshop_id  INT NOT NULL,
  total       DECIMAL(10,2) NOT NULL,
  data        VARCHAR(50)   NOT NULL, -- texto livre já formatado, igual ao contrato
  etapa       TINYINT       NOT NULL DEFAULT 0,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (petshop_id) REFERENCES petshops(id) ON DELETE CASCADE
);

CREATE TABLE itens_pedido (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id        INT NOT NULL,
  nome             VARCHAR(200)  NOT NULL,
  quantidade       INT           NOT NULL DEFAULT 1,
  preco_unitario   DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
);

-- ── Seed: usuário de demonstração — senha "123456" com hash bcrypt real.
INSERT INTO usuarios (nome, cpf, email, telefone, senha_hash, aceita_termos, tipo_usuario)
VALUES
  ('Administrador HubPet', '000.000.000-00', 'admin@hubpetshop.com', '(11) 90000-0000',
   '$2y$10$lceWjpgdi2ljcjDQopy.XOJf6VuYuH2zK4YOEbrGNDxrXRn6swO8O', 1, 'pessoafisica');

-- ── Seed: petshops de exemplo.
INSERT INTO petshops (id, nome, nota, distancia_km) VALUES
  (1, 'Petshop Bom pra Pet', 4.8, 2.4),
  (2, 'Amigos do Pet', 4.5, 0.9);

-- ── Seed: serviços cadastrados por cada petshop (igual ao exemplo de docs/API.md).
-- Um petshop sem linha aqui simplesmente não tem serviço pra agendar.
INSERT INTO servicos (petshop_id, nome, preco, icone) VALUES
  (1, 'Banho', 50.0, 'bathtub'),
  (1, 'Tosa', 60.0, 'cut'),
  (1, 'Banho e Tosa', 100.0, 'pets'),
  (1, 'Consulta Veterinária', 120.0, 'medical_services'),
  (2, 'Banho', 55.0, 'bathtub'),
  (2, 'Vacina', 90.0, 'vaccines');

-- ── Seed: catálogo de produtos (uma linha por produto, uma categoria das
-- 4 usadas na grade de categorias da Home: racoes, petiscos, higiene, brinquedos).
INSERT INTO produtos (id, nome, descricao, categoria, imagem) VALUES
  (1, 'Ração Premium Adulto 15kg', 'Ração completa para cães adultos de todas as raças', 'racoes', NULL),
  (2, 'Ração Filhote 10kg', 'Alimento balanceado para filhotes até 12 meses', 'racoes', NULL),
  (3, 'Ração para Gatos Castrados 3kg', 'Fórmula com controle de peso', 'racoes', NULL),
  (4, 'Petisco Ossinho Natural', 'Petisco mastigável para higiene bucal', 'petiscos', NULL),
  (5, 'Snack de Frango Desidratado', 'Petisco natural rico em proteína', 'petiscos', NULL),
  (6, 'Shampoo Neutro 500ml', 'Shampoo hipoalergênico para pele sensível', 'higiene', NULL),
  (7, 'Tapete Higiênico (30 unidades)', 'Alta absorção com gel indicador', 'higiene', NULL),
  (8, 'Bola de Borracha Resistente', 'Brinquedo para mastigar, não tóxico', 'brinquedos', NULL),
  (9, 'Arranhador para Gatos', 'Estrutura de sisal com bolinha', 'brinquedos', NULL);

-- ── Seed: ofertas (mesmo produto pode ser vendido por mais de um petshop,
-- cada um com seu preço).
INSERT INTO ofertas (produto_id, petshop_id, preco) VALUES
  (1, 1, 189.90), (2, 1, 129.90), (4, 1, 14.90), (6, 1, 24.90), (8, 1, 19.90),
  (1, 2, 179.90), (3, 2, 89.90), (5, 2, 12.90), (7, 2, 39.90), (9, 2, 49.90);
