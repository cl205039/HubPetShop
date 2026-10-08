CREATE DATABASE IF NOT EXISTS projeto_pi;
USE projeto_pi;

CREATE TABLE IF NOT EXISTS parceiros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    telefone VARCHAR(20),
    endereco TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exemplo de inserção
INSERT INTO parceiros (nome, cnpj, email, telefone, endereco) VALUES 
('Loja Exemplo 1', '00.000.000/0001-00', 'contato@loja1.com', '(11) 99999-9999', 'Rua das Flores, 123'),
('Loja Exemplo 2', '11.111.111/0001-11', 'contato@loja2.com', '(11) 88888-8888', 'Av. Principal, 456');
