const db = require('../config/database');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { ValidationError, ConflictError } = require('../utils/errors');

function criarPedidoDoCarrinho(usuarioId) {
  const carrinho = Cart.buscarComItens(usuarioId);

  if (!carrinho.itens || carrinho.itens.length === 0) {
    throw new ValidationError('Carrinho vazio');
  }

  for (const item of carrinho.itens) {
    const produto = Product.buscarPorId(item.produtoId);
    if (!produto) {
      throw new ValidationError(`Produto ${item.produtoId} nao encontrado`);
    }
    if (produto.unidades_em_estoque < item.quantidade) {
      throw new ConflictError(
        `Estoque insuficiente para ${produto.nome}. Disponivel: ${produto.unidades_em_estoque}`
      );
    }
  }

  const transacao = db.transaction(() => {
    const pedido = Order.criar(usuarioId, carrinho.valorTotalEmCentavos);

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

    Cart.limpar(usuarioId);

    return Order.buscarPorId(pedido.id, usuarioId);
  });

  return transacao();
}

module.exports = { criarPedidoDoCarrinho };
