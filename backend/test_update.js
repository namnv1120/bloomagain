const db = require('./db/database');
try {
  const result = db.prepare('UPDATE suggestions SET label=? WHERE id=?').run('Test update', 1);
  console.log('Update result:', result);
} catch (e) {
  console.error('Update error:', e);
}
