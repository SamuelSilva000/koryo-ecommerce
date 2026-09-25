const db = require('../config/database');

const Cart = {
  obterOuCriar(usuarioId) {
    let carrinho = db.prepare('SELECT * FROM carrinhos WHERE usuario_id = ?').get(usuarioId);
    if (!carrinho) {
      const result = db.prepare('INSERT INTO carrinhos (usuario_id) VALUES (?)').run(usuarioId);
      carrinho = db.prepare('SELECT * FROM carrinhos WHERE id = ?').get(result.lastInsertRowid);
    }
    return carrinho;
  },

  buscarComItens(usuarioId) {
    const carrinho = this.obterOuCriar(usuarioId);
    const itens = db.prepare(`
      SELECT ic.id, ic.produto_id, ic.quantidade, ic.tamanho,
             p.nome AS nome_produto, p.marca, p.numeracao, p.cor,
             p.preco_em_centavos, p.unidades_em_estoque, p.imagem_principal_id
      FROM itens_carrinho ic
      JOIN produtos p ON p.id = ic.produto_id
      WHERE ic.carrinho_id = ?
      ORDER BY ic.id
    `).all(carrinho.id);

    const itensFormatados = itens.map((i) => ({
      id: i.id,
      produtoId: i.produto_id,
      nomeProduto: i.nome_produto,
      marca: i.marca,
      numeracao: i.numeracao,
      cor: i.cor,
      tamanho: i.tamanho,
      precoEmCentavos: i.preco_em_centavos,
      unidadesEmEstoque: i.unidades_em_estoque,
      imagemPrincipalId: i.imagem_principal_id,
      quantidade: i.quantidade,
      subtotalEmCentavos: i.preco_em_centavos * i.quantidade,
    }));

    const valorTotalEmCentavos = itensFormatados.reduce((t, i) => t + i.subtotalEmCentavos, 0);

    return {
      id: carrinho.id,
      itens: itensFormatados,
      items: itensFormatados,
      valorTotalEmCentavos,
      totalInCents: valorTotalEmCentavos,
    };
  },

  adicionarItem(usuarioId, produtoId, quantidade, tamanho = 'unico') {
    const carrinho = this.obterOuCriar(usuarioId);
    const existente = db.prepare(
      'SELECT * FROM itens_carrinho WHERE carrinho_id = ? AND produto_id = ? AND tamanho = ?'
    ).get(carrinho.id, produtoId, tamanho);

    if (existente) {
      db.prepare(
        'UPDATE itens_carrinho SET quantidade = quantidade + ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(quantidade, existente.id);
    } else {
      db.prepare(
        'INSERT INTO itens_carrinho (carrinho_id, produto_id, quantidade, tamanho) VALUES (?, ?, ?, ?)'
      ).run(carrinho.id, produtoId, quantidade, tamanho);
    }
    return this.buscarComItens(usuarioId);
  },

  atualizarItem(usuarioId, produtoId, quantidade, tamanho = 'unico') {
    const carrinho = this.obterOuCriar(usuarioId);
    db.prepare(
      'UPDATE itens_carrinho SET quantidade = ?, atualizado_em = CURRENT_TIMESTAMP WHERE carrinho_id = ? AND produto_id = ? AND tamanho = ?'
    ).run(quantidade, carrinho.id, produtoId, tamanho);
    return this.buscarComItens(usuarioId);
  },

  removerItem(usuarioId, produtoId, tamanho = 'unico') {
    const carrinho = this.obterOuCriar(usuarioId);
    db.prepare(
      'DELETE FROM itens_carrinho WHERE carrinho_id = ? AND produto_id = ? AND tamanho = ?'
    ).run(carrinho.id, produtoId, tamanho);
    return this.buscarComItens(usuarioId);
  },

  limpar(usuarioId) {
    const carrinho = this.obterOuCriar(usuarioId);
    db.prepare('DELETE FROM itens_carrinho WHERE carrinho_id = ?').run(carrinho.id);
    return this.buscarComItens(usuarioId);
  },
};

module.exports = Cart;
