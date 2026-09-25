const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../utils/errors');

const router = express.Router();

router.use(authenticateToken);
router.use(requireAdmin);

router.get('/', (req, res, next) => {
  try {
    const users = User.listarTodos().filter((u) => u.id !== 0);
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (id === 0) throw new ValidationError('Nao e possivel excluir o Admin Geral');
    if (id === req.user.userId) throw new ValidationError('Nao e possivel excluir a si mesmo');
    const user = User.buscarPorId(id);
    if (!user) throw new NotFoundError('Usuario nao encontrado');
    User.deletar(id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
