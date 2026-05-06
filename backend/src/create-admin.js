#!/usr/bin/env node
/**
 * One-time script to create the first admin user.
 * Usage: node src/create-admin.js <username> <email> <password>
 *
 * Example:
 *   node src/create-admin.js admin admin@eagleshipping-ks.com MySecret123
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

async function main() {
  const [,, username, email, password] = process.argv;

  if (!username || !email || !password) {
    console.error('Usage: node src/create-admin.js <username> <email> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const id = uuidv4();

  await db.query(
    'INSERT INTO users (id, username, email, password_hash, role) VALUES (?,?,?,?,?)',
    [id, username, email, hash, 'admin']
  );

  console.log(`Admin user "${username}" created successfully (id: ${id})`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
