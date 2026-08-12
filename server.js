const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Sessão
app.use(session({
    secret: 'magnatastore01_super_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 3600000,
        httpOnly: true,
        sameSite: 'lax'
    }
}));

const DATA_FILE = path.join(__dirname, 'data', 'produtos.json');

// ============ FUNÇÕES ============
function lerProdutos() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {};
    }
}

function salvarProdutos(produtos) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(produtos, null, 2), 'utf8');
        return true;
    } catch (error) {
        return false;
    }
}

// ============ MIDDLEWARE ============
function verificarAdmin(req, res, next) {
    if (req.session.isAdmin) {
        next();
    } else {
        res.status(401).json({ error: 'Não autorizado' });
    }
}

// ============ ROTAS PÚBLICAS ============
app.get('/api/produtos', (req, res) => {
    res.json(lerProdutos());
});

// ============ ROTAS DE AUTENTICAÇÃO ============
app.post('/api/admin/login', (req, res) => {
    const { usuario, senha } = req.body;
    
    // CREDENCIAIS - ALTERE AQUI
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'magnata2026';
    
    if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
        req.session.isAdmin = true;
        req.session.usuario = usuario;
        req.session.loginTime = Date.now();
        
        res.json({
            success: true,
            message: 'Login realizado!',
            redirect: '/admin/painel.html'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'Usuário ou senha incorretos!'
        });
    }
});

app.post('/api/admin/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao fazer logout' });
        }
        res.json({ success: true, message: 'Logout realizado!' });
    });
});

app.get('/api/admin/verificar', (req, res) => {
    if (req.session.isAdmin) {
        res.json({
            autenticado: true,
            usuario: req.session.usuario
        });
    } else {
        res.json({ autenticado: false });
    }
});

// ============ ROTAS ADMIN (PROTEGIDAS) ============
app.post('/api/admin/produtos', verificarAdmin, (req, res) => {
    const { titulo, preco, estoque, descricao, categoria } = req.body;
    
    if (!titulo || !preco || !estoque || !descricao || !categoria) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }
    
    const produtos = lerProdutos();
    let maxId = 0;
    Object.keys(produtos).forEach(id => {
        if (parseInt(id) > maxId) maxId = parseInt(id);
    });
    const novoId = maxId + 1;
    
    produtos[novoId] = {
        titulo,
        preco: parseFloat(preco),
        estoque: parseInt(estoque),
        descricao,
        categoria
    };
    
    if (salvarProdutos(produtos)) {
        res.json({
            success: true,
            message: 'Produto criado!',
            id: novoId,
            produto: produtos[novoId]
        });
    } else {
        res.status(500).json({ error: 'Erro ao salvar' });
    }
});

app.put('/api/admin/produtos/:id', verificarAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const { titulo, preco, estoque, descricao, categoria } = req.body;
    const produtos = lerProdutos();
    
    if (!produtos[id]) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    if (titulo) produtos[id].titulo = titulo;
    if (preco) produtos[id].preco = parseFloat(preco);
    if (estoque !== undefined) produtos[id].estoque = parseInt(estoque);
    if (descricao) produtos[id].descricao = descricao;
    if (categoria) produtos[id].categoria = categoria;
    
    if (salvarProdutos(produtos)) {
        res.json({
            success: true,
            message: 'Produto atualizado!',
            produto: produtos[id]
        });
    } else {
        res.status(500).json({ error: 'Erro ao salvar' });
    }
});

app.delete('/api/admin/produtos/:id', verificarAdmin, (req, res) => {
    const id = parseInt(req.params.id);
    const produtos = lerProdutos();
    
    if (!produtos[id]) {
        return res.status(404).json({ error: 'Produto não encontrado' });
    }
    
    delete produtos[id];
    
    if (salvarProdutos(produtos)) {
        res.json({
            success: true,
            message: 'Produto deletado!'
        });
    } else {
        res.status(500).json({ error: 'Erro ao salvar' });
    }
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor MAGNATASTORE01 rodando em http://localhost:${PORT}`);
    console.log(`📁 Admin: http://localhost:${PORT}/admin/login.html`);
    console.log(`🏪 Loja: http://localhost:${PORT}/index.html`);
});