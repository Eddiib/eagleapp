const { v4: uuidv4 } = require('uuid');

// Lightweight audit logger. Callers supply the same db handle (or transaction
// connection) they used for the mutation, so the audit row lands in the same
// transaction and rolls back together on failure.
//
// Usage (INSERT):   await logAudit(conn, { tableName: 'bookings', rowId: id,  action: 'INSERT', actor: req.user, after:  row });
// Usage (UPDATE):   await logAudit(conn, { tableName: 'bookings', rowId: id,  action: 'UPDATE', actor: req.user, before: prevRow, after: newRow });
// Usage (DELETE):   await logAudit(conn, { tableName: 'bookings', rowId: id,  action: 'DELETE', actor: req.user, before: prevRow });

async function logAudit(conn, { tableName, rowId, action, actor, before, after }) {
  if (!conn || !tableName || !rowId || !action) return;
  const id = uuidv4();
  const actorId   = actor?.id   ?? null;
  const actorName = actor?.display_name ?? actor?.username ?? null;
  await conn.query(
    `INSERT INTO audit_log (id, table_name, row_id, action, actor_id, actor_name, before_data, after_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, tableName, rowId, action, actorId, actorName,
      before ? JSON.stringify(before) : null,
      after  ? JSON.stringify(after)  : null,
    ],
  );
}

// Fetches a single row by id from a given table. Helper for "capture the
// before-state" in UPDATE/DELETE handlers. Returns null if the row is gone.
async function snapshotRow(conn, tableName, rowId) {
  const safeTable = String(tableName).replace(/[^a-zA-Z0-9_]/g, '');
  const [rows] = await conn.query(`SELECT * FROM ${safeTable} WHERE id = ? LIMIT 1`, [rowId]);
  return rows.length ? rows[0] : null;
}

module.exports = { logAudit, snapshotRow };
