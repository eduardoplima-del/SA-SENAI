const express = require('express');
const router = express.Router();
const BD = require('../db');

router.get('/', async (req, res) => {
    try {
        const produtos = await BD.query(`
            SELECT * 
            FROM produtos 
            ORDER BY id DESC
        `);

        res.render('catalogar', { produtos: produtos.rows });
    } catch (erro) {
        console.error('Erro ao carregar produtos:', erro);
        res.status(500).send('Erro no servidor');
    }
});

router.post('/novo', async (req, res) => {
    const { nome, preco, estoque, imagem_url } = req.body;
    try {
        await BD.query(`
            INSERT INTO produtos (nome, preco, estoque, imagem_url, ativo) 
            VALUES ($1, $2, $3, $4, true)
        `, [nome, parseFloat(preco), parseInt(estoque), imagem_url || null]);

        res.redirect('/produtos');
    } catch (erro) {
        console.error('Erro ao cadastrar produto:', erro);
        res.status(500).send('Erro ao criar produto');
    }
});

module.exports = router;