-- ============================================================================
-- SCRIPT COMPLETO DE CRIAÇÃO E POVOAMENTO - THE OFFICE PAPELARIA
-- ============================================================================

-- 1. ESTRUTURA DAS TABELAS
-- ----------------------------------------------------------------------------

-- Tabela de Usuários (Clientes e Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo VARCHAR(20) DEFAULT 'cliente', -- 'admin' ou 'cliente'
    situacao INT DEFAULT 1              -- 1 para ativo, 0 para inativo
);

-- Tabela de Produtos (Estoque da Papelaria)
CREATE TABLE IF NOT EXISTS produtos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque INT NOT NULL DEFAULT 0,
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT TRUE
);

-- Tabela de Pedidos (Cabeçalho das Vendas)
CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'pendente', -- 'pendente', 'pago', 'enviado', 'cancelado'
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Itens do Pedido (Detalhamento)
CREATE TABLE IF NOT EXISTS pedido_itens (
    id SERIAL PRIMARY KEY,
    pedido_id INT REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id INT REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10,2) NOT NULL
);


-- 2. CADASTRO DE USUÁRIO ADMINISTRADOR
-- ----------------------------------------------------------------------------
-- Credenciais: admin@papelaria.com | senha: admin123
INSERT INTO usuarios (nome, email, senha, tipo, situacao) 
VALUES ('Administrador', 'admin@papelaria.com', 'admin123', 'admin', 1)
ON CONFLICT (email) DO NOTHING;


-- 3. CADASTRO DOS 15 PRODUTOS DA PAPELARIA
-- ----------------------------------------------------------------------------
INSERT INTO produtos (nome, preco, estoque, imagem_url, ativo) 
VALUES 
    ('Caderno Espiral Universitário 10 Matérias', 29.90, 45, '/IMG/Landing/caderno-10-materias.png', TRUE),
    ('Caneta Esferográfica Azul 0.7mm (Caixa c/ 12)', 18.50, 60, '/IMG/Landing/caneta-azul.png', TRUE),
    ('Bloco de Notas Adesivas Post-it Amarelo', 9.90, 80, '/IMG/Landing/postit-amarelo.png', TRUE),
    ('Marcador de Texto Neon Amarelo', 5.50, 100, '/IMG/Landing/grifapen-amarelo.png', TRUE),
    ('Lápis Preto HB Nº 2 (Caixa c/ 12)', 12.00, 50, '/IMG/Landing/lapis-hb.png', TRUE),
    ('Borracha Escolar Branca com Capa Plastificada', 3.20, 120, '/IMG/Landing/borracha-branca.png', TRUE),
    ('Apontador de Metal com Depósito', 7.80, 40, '/IMG/Landing/apontador.png', TRUE),
    ('Tesoura Escolar Sem Ponta Inox 13cm', 8.90, 35, '/IMG/Landing/tesoura-inox.png', TRUE),
    ('Cola em Bastão 21g Não Tóxica', 6.50, 75, '/IMG/Landing/cola-bastao.png', TRUE),
    ('Régua Acrílica Transparente 30cm', 4.50, 90, '/IMG/Landing/regua-30cm.png', TRUE),
    ('Estojo Escolar Duplo Tecido Oxford', 24.90, 25, '/IMG/Landing/estojo-duplo.png', TRUE),
    ('Mochila Escolar Básica Resistente', 119.90, 15, '/IMG/Landing/mochila-basica.png', TRUE),
    ('Grampeador de Mesa de Metal para 20 Folhas', 34.90, 20, '/IMG/Landing/grampeador-mesa.png', TRUE),
    ('Organizador de Mesa para Escritório em Aço', 42.00, 18, '/IMG/Landing/organizador-mesa.png', TRUE),
    ('Fita Corretiva 5mm x 6m', 11.50, 55, '/IMG/Landing/fita-corretiva.png', TRUE);


-- 4. POVOAMENTO DE PEDIDOS E VENDAS PARA O DASHBOARD
-- ----------------------------------------------------------------------------
-- Insere os Pedidos
INSERT INTO pedidos (usuario_id, total, status, criado_em)
VALUES 
    (1, 48.40, 'pago', NOW() - INTERVAL '2 days'),
    (1, 129.80, 'pago', NOW() - INTERVAL '1 day'),
    (1, 35.50, 'pendente', NOW()),
    (1, 154.80, 'enviado', NOW() - INTERVAL '3 days'),
    (1, 18.50, 'cancelado', NOW() - INTERVAL '5 days');

-- Insere os Itens de cada Pedido
INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario)
VALUES 
    -- Itens do Pedido 1
    (1, 1, 1, 29.90),
    (1, 2, 1, 18.50),
    
    -- Itens do Pedido 2
    (2, 12, 1, 119.90),
    (2, 3, 1, 9.90),
    
    -- Itens do Pedido 3
    (3, 11, 1, 24.90),
    (3, 9, 1, 6.50),
    (3, 6, 1, 4.10),
    
    -- Itens do Pedido 4
    (4, 14, 3, 42.00),
    (4, 13, 1, 28.80),
    
    -- Itens do Pedido 5
    (5, 2, 1, 18.50);
