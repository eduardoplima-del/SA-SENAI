const express = require('express');
const router = express.Router();
const BD = require('../db');

// Listar todos os pedidos (Visão do Administrador)
router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT 
                p.id, 
                p.total, 
                p.status, 
                TO_CHAR(p.criado_em, 'DD/MM/YYYY HH24:MI') AS data_pedido,
                u.nome AS cliente_nome, 
                u.email AS cliente_email
            FROM pedidos p
            INNER JOIN usuarios u ON u.id = p.usuario_id
            ORDER BY p.id DESC
        `);

        res.render('pedidos', { pedidos: resultado.rows });
    } catch (erro) {
        console.error('Erro ao buscar pedidos:', erro);
        res.status(500).send('Erro no servidor');
    }
});

// Pedidos do próprio cliente logado
router.get('/meus', async (req, res) => {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    try {
        const meusPedidos = await BD.query(`
            SELECT 
                p.id, 
                p.total, 
                p.status, 
                TO_CHAR(p.criado_em, 'DD/MM/YYYY HH24:MI') AS data_pedido
            FROM pedidos p
            WHERE p.usuario_id = $1
            ORDER BY p.id DESC
        `, [req.session.usuario.id]);

        res.render('meus_pedidos', { pedidos: meusPedidos.rows });
    } catch (erro) {
        console.error('Erro ao listar meus pedidos:', erro);
        res.status(500).send('Erro no servidor');
    }
});

// Atualizar o status do pedido (Somente Admin)
router.post('/status/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        await BD.query('UPDATE pedidos SET status = $1 WHERE id = $2', [status, id]);
        res.redirect('/pedidos');
    } catch (erro) {
        console.error('Erro ao atualizar pedido:', erro);
        res.status(500).send('Erro ao alterar status');
    }
});

module.exports = router;