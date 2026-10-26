const path = require('path');
const express = require('express');
const session = require('express-session');
const app = express();
const BD = require('./db');

// Motor de conversão EJS (Views)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

// Arquivos estáticos (CSS, Imagens, JS)
app.use(express.static(path.join(__dirname, 'Public')));

// Middlewares para leitura de formulários (URL-encoded) e JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração de Sessão com express-session
app.use(session({
    secret: 'SESISENAI_PAPELARIA_CHAVE_SECRETA',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } // Duração de 8 horas
}));

// Middleware global para disponibilizar dados de sessão e auxiliares nas views EJS
app.use((req, res, next) => {
    const usuario = req.session.usuario || null;
    const carrinho = req.session.carrinho || {};

    res.locals.usuario = usuario;
    res.locals.tipoUsuario = usuario ? (usuario.tipo === 'admin' ? 'Administrador' : 'Cliente') : null;
    res.locals.carrinhoQtd = Object.values(carrinho).reduce((soma, qtd) => soma + qtd, 0);
    res.locals.moeda = (valor) =>
        Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    next();
});

// Middlewares de Restrição de Acesso
function exigirLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    next();
}

function exigirAdmin(req, res, next) {
    if (!req.session.usuario) {
        return res.redirect('/login');
    }
    if (req.session.usuario.tipo !== 'admin') {
        return res.status(403).send('Acesso restrito a administradores.');
    }
    next();
}

// ---------------------- ROTAS PÚBLICAS & AUTENTICAÇÃO ----------------------

// Landing Page (Página Inicial)
app.get('/', async (req, res) => {
    try {
        const resultado = await BD.query(`
            SELECT id, nome, preco, estoque, imagem_url 
            FROM produtos 
            WHERE ativo = true 
            ORDER BY id DESC LIMIT 8
        `);
        res.render('landing/index', { produtosAtivos: resultado.rows });
    } catch (erro) {
        console.error('Erro ao carregar a página inicial:', erro);
        res.render('landing/index', { produtosAtivos: [] });
    }
});

// Exibir Tela de Login
app.get('/login', (req, res) => {
    res.render('login', { erro: null });
});

// Processar Autenticação (Login)
app.post('/login', async (req, res) => {
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');

    try {
        const resultado = await BD.query(`
            SELECT id, nome, email, tipo 
            FROM usuarios 
            WHERE email = $1 AND senha = $2 AND situacao = 1
        `, [email, senha]);

        if (resultado.rows.length === 0) {
            return res.render('login', { erro: 'E-mail ou senha inválidos!' });
        }

        const usuario = resultado.rows[0];
        req.session.usuario = usuario;

        res.redirect(usuario.tipo === 'admin' ? '/dashboard' : '/catalogo');
    } catch (erro) {
        console.error('Erro ao realizar login:', erro);
        res.status(500).send('Erro interno do servidor ao autenticar.');
    }
});

// Exibir Tela de Cadastro de Usuário/Cliente
app.get('/cadastro', (req, res) => {
    res.render('cadastro', { erro: null });
});

// Processar Criação de Nova Conta
app.post('/cadastro', async (req, res) => {
    const nome = String(req.body.nome || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const senha = String(req.body.senha || '');

    if (!nome || !email || !senha) {
        return res.render('cadastro', { erro: 'Por favor, preencha todos os campos!' });
    }

    try {
        // Verificar se o e-mail já foi registrado na base de dados
        const usuarioExiste = await BD.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (usuarioExiste.rows.length > 0) {
            return res.render('cadastro', { erro: 'Este e-mail já está cadastrado no sistema!' });
        }

        // Inserir novo cliente (tipo = 'cliente', situacao = 1)
        const novoUsuario = await BD.query(`
            INSERT INTO usuarios (nome, email, senha, tipo, situacao)
            VALUES ($1, $2, $3, 'cliente', 1)
            RETURNING id, nome, email, tipo
        `, [nome, email, senha]);

        // Autentica e inicia sessão automaticamente
        req.session.usuario = novoUsuario.rows[0];
        res.redirect('/catalogo');

    } catch (erro) {
        console.error('Erro ao cadastrar novo usuário:', erro);
        res.render('cadastro', { erro: 'Erro no servidor ao tentar criar a conta.' });
    }
});

// Encerrar Sessão (Logout)
app.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/'));
});

// ---------------------- PAINEL ADMINISTRATIVO (DASHBOARD) ----------------------

app.get('/admin', exigirAdmin, (req, res) => {
    res.redirect('/dashboard');
});

app.get('/dashboard', exigirAdmin, async (req, res) => {
    try {
        const [
            totalProdutos,
            totalPedidos,
            totalVendas,
            pedidosStatus,
            estoqueBaixo,
            maisVendidos
        ] = await Promise.all([
            BD.query(`SELECT COUNT(*)::int AS total FROM produtos WHERE ativo = true`),
            BD.query(`SELECT COUNT(*)::int AS total FROM pedidos`),
            BD.query(`SELECT COALESCE(SUM(total), 0) AS total FROM pedidos WHERE status = 'pago'`),
            BD.query(`SELECT status, COUNT(*)::int AS total FROM pedidos GROUP BY status ORDER BY status`),
            BD.query(`SELECT id, nome, estoque FROM produtos WHERE ativo = true AND estoque <= 5 ORDER BY estoque, nome LIMIT 10`),
            BD.query(`
                SELECT p.nome, SUM(pi.quantidade)::int AS total
                FROM pedido_itens pi
                INNER JOIN produtos p ON p.id = pi.produto_id
                INNER JOIN pedidos pe ON pe.id = pi.pedido_id
                WHERE pe.status = 'pago'
                GROUP BY p.id, p.nome
                ORDER BY total DESC LIMIT 5
            `)
        ]);

        res.render('dashboard', {
            usuario: req.session.usuario,
            totalProdutos: totalProdutos.rows[0].total,
            totalPedidos: totalPedidos.rows[0].total,
            totalVendas: totalVendas.rows[0].total,
            pedidosStatus: pedidosStatus.rows,
            estoqueBaixo: estoqueBaixo.rows,
            maisVendidos: maisVendidos.rows
        });
    } catch (erro) {
        console.error('Erro ao carregar o Dashboard:', erro);
        res.status(500).send('Erro ao carregar o painel administrativo.');
    }
});

// ---------------------- VINCULAÇÃO DOS MÓDULOS DE ROTAS ----------------------

const lojaRoutes = require('./Routes/lojaRoutes');
app.use('/', lojaRoutes);

const produtosRoutes = require('./Routes/produtosRoutes');
app.use('/produtos', exigirAdmin, produtosRoutes);

const usuariosRoutes = require('./Routes/usuariosRoutes');
app.use('/usuarios', exigirAdmin, usuariosRoutes);

const pedidosRoutes = require('./Routes/pedidosRoutes');
app.use('/pedidos', pedidosRoutes);

// Tratamento de Rota 404 (Página não encontrada)
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

// Inicialização do Servidor Express
const PORTA = 3001;
app.listen(PORTA, () => {
    console.log(`Servidor "The Office Papelaria" rodando em: http://localhost:${PORTA}`);
});