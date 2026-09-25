const { UnauthorizedError } = require('../utils/errors');
const User = require('../models/User');

function authenticateToken(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (userId === undefined || userId === null || userId === '') {
    return next(new UnauthorizedError('Autenticacao necessaria'));
  }
  req.user = { userId: parseInt(userId) };
  next();
}

function requireAdmin(req, res, next) {
  const user = User.buscarPorId(req.user.userId);
  if (!user) return next(new UnauthorizedError('Usuario nao encontrado'));
  if (user.tipo !== 'admin' && user.tipo !== 'lojista' && user.tipo !== 'admin_geral') {
    return next(new UnauthorizedError('Acesso restrito a administradores e lojistas'));
  }
  req.user.tipo = user.tipo;
  next();
}

module.exports = { authenticateToken, requireAdmin };
