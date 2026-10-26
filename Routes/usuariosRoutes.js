const express = require('express');
const router = express.Router();
const BD = require('../db');

router.get('/', async (req, res) => {
    try {
        const resultado = await BD.query('SELECT id, nome, email, tipo, situacao FROM usuarios ORDER BY id ASC');
        res.render('usuarios', { usuarios: resultado.rows });
    } catch (erro) {
        console.error('Erro ao listar usuários:', erro);
        res.status(500).send('Erro no servidor');
    }
});

module.exports = router;