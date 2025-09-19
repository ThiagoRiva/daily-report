const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config');
const db = require('./database/database');
const { authenticateToken, requireAdmin, requireManager, JWT_SECRET } = require('./middleware/auth');
const { auditMiddleware } = require('./middleware/audit');
const { clusterFilterMiddleware, aplicarFiltroCluster, podeAcessarCluster } = require('./middleware/clusterFilter');

const app = express();

// Middlewares
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ===== ROTAS DE AUTENTICAÇÃO =====

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  // Buscar usuário por email
  db.db.get('SELECT * FROM usuarios WHERE email = ? AND ativo = 1', [email], async (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    try {
      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, user.senha);
      
      if (!senhaValida) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      // Gerar token JWT
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          nome: user.nome,
          role: user.role,
          clusters_permitidos: user.clusters_permitidos
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Erro ao verificar senha:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });
});

// Verificar token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout (cliente deve descartar o token)
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout realizado com sucesso' });
});

// Middleware para logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ===== ROTAS PÚBLICAS (SEM AUTENTICAÇÃO) =====

// Rota de saúde da API
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// ===== MIDDLEWARE DE PROTEÇÃO =====
// Proteger todas as rotas da API exceto as já definidas acima
app.use('/api', (req, res, next) => {
  // Rotas públicas que não precisam de autenticação
  const publicRoutes = ['/api/health', '/api/auth/login', '/api/auth/logout', '/api/auth/verify'];
  
  if (publicRoutes.includes(req.path)) {
    return next();
  }
  
  // Aplicar autenticação para todas as outras rotas
  authenticateToken(req, res, next);
});

// ===== ROTAS PROTEGIDAS =====

// Rotas de Clusters
app.get('/api/clusters', (req, res) => {
  db.getAllClusters((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/clusters', requireManager, (req, res) => {
  db.createCluster(req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Cluster criado com sucesso' });
  });
});

app.put('/api/clusters/:id', (req, res) => {
  db.updateCluster(req.params.id, req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Cluster atualizado com sucesso' });
  });
});

app.delete('/api/clusters/:id', requireManager, (req, res) => {
  db.deleteCluster(req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Cluster excluído com sucesso' });
  });
});

// Rotas de Usinas
app.get('/api/usinas', (req, res) => {
  db.getAllUsinas((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/usinas', (req, res) => {
  db.createUsina(req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Usina criada com sucesso' });
  });
});

app.put('/api/usinas/:id', (req, res) => {
  db.updateUsina(req.params.id, req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Usina atualizada com sucesso' });
  });
});

app.delete('/api/usinas/:id', (req, res) => {
  db.deleteUsina(req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Usina excluída com sucesso' });
  });
});

// Rotas de Técnicos
app.get('/api/tecnicos', (req, res) => {
  db.getAllTecnicos((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/tecnicos', (req, res) => {
  db.createTecnico(req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Técnico criado com sucesso' });
  });
});

app.put('/api/tecnicos/:id', (req, res) => {
  db.updateTecnico(req.params.id, req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Técnico atualizado com sucesso' });
  });
});

app.delete('/api/tecnicos/:id', (req, res) => {
  db.deleteTecnico(req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Técnico excluído com sucesso' });
  });
});

// Rotas de Funções
app.get('/api/funcoes', (req, res) => {
  db.getAllFuncoes((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Rotas de Atividades
app.get('/api/atividades', clusterFilterMiddleware, (req, res) => {
  const filters = {
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
    clusterId: req.query.clusterId,
    usinaId: req.query.usinaId,
    tecnicoId: req.query.tecnicoId
  };

  db.getAllAtividades(filters, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/atividades', clusterFilterMiddleware, auditMiddleware('CREATE', 'atividades'), (req, res) => {
  db.createAtividade(req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Atividade criada com sucesso' });
  });
});

// Rotas de Status Técnico
app.get('/api/status-tecnico', (req, res) => {
  const filters = {
    dataInicio: req.query.dataInicio,
    dataFim: req.query.dataFim,
    clusterId: req.query.clusterId,
    usinaId: req.query.usinaId,
    tecnicoId: req.query.tecnicoId
  };

  db.getAllStatusTecnico(filters, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/status-tecnico', (req, res) => {
  db.createStatusTecnico(req.body, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Status técnico salvo com sucesso' });
  });
});

// Rota de saúde da API
app.delete('/api/atividades/:id', (req, res) => {
  db.deleteAtividade(req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Atividade excluída com sucesso' });
  });
});

app.delete('/api/status-tecnico/:id', (req, res) => {
  db.deleteStatusTecnico(req.params.id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Status técnico excluído com sucesso' });
  });
});

// Rota para dados consolidados (para compatibilidade com frontend)
app.get('/api/data', (req, res) => {
  // Buscar todos os dados em paralelo
  const promises = [
    new Promise((resolve, reject) => db.getAllClusters((err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.getAllUsinas((err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.getAllTecnicos((err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.getAllFuncoes((err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.getAllAtividades({}, (err, rows) => err ? reject(err) : resolve(rows))),
    new Promise((resolve, reject) => db.getAllStatusTecnico({}, (err, rows) => err ? reject(err) : resolve(rows)))
  ];

  Promise.all(promises)
    .then(([clusters, usinas, tecnicos, funcoes, atividades, statusTecnico]) => {
      res.json({
        clusters,
        usinas,
        tecnicos,
        funcoes,
        atividades,
        statusTecnico
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro na aplicação:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Iniciar servidor
const server = app.listen(config.port, () => {
  console.log(`🚀 Servidor rodando na porta ${config.port}`);
  console.log(`🌍 API disponível em: http://localhost:${config.port}/api`);
  console.log(`💾 Banco de dados: ${config.dbPath}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔄 Encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado.');
    db.close();
    process.exit(0);
  });
});

module.exports = app;
