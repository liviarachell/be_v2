-- lêBrasil: ajustes compatíveis com o esquema existente (MySQL 8.0+).
-- Faça backup antes de executar. Esta migração não apaga tabelas nem registros.
-- Execute uma única vez no banco mydb, depois de confirmar que o dump corresponde ao ambiente.

USE `mydb`;

-- Hashes bcrypt ocupam 60 caracteres; 255 também permite futuras mudanças.
ALTER TABLE `usuario`
  MODIFY COLUMN `senha1` VARCHAR(255) NOT NULL,
  MODIFY COLUMN `senha2` VARCHAR(255) NOT NULL;

ALTER TABLE `login`
  MODIFY COLUMN `senha` VARCHAR(255) NOT NULL;

-- Senhas não devem ser únicas: usuários diferentes podem compartilhar uma senha.
ALTER TABLE `usuario`
  DROP INDEX `senha1_UNIQUE`,
  DROP INDEX `senha2_UNIQUE`;

ALTER TABLE `login`
  DROP INDEX `senha_UNIQUE`;

-- O título pode se repetir para usuários diferentes. O backend também impede
-- duplicatas para o mesmo usuário, mantendo a regra de negócio no lugar correto.
ALTER TABLE `livros`
  DROP INDEX `titulo_UNIQUE`,
  ADD INDEX `idx_livros_titulo` (`titulo`);

-- Índices de apoio para as consultas mais frequentes.
ALTER TABLE `login`
  ADD INDEX `idx_login_usuario_cadastro` (`usuario_idcadastro`);

ALTER TABLE `livros`
  ADD INDEX `idx_livros_usuario` (`usuario_idusuario`);
