const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { DATA_DIR, DB_PATH } = require('./config');

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA foreign_keys = ON');
db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));

function findById(table, id) {
  return db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
}

function insert(table, values) {
  const columns = Object.keys(values);
  const placeholders = columns.map((column) => `@${column}`);
  const { lastInsertRowid } = db
    .prepare(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`)
    .run(values);
  return findById(table, lastInsertRowid);
}

function update(table, id, values) {
  const assignments = Object.keys(values).map((column) => `${column} = @${column}`);
  db.prepare(`UPDATE ${table} SET ${assignments.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run({
    ...values,
    id,
  });
  return findById(table, id);
}

function transaction(work) {
  db.exec('BEGIN');
  try {
    const result = work();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = { db, findById, insert, update, transaction };
