-- Schema do banco `hubpetshop` para o contrato descrito em docapi.md.
--
-- O banco já existe com tabelas extras de um escopo anterior (parceiros,
-- categorias, admins, avaliacoes, pagamentos, itens_pedido, notificacoes,
-- horarios_funcionamento, enderecos_parceiros, enderecos_usuarios) que não
-- fazem parte do contrato atual e não são tocadas por este script.
--
-- `petshops`, `servicos_vet`, `pedido_itens` e `enderecos` já tinham
-- exatamente o schema que o contrato exige e guardam dados criados pela API
-- (cadastros de usuário), então usam CREATE TABLE IF NOT EXISTS (idempotente,
-- preserva dados existentes).
-- `usuarios`, `pets`, `produtos`, `servicos`, `agendamentos`, `pedidos` e
-- `ofertas` são sempre recriadas do zero: as 6 primeiras porque tinham schema
-- incompatível com o contrato, e `ofertas` porque só guarda catálogo fixo
-- (sem dado gerado pelo app) e precisa ficar em sincronia com `produtos`,
-- que é sempre recriada.

USE hubpetshop;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS pets;
DROP TABLE IF EXISTS produtos;
DROP TABLE IF EXISTS servicos;
DROP TABLE IF EXISTS agendamentos;
DROP TABLE IF EXISTS pedidos;
DROP TABLE IF EXISTS ofertas;

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cpf VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefone VARCHAR(30),
    senha VARCHAR(255) NOT NULL,
    aceita_newsletter TINYINT(1) NOT NULL DEFAULT 0,
    aceita_termos TINYINT(1) NOT NULL DEFAULT 0,
    tipo_usuario ENUM('pessoafisica', 'pessoajuridica', 'veterinario') NOT NULL,
    notificacoes TINYINT(1) NOT NULL DEFAULT 1,
    localizacao TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE pets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    tipo VARCHAR(100),
    raca VARCHAR(100),
    idade VARCHAR(50),
    peso VARCHAR(50),
    nascimento VARCHAR(50),
    sexo VARCHAR(20),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    categoria ENUM('racoes', 'petiscos', 'higiene', 'brinquedos') NOT NULL,
    imagem VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE servicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    icone VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    servico VARCHAR(500),
    hora VARCHAR(20),
    status ENUM('Confirmado', 'Pendente', 'Concluído') NOT NULL DEFAULT 'Pendente',
    pet VARCHAR(255),
    local VARCHAR(255),
    petshop_id INT NULL,
    data VARCHAR(50),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (petshop_id) REFERENCES petshops(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    loja VARCHAR(255),
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    data VARCHAR(50),
    etapa TINYINT NOT NULL DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS petshops (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    nota DECIMAL(2,1) NOT NULL DEFAULT 0,
    distancia_km DECIMAL(6,2) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE ofertas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    petshop_id INT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (petshop_id) REFERENCES petshops(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS servicos_vet (
    id INT AUTO_INCREMENT PRIMARY KEY,
    veterinario_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    duracao VARCHAR(50),
    FOREIGN KEY (veterinario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS pedido_itens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    nome VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS enderecos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    titulo VARCHAR(100) NULL,
    rua VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(255),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    principal TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Catálogo fixo: petshops (só insere se a tabela estava vazia)
INSERT INTO petshops (nome, nota, distancia_km)
SELECT * FROM (SELECT 'Petshop Bom pra Pet' AS nome, 4.8 AS nota, 2.4 AS distancia_km) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM petshops);

INSERT INTO petshops (nome, nota, distancia_km)
SELECT * FROM (SELECT 'Amigos do Pet' AS nome, 4.5 AS nota, 0.9 AS distancia_km) AS tmp
WHERE (SELECT COUNT(*) FROM petshops) < 2;

-- Catálogo fixo: produtos
INSERT INTO produtos (nome, descricao, categoria, imagem) VALUES
('Ração Golden Fórmula Cães Adultos 15kg', 'Frango e arroz · pelo brilhante e digestão leve', 'racoes', 'assets/images/produtos/racao_golden.png'),
('Ração Whiskas Gatos Adultos 10kg', 'Carne e frango · sabor irresistível', 'racoes', 'assets/images/produtos/racao_whiskas.png'),
('Petisco Dreamies', 'Snack crocante para gatos', 'petiscos', 'assets/images/produtos/petisco_dreamies.png'),
('Tapete Higiênico 30un', 'Alta absorção · com gel', 'higiene', 'assets/images/produtos/tapete_higienico.png'),
('Shampoo Neutro Pet Clean 500ml', 'Limpeza suave para todos os pelos', 'higiene', 'assets/images/produtos/shampoo_pet_clean.png'),
('Bolinha de Borracha', 'Brinquedo resistente para cães', 'brinquedos', 'assets/images/produtos/bolinha_borracha.png');

-- Catálogo fixo: ofertas (produto vendido por um petshop, a um preço)
INSERT INTO ofertas (produto_id, petshop_id, preco) VALUES
(1, 1, 189.90),
(1, 2, 199.90),
(2, 1, 159.90),
(3, 2, 12.90),
(4, 1, 49.90),
(4, 2, 45.90),
(5, 1, 24.90),
(6, 2, 18.50);

-- Catálogo fixo: serviços de agendamento
INSERT INTO servicos (nome, preco, icone) VALUES
('Banho', 50.0, 'bathtub'),
('Tosa', 60.0, 'cut'),
('Banho e Tosa', 100.0, 'pets'),
('Consulta Veterinária', 120.0, 'medical_services'),
('Vacina', 90.0, 'vaccines');
