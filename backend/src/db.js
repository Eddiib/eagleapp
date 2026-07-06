require('dotenv').config();
const mysql = require('mysql2/promise');

const config = {
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'transport',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  // Return DATE columns as plain 'YYYY-MM-DD' strings. Hydrating them as JS
  // Date objects makes JSON serialization shift them to UTC, which moves
  // effective_date / planned_date / etd / eta one day early on servers east
  // of UTC. DATETIME/TIMESTAMP columns keep their Date-object behavior.
  dateStrings: ['DATE'],
};

if (process.env.DB_SOCKET) {
  config.socketPath = process.env.DB_SOCKET;
} else {
  config.host = process.env.DB_HOST || 'localhost';
  config.port = Number(process.env.DB_PORT) || 3306;
}

const pool = mysql.createPool(config);

module.exports = pool;
