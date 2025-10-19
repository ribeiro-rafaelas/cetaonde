const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE
});

pool.on('error', (err) => {
  console.error('Erro inesperado na conexão com o banco de dados', err);
  process.exit(1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
