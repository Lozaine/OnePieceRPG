require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connected to the database!');
});

const testConnection = async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connection test successful:', res.rows[0]);
  } catch (err) {
    console.error('Database connection test failed:', err);
  }
};

module.exports = {
  pool,
  testConnection,
};
