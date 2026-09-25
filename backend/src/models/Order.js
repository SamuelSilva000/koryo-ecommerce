const db = require('../config/database');

const Order = {
  criar(usuarioId, valorTotalEmCentavos) {
    const result = db.prepare(
      'INSERT INTO pedidos (usuario_id, valor_total_em_centavos, status) VALUES (?, ?, ?)'
    ).run(usuarioId, valorTotalEmCentavos, 'pendente');
    return db.prepare('SELECT * FROM pedidos WHERE id = ?').get(result.lastInsertRowid);
  },

  criarItem({ pedidoId, produtoId, nomeProduto, precoEmCentavos, quantidade, tamanho }) {
    const subtotal = precoEmCentavos * quantidade;
    return db.prepare(`
      INSERT INTO itens_pedido (pedido_id, produto_id, nome_produto, preco_do_produto_em_centavos, quantidade, subtotal_em_centavos, tamanho)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(pedidoId, produtoId, nomeProduto, precoEmCentavos, quantidade, subtotal, tamanho || 'unico');
  },

  buscarPorId(id, usuarioId) {
    const pedido = db.prepare(
      'SELECT * FROM pedidos WHERE id = ? AND usuario_id = ?'
    ).get(id, usuarioId);
    if (!pedido) return null;

    const itens = db.prepare(`
      SELECT id, produto_id, nome_produto, preco_do_produto_em_centavos, quantidade, subtotal_em_centavos, tamanho
      FROM itens_pedido WHERE pedido_id = ? ORDER BY id
    `).all(id);

    return {
      id: pedido.id,
      usuarioId: pedido.usuario_id,
      valorTotalEmCentavos: pedido.valor_total_em_centavos,
      status: pedido.status,
      criadoEm: pedido.criado_em,
      itens: itens.map((i) => ({
        id: i.id,
        produtoId: i.produto_id,
        nomeProduto: i.nome_produto,
        precoEmCentavos: i.preco_do_produto_em_centavos,
        quantidade: i.quantidade,
        subtotalEmCentavos: i.subtotal_em_centavos,
        tamanho: i.tamanho,
      })),
    };
  },

  listarPorUsuario(usuarioId) {
    return db.prepare(
      'SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY id DESC'
    ).all(usuarioId);
  },

  atualizarStatus(id, status) {
    db.prepare(
      'UPDATE pedidos SET status = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(status, id);
  },
};

module.exports = Order;
