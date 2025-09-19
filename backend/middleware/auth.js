const jwt = require('jsonwebtoken');

// Chave secreta para JWT (em produção, deve estar em variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-muito-segura-aqui-2025';

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acesso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    
    req.user = user;
    next();
  });
};

// Middleware para verificar roles específicas
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    if (typeof roles === 'string') {
      roles = [roles];
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Permissão insuficiente' });
    }

    next();
  };
};

// Middleware para admin apenas
const requireAdmin = requireRole(['admin']);

// Middleware para admin ou coordenador
const requireManager = requireRole(['admin', 'coordenador']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManager,
  JWT_SECRET
};
