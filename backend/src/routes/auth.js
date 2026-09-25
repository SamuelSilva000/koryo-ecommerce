const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Cart = require('../models/Cart');
const { ValidationError, UnauthorizedError, ConflictError } = require('../utils/errors');

const router = express.Router();

function validar(req, res, next) {
  const erros = validationResult(req);
  if (!erros.isEmpty()) {
    return next(new ValidationError(erros.array()[0].msg));
  }
  next();
}

router.post(
  '/signup',
  [
    body('email').isEmail().withMessage('Email invalido'),
    body('password').isLength({ min: 4 }).withMessage('Senha deve ter no minimo 4 caracteres'),
    body('fullName').trim().notEmpty().withMessage('Nome completo e obrigatorio'),
  ],
  validar,
  (req, res, next) => {
    try {
      const { email, password, fullName } = req.body;
      if (User.buscarPorEmail(email)) {
        throw new ConflictError('Email ja cadastrado');
      }
      const user = User.criar({ email, senha: password, nomeCompleto: fullName });
      Cart.obterOuCriar(user.id);
      res.status(201).json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, fullName: user.nome_completo, tipo: user.tipo },
          token: `token_${Date.now()}`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalido'),
    body('password').notEmpty().withMessage('Senha obrigatoria'),
  ],
  validar,
  (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = User.buscarPorEmail(email);
      if (!user || !User.verificarSenha(password, user.senha_hash)) {
        throw new UnauthorizedError('Credenciais invalidas');
      }

      if (user.tipo !== 'admin_geral') {
        Cart.obterOuCriar(user.id);
      }

      res.json({
        success: true,
        data: {
          user: { id: user.id, email: user.email, fullName: user.nome_completo, tipo: user.tipo },
          token: `token_${Date.now()}`,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
