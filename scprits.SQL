-- Garante que está usando a base de dados correta
-- CREATE DATABASE the_office_papelaria;

-- 1. Tabela de Usuários (Clientes e Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'cliente', -- 'admin' ou 'cliente'
    situacao INT DEFAULT 1              -- 1 para ativo, 0 para inativo
);

-- 2. Tabela de Produtos (Estoque da Papelaria)
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

-- 3. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'pago', 'enviado', 'cancelado'
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INT REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL
);

-- Insere um usuário administrador inicial para acesso ao /dashboard
-- Dados de acesso: admin@papelaria.com | senha: admin123
INSERT INTO usuarios (nome, email, senha, tipo, situacao) 
VALUES ('Administrador', 'admin@papelaria.com', 'admin123', 'admin', 1)
ON CONFLICT (email) DO NOTHING;
