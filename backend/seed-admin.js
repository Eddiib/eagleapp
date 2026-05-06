const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('./src/db');

async function seed() {
  const hash = await bcrypt.hash('admin123', 10);
  const id = uuidv4();

  await db.query(
    `INSERT INTO users (id, username, email, password_hash, role)
     VALUES (?, 'admin', 'eagle.com', ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [id, hash]
  );

  console.log('✓ Admin user ready');
  console.log('  Username : admin');
  console.log('  Password : admin123');
  console.log('  Role     : admin');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
