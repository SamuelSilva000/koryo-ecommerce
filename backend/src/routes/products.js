const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { NotFoundError, ValidationError } = require('../utils/errors');

const router = express.Router();

function validar(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return next(new ValidationError(erros.array()[0].msg));
  }
  next();
}

router.get('/', (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const busca = req.query.q;

    if (busca) {
      const produtos = Product.buscarPorNome(busca);
      return res.json({
        success: true,
        data: { products: produtos, pagination: { page: 1, limit: produtos.length, total: produtos.length, totalPages: 1 } },
      });
    }

    const resultado = Product.listar({ page, limit });
    res.json({ success: true, data: resultado });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', (req, res, next) => {
  try {
    const produto = Product.buscarPorId(parseInt(req.params.id));
    if (!produto) throw new NotFoundError('Produto nao encontrado');
    res.json({ success: true, data: produto });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/',
  authenticateToken,
  requireAdmin,
  [
    body('nome').trim().notEmpty().withMessage('Nome e obrigatorio'),
    body('precoEmCentavos').isInt({ min: 1 }).withMessage('Preco invalido'),
    body('unidadesEmEstoque').isInt({ min: 0 }).withMessage('Estoque invalido'),
  ],
  validar,
  (req, res, next) => {
    try {
      const produto = Product.criar({
        nome: req.body.nome,
        marca: req.body.marca || '',
        descricao: req.body.descricao || '',
        numeracao: req.body.numeracao || '',
        cor: req.body.cor || '',
        precoEmCentavos: parseInt(req.body.precoEmCentavos),
        unidadesEmEstoque: parseInt(req.body.unidadesEmEstoque),
        imagemPrincipalId: req.body.imagemPrincipalId || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
      });
      res.status(201).json({ success: true, data: produto });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existente = Product.buscarPorId(id);
    if (!existente) throw new NotFoundError('Produto nao encontrado');

    const atualizado = Product.atualizar(id, {
      nome: req.body.nome,
      marca: req.body.marca,
      descricao: req.body.descricao,
      numeracao: req.body.numeracao,
      cor: req.body.cor,
      precoEmCentavos: req.body.precoEmCentavos ? parseInt(req.body.precoEmCentavos) : undefined,
      unidadesEmEstoque: req.body.unidadesEmEstoque !== undefined ? parseInt(req.body.unidadesEmEstoque) : undefined,
      imagemPrincipalId: req.body.imagemPrincipalId,
    });

    res.json({ success: true, data: atualizado });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authenticateToken, requireAdmin, (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const existente = Product.buscarPorId(id);
    if (!existente) throw new NotFoundError('Produto nao encontrado');

    Product.deletar(id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
