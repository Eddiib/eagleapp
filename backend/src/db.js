require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transport',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
};

if (process.env.DB_SOCKET) {
  config.socketPath = process.env.DB_SOCKET;
} else {
  config.host = process.env.DB_HOST || 'localhost';
  config.port = Number(process.env.DB_PORT) || 3306;
}

const pool = mysql.createPool(config);

module.exports = pool;
