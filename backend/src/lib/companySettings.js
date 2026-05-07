const db = require('../db');

function normalizeCurrency(value) {
  if (typeof value !== 'string') return null;
  const currency = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(currency) ? currency : null;
}

async function getDefaultCurrency(conn = db) {
  try {
    const [rows] = await conn.query(
      'SELECT default_currency FROM company_settings WHERE id = ?',
      ['singleton'],
    );
    return normalizeCurrency(rows[0]?.default_currency) || 'EUR';
  } catch {
    return 'EUR';
  }
}

module.exports = { getDefaultCurrency, normalizeCurrency };
