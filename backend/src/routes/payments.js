const express = require('express');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { ValidationError, ConflictError } = require('../utils/errors');

const router = express.Router();

router.use(authenticateToken);

router.post('/mercadopago', async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const carrinho = Cart.buscarComItens(userId);

    if (!carrinho.itens || carrinho.itens.length === 0) {
      throw new ValidationError('Carrinho vazio. Adicione itens antes de pagar.');
    }

    for (const item of carrinho.itens) {
      const produto = Product.buscarPorId(item.produtoId);
      if (!produto) throw new ValidationError(`Produto ${item.produtoId} nao encontrado`);
      if (produto.unidades_em_estoque < item.quantidade) {
        throw new ConflictError(`Estoque insuficiente para ${produto.nome}. Disponivel: ${produto.unidades_em_estoque}`);
      }
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    const transacao = db.transaction(() => {
      const pedido = Order.criar(userId, carrinho.valorTotalEmCentavos);
      for (const item of carrinho.itens) {
        const produto = Product.buscarPorId(item.produtoId);
        Order.criarItem({
          pedidoId: pedido.id,
          produtoId: produto.id,
          nomeProduto: produto.nome,
          precoEmCentavos: produto.preco_em_centavos,
          quantidade: item.quantidade,
          tamanho: item.tamanho,
        });
        Product.reduzirEstoque(produto.id, item.quantidade);
      }
      Cart.limpar(userId);
      return pedido;
    });

    const pedido = transacao();

    if (!accessToken) {
      console.info('Mercado Pago -> modo mock (token nao configurado)');
      Order.atualizarStatus(pedido.id, 'processando');
      return res.json({
        success: true,
        init_point: null,
        url: null,
        data: {
          provider: 'mercadopago',
          mode: 'mock',
          pedidoId: pedido.id,
          message: 'Pagamento simulado. Pedido registrado no banco.',
          totalEmCentavos: carrinho.valorTotalEmCentavos,
          itensCount: carrinho.itens.length,
        },
      });
    }

    console.info('Mercado Pago -> modo live (token configurado)');
    const client = new MercadoPagoConfig({ accessToken });
    const preferenceClient = new Preference(client);

    const preferenceBody = {
      items: carrinho.itens.map((item) => ({
        id: String(item.produtoId),
        title: item.nomeProduto,
        description: item.marca || '',
        quantity: item.quantidade,
        currency_id: 'BRL',
        unit_price: Number((item.precoEmCentavos / 100).toFixed(2)),
      })),
      external_reference: `pedido_${pedido.id}`,
      metadata: {
        pedidoId: String(pedido.id),
        userId: String(userId),
        totalEmCentavos: carrinho.valorTotalEmCentavos,
        itensCount: carrinho.itens.length,
      },
    };

    const preferenceResponse = await preferenceClient.create({ body: preferenceBody });
    const initPoint = preferenceResponse?.init_point || preferenceResponse?.sandbox_init_point;

    if (!initPoint) {
      Order.atualizarStatus(pedido.id, 'cancelado');
      return res.status(502).json({
        success: false,
        error: { message: 'Mercado Pago nao retornou URL de pagamento. Pedido cancelado.' },
      });
    }

    Order.atualizarStatus(pedido.id, 'processando');

    return res.json({
      success: true,
      init_point: initPoint,
      url: initPoint,
      data: {
        provider: 'mercadopago',
        mode: 'live',
        pedidoId: pedido.id,
        preferenceId: preferenceResponse?.id,
        totalEmCentavos: carrinho.valorTotalEmCentavos,
        itensCount: carrinho.itens.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
