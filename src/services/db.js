const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Function to test connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    client.release();
    return true;
  } catch (err) {
    console.error('Database connection error:', err);
    return false;
  }
};

module.exports = {
  pool,
  testConnection,
  query: (text, params) => pool.query(text, params),
}; 