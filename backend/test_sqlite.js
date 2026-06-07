const db = require('./db/database');
try {
  db.prepare("UPDATE facilities SET updated_at=datetime('now') WHERE id=1").run();
  console.log('success');
} catch (e) {
  console.error(e.message);
}
