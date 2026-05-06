require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

async function main() {
  const config = {
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'transport',
    multipleStatements: true,
  };
  if (process.env.DB_SOCKET) {
    config.socketPath = process.env.DB_SOCKET;
  } else {
    config.host = process.env.DB_HOST || 'localhost';
    config.port = Number(process.env.DB_PORT) || 3306;
  }

  const conn = await mysql.createConnection(config);

  await conn.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME     DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [applied] = await conn.query('SELECT version FROM schema_migrations');
  const appliedSet = new Set(applied.map(r => r.version));

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort();

  let ranCount = 0;
  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`  ✓ ${file} (already applied)`);
      continue;
    }
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    process.stdout.write(`  → ${file} ... `);
    try {
      await conn.query(sql);
      await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [file]);
      console.log('done');
      ranCount++;
    } catch (err) {
      console.log('FAILED');
      console.error(err.message);
      await conn.end();
      process.exit(1);
    }
  }

  console.log(ranCount ? `\n✓ Applied ${ranCount} migration(s)` : '\n✓ Database is up to date');
  await conn.end();
}

main().catch(err => { console.error(err); process.exit(1); });
