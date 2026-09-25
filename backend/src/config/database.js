const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbPath = process.env.DB_PATH || './data/koryo.db';
const dbFullPath = path.resolve(dbPath);

const dbDir = path.dirname(dbFullPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbFullPath);
db.pragma('foreign_keys = ON');

const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
if (fs.existsSync(schemaPath)) {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
}

const adminGeral = db.prepare('SELECT id FROM usuarios WHERE id = 0').get();
if (!adminGeral) {
  const hash = bcrypt.hashSync('admin', 10);
  db.prepare(
    "INSERT INTO usuarios (id, email, senha_hash, nome_completo, tipo) VALUES (0, 'admin@gmail.com', ?, 'Administrador Geral', 'admin_geral')"
  ).run(hash);
}

console.log(`Banco conectado: ${dbFullPath}`);

module.exports = db;
