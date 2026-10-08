-- Migração aditiva: categorias dinâmicas + preço em produtos do parceiro.
-- Não remove nem quebra nada usado pela API do app Flutter (que só LÊ
-- produtos.categoria, nunca insere nela).

USE hubpetshop;

ALTER TABLE produtos
  MODIFY COLUMN categoria ENUM('racoes','petiscos','higiene','brinquedos') NULL,
  ADD COLUMN categoria_id INT NULL,
  ADD COLUMN preco DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD CONSTRAINT fk_produtos_categoria FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL;

INSERT INTO categorias (nome, tipo) VALUES
  ('Rações', 'produto'),
  ('Petiscos', 'produto'),
  ('Higiene e Limpeza', 'produto'),
  ('Brinquedos', 'produto'),
  ('Acessórios', 'produto'),
  ('Medicamentos e Suplementos', 'produto');

UPDATE produtos p
JOIN categorias c ON c.tipo = 'produto' AND c.nome = 'Brinquedos'
SET p.categoria_id = c.id
WHERE p.categoria = 'brinquedos' AND p.parceiro_id IS NOT NULL;
