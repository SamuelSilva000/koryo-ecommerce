const express = require('express');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/auth');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res, next) => {
  try {
    const carrinho = Cart.buscarComItens(req.user.userId);
    res.json({ success: true, data: carrinho });
  } catch (err) {
    next(err);
  }
});

router.post('/items', (req, res, next) => {
  try {
    const produtoId = Number(req.body.produtoId ?? req.body.productId);
    const quantidade = Number(req.body.quantidade ?? req.body.quantity ?? 1);
    const tamanho = String(req.body.tamanho || 'unico');

    if (!produtoId || quantidade <= 0) {
      throw new ValidationError('produtoId e quantidade sao obrigatorios');
    }

    const produto = Product.buscarPorId(produtoId);
    if (!produto) throw new NotFoundError('Produto nao encontrado');

    if (produto.unidades_em_estoque < quantidade) {
      throw new ConflictError(`Estoque insuficiente. Disponivel: ${produto.unidades_em_estoque}`);
    }

    const carrinho = Cart.adicionarItem(req.user.userId, produtoId, quantidade, tamanho);
    res.json({ success: true, data: carrinho });
  } catch (err) {
    next(err);
  }
});

router.put('/items/:productId', (req, res, next) => {
  try {
    const produtoId = parseInt(req.params.productId);
    const quantidade = Number(req.body.quantidade ?? req.body.quantity);
    const tamanho = String(req.body.tamanho || 'unico');

    if (!quantidade || quantidade <= 0) {
      throw new ValidationError('Quantidade invalida');
    }

    const produto = Product.buscarPorId(produtoId);
    if (!produto) throw new NotFoundError('Produto nao encontrado');

    if (produto.unidades_em_estoque < quantidade) {
      throw new ConflictError(`Estoque insuficiente. Disponivel: ${produto.unidades_em_estoque}`);
    }

    const carrinho = Cart.atualizarItem(req.user.userId, produtoId, quantidade, tamanho);
    res.json({ success: true, data: carrinho });
  } catch (err) {
    next(err);
  }
});

router.delete('/items/:productId', (req, res, next) => {
  try {
    const produtoId = parseInt(req.params.productId);
    const tamanho = String(req.query.tamanho || 'unico');
    const carrinho = Cart.removerItem(req.user.userId, produtoId, tamanho);
    res.json({ success: true, data: carrinho });
  } catch (err) {
    next(err);
  }
});

router.delete('/', (req, res, next) => {
  try {
    const carrinho = Cart.limpar(req.user.userId);
    res.json({ success: true, data: carrinho });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
