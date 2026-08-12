let produtos = {};
let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
let categoriaAtual = 'todos';
let adminLogado = false;

// IronPay
const API_TOKEN = "aEXRfL3BGEMxaXBVfGhXDnsXDiOBFOu7QKj3VtBDd3a6fSu6gN4YRHGikIoN";
const OFFER_HASH = "rrsn4itspe";
const BASE_URL = "https://api.ironpayapp.com.br/api/public/v1";

// ============ VERIFICAR SESSÃO ============
async function verificarSessao() {
    try {
        const response = await fetch('/api/admin/verificar');
        const data = await response.json();
        if (data.autenticado) {
            adminLogado = true;
            document.getElementById('btnAdmin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'inline';
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
    }
}

// ============ LOGIN ============
function abrirLogin() {
    document.getElementById('modalLogin').style.display = 'flex';
    document.getElementById('loginMensagem').style.display = 'none';
    document.getElementById('loginUsuario').value = '';
    document.getElementById('loginSenha').value = '';
    document.getElementById('loginUsuario').focus();
}

function fecharLogin() {
    document.getElementById('modalLogin').style.display = 'none';
}

async function fazerLogin() {
    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value.trim();
    const msg = document.getElementById('loginMensagem');

    if (!usuario || !senha) {
        msg.style.display = 'block';
        msg.style.background = 'rgba(255,68,68,0.1)';
        msg.style.border = '1px solid #ff4444';
        msg.style.color = '#ff4444';
        msg.textContent = '❌ Preencha todos os campos!';
        return;
    }

    msg.style.display = 'block';
    msg.style.background = 'rgba(0,255,136,0.1)';
    msg.style.border = '1px solid #00ff88';
    msg.style.color = '#00ff88';
    msg.textContent = '⏳ Verificando...';

    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, senha })
        });
        const data = await response.json();

        if (data.success) {
            msg.textContent = '✅ Login realizado!';
            adminLogado = true;
            document.getElementById('btnAdmin').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'inline';
            setTimeout(() => {
                fecharLogin();
                mostrarMensagem('✅ Bem-vindo, Admin!', 'sucesso');
            }, 500);
        } else {
            msg.style.background = 'rgba(255,68,68,0.1)';
            msg.style.border = '1px solid #ff4444';
            msg.style.color = '#ff4444';
            msg.textContent = '❌ ' + data.message;
        }
    } catch (error) {
        msg.style.background = 'rgba(255,68,68,0.1)';
        msg.style.border = '1px solid #ff4444';
        msg.style.color = '#ff4444';
        msg.textContent = '❌ Erro ao conectar!';
    }
}

// ============ LOGOUT ============
async function fazerLogout() {
    if (!confirm('Deseja sair da área administrativa?')) return;
    try {
        await fetch('/api/admin/logout', { method: 'POST' });
        adminLogado = false;
        document.getElementById('btnAdmin').style.display = 'inline';
        document.getElementById('adminPanel').style.display = 'none';
        mostrarMensagem('✅ Logout realizado!', 'sucesso');
    } catch (error) {
        alert('❌ Erro ao fazer logout!');
    }
}

// ============ ABRIR PAINEL ADMIN ============
function abrirAdmin() {
    document.getElementById('modalAdmin').style.display = 'flex';
    carregarAdmin();
}

function fecharAdmin() {
    document.getElementById('modalAdmin').style.display = 'none';
}

// ============ CARREGAR ADMIN ============
async function carregarAdmin() {
    const container = document.getElementById('adminConteudo');
    container.innerHTML = '<div class="loading">Carregando...</div>';

    try {
        const response = await fetch('/api/produtos');
        const produtosData = await response.json();
        window.adminProdutos = produtosData;
        renderizarAdmin(container);
    } catch (error) {
        container.innerHTML = '<p style="color:#ff4444;">❌ Erro ao carregar produtos</p>';
    }
}

// ============ RENDERIZAR ADMIN ============
function renderizarAdmin(container) {
    const produtos = window.adminProdutos || {};
    
    let html = `
        <style>
            .admin-form { margin-bottom: 25px; }
            .admin-form .form-group { margin-bottom: 12px; }
            .admin-form input, .admin-form select, .admin-form textarea {
                width: 100%;
                padding: 10px;
                background: #2b2d31;
                border: 1px solid #404040;
                border-radius: 6px;
                color: #fff;
                font-size: 0.95em;
            }
            .admin-form textarea { min-height: 60px; resize: vertical; }
            .admin-form .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .admin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; max-height: 400px; overflow-y: auto; }
            .admin-item { background: #2b2d31; padding: 12px; border-radius: 6px; border: 1px solid #404040; }
            .admin-item:hover { border-color: #00ff88; }
            .admin-item h4 { color: #00ff88; font-size: 0.9em; margin-bottom: 5px; }
            .admin-item .info { color: #a0a0a0; font-size: 0.8em; }
            .admin-item .btns { margin-top: 8px; display: flex; gap: 5px; flex-wrap: wrap; }
            .admin-item .btns button { padding: 4px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 0.8em; }
            .btn-editar { background: #ffaa44; color: #1a1b1e; }
            .btn-editar:hover { background: #ff8800; }
            .btn-deletar { background: #ff4444; color: #fff; }
            .btn-deletar:hover { background: #cc0000; }
            .btn-salvar { background: #00ff88; color: #1a1b1e; padding: 10px 25px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
            .btn-salvar:hover { background: #00cc66; }
            .btn-cancelar { background: #444; color: #fff; padding: 10px 25px; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px; }
            .btn-cancelar:hover { background: #555; }
            .admin-msg { padding: 10px; border-radius: 5px; margin-bottom: 10px; display: none; }
            .admin-msg.ok { display: block; background: rgba(0,255,136,0.1); border: 1px solid #00ff88; color: #00ff88; }
            .admin-msg.erro { display: block; background: rgba(255,68,68,0.1); border: 1px solid #ff4444; color: #ff4444; }
            @media (max-width: 600px) { .admin-form .row { grid-template-columns: 1fr; } .admin-grid { grid-template-columns: 1fr; } }
        </style>
    `;

    // Formulário
    html += `
        <div class="admin-form">
            <h4 style="color:#00ff88;margin-bottom:15px;" id="adminFormTitulo">➕ Adicionar Produto</h4>
            <div id="adminMsg" class="admin-msg"></div>
            <div class="row">
                <div class="form-group">
                    <label style="color:#a0a0a0;font-size:0.85em;">📝 Título</label>
                    <input type="text" id="adminTitulo" placeholder="MAGNATASTORE01 - Produto">
                </div>
                <div class="form-group">
                    <label style="color:#a0a0a0;font-size:0.85em;">📂 Categoria</label>
                    <select id="adminCategoria">
                        <option value="viradas">💰 Viradas</option>
                        <option value="cursos">📚 Cursos</option>
                        <option value="cc">💳 CCs</option>
                        <option value="consultaveis">📄 Consultáveis</option>
                    </select>
                </div>
            </div>
            <div class="row">
                <div class="form-group">
                    <label style="color:#a0a0a0;font-size:0.85em;">💰 Preço (R$)</label>
                    <input type="number" id="adminPreco" placeholder="60.00" step="0.01">
                </div>
                <div class="form-group">
                    <label style="color:#a0a0a0;font-size:0.85em;">📦 Estoque</label>
                    <input type="number" id="adminEstoque" placeholder="10">
                </div>
            </div>
            <div class="form-group">
                <label style="color:#a0a0a0;font-size:0.85em;">📄 Descrição</label>
                <textarea id="adminDescricao" placeholder="Descrição detalhada do produto..."></textarea>
            </div>
            <button class="btn-salvar" id="adminBtnSalvar" onclick="adminSalvar()">💾 Salvar</button>
            <button class="btn-cancelar" id="adminBtnCancelar" onclick="adminCancelar()" style="display:none;">Cancelar</button>
        </div>
    `;

    // Lista de produtos
    const total = Object.keys(produtos).length;
    html += `<h4 style="color:#00ff88;margin-bottom:10px;">📦 Produtos Cadastrados (${total})</h4>`;
    
    if (total === 0) {
        html += `<p style="color:#a0a0a0;text-align:center;padding:20px;">Nenhum produto cadastrado ainda</p>`;
    } else {
        html += `<div class="admin-grid">`;
        Object.entries(produtos).forEach(([id, p]) => {
            html += `
                <div class="admin-item">
                    <h4>${p.titulo}</h4>
                    <div class="info">💰 R$ ${p.preco.toFixed(2)} | 📦 ${p.estoque}</div>
                    <div class="info">📂 ${p.categoria}</div>
                    <div class="info" style="font-size:0.75em;color:#666;">${p.descricao.substring(0,60)}${p.descricao.length > 60 ? '...' : ''}</div>
                    <div class="btns">
                        <button class="btn-editar" onclick="adminEditar(${id})">✏️ Editar</button>
                        <button class="btn-deletar" onclick="adminDeletar(${id})">🗑️ Deletar</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    container.innerHTML = html;
    window.adminEditando = null;
}

// ============ ADMIN: SALVAR ============
window.adminSalvar = async function() {
    const titulo = document.getElementById('adminTitulo').value.trim();
    const preco = document.getElementById('adminPreco').value;
    const estoque = document.getElementById('adminEstoque').value;
    const descricao = document.getElementById('adminDescricao').value.trim();
    const categoria = document.getElementById('adminCategoria').value;
    const msg = document.getElementById('adminMsg');
    const btn = document.getElementById('adminBtnSalvar');

    if (!titulo || !preco || !estoque || !descricao) {
        msg.className = 'admin-msg erro';
        msg.textContent = '❌ Preencha todos os campos!';
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Salvando...';

    try {
        const editando = window.adminEditando;
        const url = editando ? `/api/admin/produtos/${editando}` : '/api/admin/produtos';
        const method = editando ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, preco, estoque, descricao, categoria })
        });
        const data = await response.json();

        if (data.success) {
            msg.className = 'admin-msg ok';
            msg.textContent = '✅ ' + data.message;
            adminCancelar();
            carregarAdmin();
            carregarProdutos(); // Atualiza a loja
        } else {
            msg.className = 'admin-msg erro';
            msg.textContent = '❌ ' + (data.error || 'Erro!');
        }
    } catch (error) {
        msg.className = 'admin-msg erro';
        msg.textContent = '❌ Erro ao salvar!';
    }

    btn.disabled = false;
    btn.textContent = '💾 Salvar';
};

// ============ ADMIN: EDITAR ============
window.adminEditar = function(id) {
    const p = window.adminProdutos[id];
    if (!p) return;

    window.adminEditando = id;
    document.getElementById('adminTitulo').value = p.titulo;
    document.getElementById('adminPreco').value = p.preco;
    document.getElementById('adminEstoque').value = p.estoque;
    document.getElementById('adminDescricao').value = p.descricao;
    document.getElementById('adminCategoria').value = p.categoria;
    document.getElementById('adminFormTitulo').textContent = '✏️ Editando Produto';
    document.getElementById('adminBtnSalvar').textContent = '🔄 Atualizar';
    document.getElementById('adminBtnCancelar').style.display = 'inline-block';
    document.getElementById('adminMsg').className = 'admin-msg';
    document.getElementById('adminMsg').textContent = '';
};

// ============ ADMIN: CANCELAR ============
window.adminCancelar = function() {
    window.adminEditando = null;
    document.getElementById('adminTitulo').value = '';
    document.getElementById('adminPreco').value = '';
    document.getElementById('adminEstoque').value = '';
    document.getElementById('adminDescricao').value = '';
    document.getElementById('adminFormTitulo').textContent = '➕ Adicionar Produto';
    document.getElementById('adminBtnSalvar').textContent = '💾 Salvar';
    document.getElementById('adminBtnCancelar').style.display = 'none';
    document.getElementById('adminMsg').className = 'admin-msg';
    document.getElementById('adminMsg').textContent = '';
};

// ============ ADMIN: DELETAR ============
window.adminDeletar = async function(id) {
    if (!confirm('⚠️ Tem certeza que deseja deletar este produto?')) return;
    try {
        const response = await fetch(`/api/admin/produtos/${id}`, { method: 'DELETE' });
        const data = await response.json();
        if (data.success) {
            mostrarMensagem('✅ Produto deletado!', 'sucesso');
            carregarAdmin();
            carregarProdutos(); // Atualiza a loja
        }
    } catch (error) {
        alert('❌ Erro ao deletar!');
    }
};

// ============ PRODUTOS ============
async function carregarProdutos() {
    try {
        const response = await fetch('/api/produtos');
        produtos = await response.json();
        mostrarProdutos();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
    }
}

function mostrarProdutos() {
    const grid = document.getElementById('produtosGrid');
    grid.innerHTML = '';

    const lista = Object.entries(produtos);
    if (lista.length === 0) {
        grid.innerHTML = '<p style="text-align:center;padding:50px;color:#a0a0a0;">Nenhum produto disponível</p>';
        return;
    }

    lista.forEach(([id, p]) => {
        if (categoriaAtual !== 'todos' && p.categoria !== categoriaAtual) return;

        const estoqueClass = p.estoque <= 1 ? 'baixo' : p.estoque <= 3 ? 'medio' : 'alto';

        const card = document.createElement('div');
        card.className = 'produto-card';
        card.innerHTML = `
            <div class="produto-titulo">${p.titulo}</div>
            <div class="produto-descricao">${p.descricao.substring(0, 150)}${p.descricao.length > 150 ? '...' : ''}</div>
            <div class="produto-preco">Por <span>R$ ${p.preco.toFixed(2)}</span></div>
            <div class="produto-estoque">📦 Estoque: <span class="${estoqueClass}">${p.estoque}</span></div>
            <button class="btn btn-comprar" onclick="adicionarAoCarrinho(${id})" ${p.estoque <= 0 ? 'disabled' : ''}>
                ${p.estoque <= 0 ? '❌ Esgotado' : '🛒 Adicionar ao Carrinho'}
            </button>
        `;
        grid.appendChild(card);
    });
}

function filtrarCategoria(categoria, event) {
    categoriaAtual = categoria;
    document.querySelectorAll('.categoria-btn').forEach(b => b.classList.remove('ativo'));
    if (event) event.target.classList.add('ativo');
    mostrarProdutos();
}

// ============ CARRINHO ============
function atualizarCarrinhoCount() {
    const count = carrinho.reduce((t, i) => t + i.quantidade, 0);
    document.getElementById('carrinhoCount').textContent = count;
}

function adicionarAoCarrinho(id) {
    const produto = produtos[id];
    if (produto.estoque <= 0) return mostrarMensagem('❌ Sem estoque!', 'erro');

    const existente = carrinho.find(item => item.id === id);
    if (existente) {
        existente.quantidade += 1;
    } else {
        carrinho.push({ id, titulo: produto.titulo, preco: produto.preco, quantidade: 1 });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinhoCount();
    mostrarMensagem('✅ Produto adicionado ao carrinho!', 'sucesso');
}

function removerDoCarrinho(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCarrinhoCount();
    abrirModalCarrinho();
}

function abrirModalCarrinho() {
    const container = document.getElementById('carrinhoConteudo');
    if (carrinho.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:40px;color:#a0a0a0;">🛒 Carrinho vazio</p>';
    } else {
        let html = '';
        carrinho.forEach(item => {
            html += `
                <div class="carrinho-item">
                    <span class="remover-item" onclick="removerDoCarrinho(${item.id})">✖️</span>
                    <h4>${item.titulo}</h4>
                    <p>Quantidade: ${item.quantidade} - R$ ${(item.preco * item.quantidade).toFixed(2)}</p>
                </div>
            `;
        });
        const total = carrinho.reduce((t, i) => t + (i.preco * i.quantidade), 0);
        html += `
            <div class="total-carrinho">Total: <strong>R$ ${total.toFixed(2)}</strong></div>
            <button class="btn btn-comprar" onclick="fecharModalCarrinho();gerarPix();">💰 Finalizar Compra</button>
        `;
        container.innerHTML = html;
    }
    document.getElementById('modalCarrinho').style.display = 'flex';
}

function fecharModalCarrinho() {
    document.getElementById('modalCarrinho').style.display = 'none';
}

// ============ PAGAMENTO ============
async function gerarPix() {
    if (carrinho.length === 0) {
        mostrarMensagem('❌ Carrinho vazio!', 'erro');
        return;
    }

    const total = carrinho.reduce((t, i) => t + (i.preco * i.quantidade), 0);
    const totalCentavos = Math.round(total * 100);

    document.getElementById('pagamentoConteudo').innerHTML = '<div class="loading">Gerando PIX...</div>';
    document.getElementById('modalPagamento').style.display = 'flex';

    try {
        const response = await fetch(`${BASE_URL}/transactions?api_token=${API_TOKEN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                amount: totalCentavos,
                offer_hash: OFFER_HASH,
                payment_method: "pix",
                customer: {
                    name: "Cliente Magnata",
                    email: "cliente@magnata.com",
                    phone_number: "11999999999",
                    document: "12345678909"
                },
                cart: [{
                    product_hash: "magnatastore01",
                    title: "Compra MagnataStore",
                    price: totalCentavos,
                    quantity: 1,
                    operation_type: 1,
                    tangible: false
                }]
            })
        });

        const data = await response.json();

        if (response.ok) {
            const pixData = data.pix || {};
            const qrCode = pixData.pix_qr_code || '';
            const codigoPix = pixData.pix_qr_code_raw || qrCode;
            const hash = data.hash || data.id;

            document.getElementById('pagamentoConteudo').innerHTML = `
                <div style="text-align:center;margin:20px 0;">
                    <h3 style="color:#00ff88;">💰 PIX Gerado com Sucesso!</h3>
                    <p style="color:#a0a0a0;">Valor: <strong style="color:#fff;">R$ ${total.toFixed(2)}</strong></p>
                </div>
                <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCode)}" alt="QR Code PIX">
                </div>
                <div class="pix-code">
                    <p style="color:#a0a0a0;">📋 Código PIX (Copiar e Colar):</p>
                    <div class="codigo" id="codigoPix">${codigoPix}</div>
                    <button class="copiar-btn" onclick="copiarPix()">📋 Copiar Código</button>
                </div>
                <button class="btn btn-comprar" onclick="verificarPagamento('${hash}')">🔄 Verificar Pagamento</button>
                <button class="btn" onclick="fecharModalPagamento()" style="margin-top:10px;background:#444;color:#fff;">❌ Fechar</button>
            `;
        } else {
            throw new Error(data.message || 'Erro ao gerar PIX');
        }
    } catch (error) {
        document.getElementById('pagamentoConteudo').innerHTML = `
            <div class="mensagem erro">❌ ${error.message}</div>
            <button class="btn btn-comprar" onclick="gerarPix()">🔄 Tentar Novamente</button>
            <button class="btn" onclick="fecharModalPagamento()" style="margin-top:10px;background:#444;color:#fff;">❌ Fechar</button>
        `;
    }
}

async function verificarPagamento(hash) {
    try {
        const response = await fetch(`${BASE_URL}/transactions/${hash}?api_token=${API_TOKEN}`);
        const data = await response.json();
        const status = data.payment_status;

        let msg = '';
        let cor = '';
        if (status === 'paid') {
            msg = '✅ Pagamento CONFIRMADO! Seu produto será entregue em instantes.';
            cor = 'sucesso';
            carrinho = [];
            localStorage.setItem('carrinho', JSON.stringify(carrinho));
            atualizarCarrinhoCount();
        } else if (status === 'pending' || status === 'waiting_payment') {
            msg = '⏳ Pagamento pendente. Aguarde a confirmação.';
            cor = 'aviso';
        } else if (status === 'expired') {
            msg = '⏰ Pagamento expirado! Gere um novo.';
            cor = 'erro';
        } else {
            msg = `Status: ${status}`;
            cor = '';
        }

        document.getElementById('pagamentoConteudo').innerHTML += `
            <div class="mensagem ${cor}">${msg}</div>
            ${status === 'paid' ? 
                `<button class="btn btn-comprar" onclick="fecharModalPagamento();location.reload();">✅ Finalizar Compra</button>` : 
                `<button class="btn btn-comprar" onclick="verificarPagamento('${hash}')">🔄 Verificar Novamente</button>`
            }
        `;
    } catch (error) {
        alert('❌ Erro ao verificar pagamento!');
    }
}

function copiarPix() {
    const codigo = document.getElementById('codigoPix')?.textContent;
    if (codigo) {
        navigator.clipboard.writeText(codigo).then(() => {
            mostrarMensagem('✅ Código PIX copiado!', 'sucesso');
        }).catch(() => {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = codigo;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            mostrarMensagem('✅ Código PIX copiado!', 'sucesso');
        });
    }
}

function fecharModalPagamento() {
    document.getElementById('modalPagamento').style.display = 'none';
}

// ============ MENSAGENS ============
function mostrarMensagem(texto, tipo) {
    const div = document.createElement('div');
    div.className = `mensagem ${tipo}`;
    div.textContent = texto;
    div.style.position = 'fixed';
    div.style.top = '100px';
    div.style.right = '20px';
    div.style.zIndex = '3000';
    div.style.padding = '15px 20px';
    div.style.borderRadius = '8px';
    div.style.maxWidth = '400px';
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 4000);
}

// ============ FECHAR MODAIS ============
window.onclick = function(event) {
    if (event.target.className === 'modal') {
        event.target.style.display = 'none';
    }
}

// ============ INICIALIZAR ============
document.addEventListener('DOMContentLoaded', () => {
    verificarSessao();
    carregarProdutos();
    atualizarCarrinhoCount();
});