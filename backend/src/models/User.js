const bcrypt = require('bcryptjs');
const db = require('../config/database');

const User = {
  criar({ email, senha, nomeCompleto, tipo = 'cliente' }) {
    const senhaHash = bcrypt.hashSync(senha, 10);
    const stmt = db.prepare(
      'INSERT INTO usuarios (email, senha_hash, nome_completo, tipo) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(email, senhaHash, nomeCompleto, tipo);
    return this.buscarPorId(result.lastInsertRowid);
  },

  buscarPorId(id) {
    return db.prepare(
      'SELECT id, email, nome_completo, tipo, criado_em FROM usuarios WHERE id = ?'
    ).get(id);
  },

  buscarPorEmail(email) {
    return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  },

  verificarSenha(senhaTexto, senhaHash) {
    return bcrypt.compareSync(senhaTexto, senhaHash);
  },

  listarTodos() {
    return db.prepare(
      'SELECT id, email, nome_completo, tipo, criado_em FROM usuarios ORDER BY id'
    ).all();
  },

  atualizar(id, { nomeCompleto, tipo }) {
    db.prepare(
      'UPDATE usuarios SET nome_completo = ?, tipo = ?, atualizado_em = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(nomeCompleto, tipo, id);
    return this.buscarPorId(id);
  },

  deletar(id) {
    const transacao = db.transaction(() => {
      const carrinho = db.prepare('SELECT id FROM carrinhos WHERE usuario_id = ?').get(id);
      if (carrinho) {
        db.prepare('DELETE FROM itens_carrinho WHERE carrinho_id = ?').run(carrinho.id);
        db.prepare('DELETE FROM carrinhos WHERE id = ?').run(carrinho.id);
      }

      const pedidos = db.prepare('SELECT id FROM pedidos WHERE usuario_id = ?').all(id);
      for (const p of pedidos) {
        db.prepare('DELETE FROM itens_pedido WHERE pedido_id = ?').run(p.id);
      }
      db.prepare('DELETE FROM pedidos WHERE usuario_id = ?').run(id);

      return db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);
    });
    return transacao();
  },
};

module.exports = User;
