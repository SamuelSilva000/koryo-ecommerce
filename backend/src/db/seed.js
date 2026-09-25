require('dotenv').config();
const db = require('../config/database');

const roupas = [
  { nome: 'Camiseta Oversized Preta', marca: 'Koryo', descricao: 'Camiseta oversized em algodao premium com estampa minimalista.', numeracao: 'P/M/G/GG', cor: 'Preto', precoEmCentavos: 8990, unidadesEmEstoque: 40, imagemPrincipalId: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600' },
  { nome: 'Camiseta Basica Branca', marca: 'Koryo', descricao: 'Camiseta basica de algodao penteado, corte regular.', numeracao: 'P/M/G/GG', cor: 'Branco', precoEmCentavos: 5990, unidadesEmEstoque: 60, imagemPrincipalId: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600' },
  { nome: 'Moletom Hoodie Cinza', marca: 'Koryo', descricao: 'Moletom com capuz e bolso canguru, interior felpudo.', numeracao: 'P/M/G/GG', cor: 'Cinza', precoEmCentavos: 18990, unidadesEmEstoque: 25, imagemPrincipalId: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600' },
  { nome: 'Jaqueta Jeans Slim', marca: 'Levis', descricao: 'Jaqueta jeans com lavagem escura e corte slim.', numeracao: 'P/M/G/GG', cor: 'Azul Escuro', precoEmCentavos: 25990, unidadesEmEstoque: 18, imagemPrincipalId: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600' },
  { nome: 'Calca Cargo Preta', marca: 'Koryo', descricao: 'Calca cargo com bolsos laterais e tecido resistente.', numeracao: '38/40/42/44', cor: 'Preto', precoEmCentavos: 15990, unidadesEmEstoque: 30, imagemPrincipalId: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600' },
  { nome: 'Calca Jeans Skinny', marca: 'Levis', descricao: 'Calca jeans skinny com elastano, modelagem ajustada.', numeracao: '36/38/40/42/44', cor: 'Azul Medio', precoEmCentavos: 19990, unidadesEmEstoque: 35, imagemPrincipalId: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600' },
  { nome: 'Bermuda Sarja Bege', marca: 'Koryo', descricao: 'Bermuda em sarja com corte reto e confortavel.', numeracao: '38/40/42/44', cor: 'Bege', precoEmCentavos: 9990, unidadesEmEstoque: 28, imagemPrincipalId: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600' },
  { nome: 'Shorts Moletom Cinza', marca: 'Koryo', descricao: 'Shorts de moletom com cordao e bolsos laterais.', numeracao: 'P/M/G/GG', cor: 'Cinza', precoEmCentavos: 7990, unidadesEmEstoque: 45, imagemPrincipalId: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600' },
  { nome: 'Camisa Social Slim Azul', marca: 'Aramis', descricao: 'Camisa social em algodao com caimento slim.', numeracao: 'P/M/G/GG', cor: 'Azul Claro', precoEmCentavos: 15990, unidadesEmEstoque: 22, imagemPrincipalId: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
  { nome: 'Blazer Preto Slim Fit', marca: 'Koryo', descricao: 'Blazer em tecido misto com forro interno e corte slim.', numeracao: 'P/M/G/GG', cor: 'Preto', precoEmCentavos: 34990, unidadesEmEstoque: 12, imagemPrincipalId: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600' },
  { nome: 'Vestido Midi Floral', marca: 'Zara', descricao: 'Vestido midi em viscose com estampa floral delicada.', numeracao: 'P/M/G', cor: 'Floral', precoEmCentavos: 17990, unidadesEmEstoque: 20, imagemPrincipalId: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600' },
  { nome: 'Saia Plissada Preta', marca: 'Koryo', descricao: 'Saia plissada midi com elastico na cintura.', numeracao: 'P/M/G', cor: 'Preto', precoEmCentavos: 12990, unidadesEmEstoque: 25, imagemPrincipalId: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600' },
];

const existentes = db.prepare('SELECT COUNT(*) as total FROM produtos').get().total;

if (existentes > 0) {
  console.log(`Ja existem ${existentes} produtos cadastrados. Pulando seed.`);
  process.exit(0);
}

const stmt = db.prepare(`
  INSERT INTO produtos (nome, marca, descricao, numeracao, cor, preco_em_centavos, unidades_em_estoque, imagem_principal_id)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const inserirMuitos = db.transaction((itens) => {
  for (const p of itens) {
    stmt.run(p.nome, p.marca, p.descricao, p.numeracao, p.cor, p.precoEmCentavos, p.unidadesEmEstoque, p.imagemPrincipalId);
  }
});

inserirMuitos(roupas);

console.log(`Seed concluido: ${roupas.length} roupas inseridas.`);
process.exit(0);
