const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User');
const db = require('../config/database');
const { criarPedidoDoCarrinho } = require('../services/orderService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../utils/errors');

const router = express.Router();

router.use(authenticateToken);

router.post('/', (req, res, next) => {
  try {
    const pedido = criarPedidoDoCarrinho(req.user.userId);
    res.status(201).json({ success: true, data: pedido });
  } catch (err) {
    next(err);
  }
});

router.get('/', (req, res, next) => {
  try {
    const user = User.buscarPorId(req.user.userId);
    if (user?.tipo === 'admin_geral') {
      const pedidos = db.prepare('SELECT * FROM pedidos ORDER BY id DESC').all();
      return res.json({ success: true, data: pedidos });
    }
    const pedidos = Order.listarPorUsuario(req.user.userId);
    res.json({ success: true, data: pedidos });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const pedido = Order.buscarPorId(parseInt(req.params.id), req.user.userId);
    if (!pedido) throw new NotFoundError('Pedido nao encontrado');
    res.json({ success: true, data: pedido });
  } catch (err) {
    next(err);
  }
});

router.put('/:id/status', requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const status = String(req.body.status || '').trim();
    const permitidos = ['pendente', 'processando', 'preparando', 'em_rota', 'entregue', 'cancelado'];
    if (!permitidos.includes(status)) throw new ValidationError('Status invalido');

    const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(id);
    if (!pedido) throw new NotFoundError('Pedido nao encontrado');

    Order.atualizarStatus(id, status);
    res.json({ success: true, data: { id, status } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
