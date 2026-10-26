const express = require('express');
const router = express.Router();
const BD = require('../db');

// Catálogo de Produtos da Papelaria
router.get('/catalogo', async (req, res) => {
    try {
        const produtos = await BD.query(`
            SELECT id, nome, preco, estoque, imagem_url 
            FROM produtos 
            WHERE ativo = true 
            ORDER BY id DESC
        `);

        res.render('produtos', { produtos: produtos.rows });
    } catch (erro) {
        console.error('Erro ao carregar catálogo:', erro);
        res.status(500).send('Erro ao carregar os produtos');
    }
});

// Adicionar produto ao carrinho (guardado na sessão)
router.post('/carrinho/adicionar', (req, res) => {
    const { produtoId, quantidade } = req.body;
    const qtd = parseInt(quantidade) || 1;

    if (!req.session.carrinho) {
        req.session.carrinho = {};
    }

    req.session.carrinho[produtoId] = (req.session.carrinho[produtoId] || 0) + qtd;
    res.redirect('/carrinho');
});

// Exibir Carrinho de Compras
router.get('/carrinho', async (req, res) => {
    try {
        const carrinho = req.session.carrinho || {};
        const ids = Object.keys(carrinho);

        if (ids.length === 0) {
            return res.render('carrinho', { itens: [], total: 0 });
        }

        const resultado = await BD.query(
            `SELECT id, nome, preco, imagem_url FROM produtos WHERE id = ANY($1::int[])`,
            [ids.map(Number)]
        );

        let total = 0;
        const itens = resultado.rows.map(prod => {
            const qtd = carrinho[prod.id];
            const subtotal = Number(prod.preco) * qtd;
            total += subtotal;
            return { ...prod, quantidade: qtd, subtotal };
        });

        res.render('carrinho', { itens, total });
    } catch (erro) {
        console.error('Erro ao abrir carrinho:', erro);
        res.status(500).send('Erro ao abrir carrinho');
    }
});

// Remover item do carrinho
router.post('/carrinho/remover', (req, res) => {
    const { produtoId } = req.body;
    if (req.session.carrinho && req.session.carrinho[produtoId]) {
        delete req.session.carrinho[produtoId];
    }
    res.redirect('/carrinho');
});

// Finalizar Pedido (Checkout)
router.post('/checkout', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const carrinho = req.session.carrinho || {};
    const ids = Object.keys(carrinho);

    if (ids.length === 0) {
        return res.redirect('/catalogo');
    }

    try {
        const produtos = await BD.query(
            `SELECT id, preco FROM produtos WHERE id = ANY($1::int[])`,
            [ids.map(Number)]
        );

        let total = 0;
        produtos.rows.forEach(p => {
            total += Number(p.preco) * carrinho[p.id];
        });

        // Criar Pedido
        const novoPedido = await BD.query(`
            INSERT INTO pedidos (usuario_id, total, status, criado_em) 
            VALUES ($1, $2, 'pendente', NOW()) 
            RETURNING id
        `, [req.session.usuario.id, total]);

        const pedidoId = novoPedido.rows[0].id;

        // Inserir Itens do Pedido
        for (const p of produtos.rows) {
            const qtd = carrinho[p.id];
            await BD.query(`
                INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unitario) 
                VALUES ($1, $2, $3, $4)
            `, [pedidoId, p.id, qtd, p.preco]);
            
            // Atualizar Estoque
            await BD.query(`
                UPDATE produtos SET estoque = estoque - $1 WHERE id = $2
            `, [qtd, p.id]);
        }

        // Limpar carrinho da sessão
        req.session.carrinho = {};

        res.redirect('/pedidos/meus');
    } catch (erro) {
        console.error('Erro ao finalizar pedido:', erro);
        res.status(500).send('Erro ao processar compra');
    }
});

module.exports = router;