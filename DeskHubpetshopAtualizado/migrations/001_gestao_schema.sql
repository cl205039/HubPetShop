-- Migração aditiva para o painel de gestão (admin + parceiro) do desktop HubPet.
-- Só ADD COLUMN / CREATE TABLE / MODIFY COLUMN (adicionando um valor ao enum
-- existente) — nenhum DROP, nenhuma coluna existente é removida ou renomeada.
-- Não afeta o contrato da API PHP usada pelo app Flutter do consumidor.

USE hubpetshop;

ALTER TABLE parceiros ADD COLUMN bloqueado TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE produtos
  ADD COLUMN parceiro_id INT NULL,
  ADD COLUMN estoque INT NOT NULL DEFAULT 0,
  ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1,
  ADD CONSTRAINT fk_produtos_parceiro FOREIGN KEY (parceiro_id) REFERENCES parceiros(id) ON DELETE SET NULL;

ALTER TABLE pedidos
  ADD COLUMN parceiro_id INT NULL,
  ADD COLUMN criado_em DATETIME NULL,
  ADD CONSTRAINT fk_pedidos_parceiro FOREIGN KEY (parceiro_id) REFERENCES parceiros(id) ON DELETE SET NULL;

ALTER TABLE agendamentos
  ADD COLUMN parceiro_id INT NULL,
  ADD COLUMN data_hora DATETIME NULL,
  MODIFY COLUMN status ENUM('Pendente','Confirmado','Concluído','Cancelado') NOT NULL DEFAULT 'Pendente',
  ADD CONSTRAINT fk_agendamentos_parceiro FOREIGN KEY (parceiro_id) REFERENCES parceiros(id) ON DELETE SET NULL;

ALTER TABLE usuarios ADD COLUMN ativo TINYINT(1) NOT NULL DEFAULT 1;

CREATE TABLE servicos_parceiro (
  id INT AUTO_INCREMENT PRIMARY KEY,
  parceiro_id INT NOT NULL,
  nome VARCHAR(255) NOT NULL,
  preco DECIMAL(10,2) NOT NULL,
  duracao VARCHAR(50),
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  FOREIGN KEY (parceiro_id) REFERENCES parceiros(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
