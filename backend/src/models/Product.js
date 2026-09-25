const db = require('../config/database');

const Product = {
  listar({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const items = db.prepare(
      'SELECT * FROM produtos ORDER BY id LIMIT ? OFFSET ?'
    ).all(limit, offset);
    const total = db.prepare('SELECT COUNT(*) as total FROM produtos').get().total;
    return {
      products: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  },

  buscarPorNome(termo) {
    const busca = `%${termo}%`;
    return db.prepare(
      'SELECT * FROM produtos WHERE nome LIKE ? OR marca LIKE ? OR numeracao LIKE ? ORDER BY nome'
    ).all(busca, busca, busca);
  },

  criar({ nome, marca, descricao, numeracao, cor, precoEmCentavos, unidadesEmEstoque, imagemPrincipalId }) {
    const stmt = db.prepare(`
      INSERT INTO produtos (nome, marca, descricao, numeracao, cor, preco_em_centavos, unidades_em_estoque, imagem_principal_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      nome, marca, descricao, numeracao, cor,
      precoEmCentavos, unidadesEmEstoque, imagemPrincipalId
    );
    return this.buscarPorId(result.lastInsertRowid);
  },

  atualizar(id, dados) {
    const atual = this.buscarPorId(id);
    if (!atual) return null;

    db.prepare(`
      UPDATE produtos
      SET nome = ?, marca = ?, descricao = ?, numeracao = ?, cor = ?,
          preco_em_centavos = ?, unidades_em_estoque = ?, imagem_principal_id = ?,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      dados.nome ?? atual.nome,
      dados.marca ?? atual.marca,
      dados.descricao ?? atual.descricao,
      dados.numeracao ?? atual.numeracao,
      dados.cor ?? atual.cor,
      dados.precoEmCentavos ?? atual.preco_em_centavos,
      dados.unidadesEmEstoque ?? atual.unidades_em_estoque,
      dados.imagemPrincipalId ?? atual.imagem_principal_id,
      id
    );
    return this.buscarPorId(id);
  },

  deletar(id) {
    const transacao = db.transaction(() => {
      db.prepare('DELETE FROM itens_carrinho WHERE produto_id = ?').run(id);
      return db.prepare('DELETE FROM produtos WHERE id = ?').run(id);
    });
    return transacao();
  },

  reduzirEstoque(id, quantidade) {
    return db.prepare(
      'UPDATE produtos SET unidades_em_estoque = unidades_em_estoque - ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(quantidade, id);
  },
};

module.exports = Product;
