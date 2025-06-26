const express = require('express');
const sqlite3 = require('sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const db = new sqlite3.Database(path.join(__dirname, 'data.db'));
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const upload = multer({ dest: uploadDir });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      notes TEXT,
      votes INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id INTEGER,
      file_name TEXT,
      original_name TEXT,
      FOREIGN KEY(idea_id) REFERENCES ideas(id)
    )`);
  });
}

initDb();

app.get('/ideas', (req, res) => {
  db.all(
    `SELECT i.*, (
      SELECT COUNT(*) FROM attachments a WHERE a.idea_id = i.id
    ) AS attachment_count FROM ideas i ORDER BY votes DESC, created_at DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/ideas', upload.array('files'), (req, res) => {
  const { title, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  db.run(
    'INSERT INTO ideas (title, notes) VALUES (?, ?)',
    [title, notes || ''],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const ideaId = this.lastID;
      if (req.files) {
        const stmt = db.prepare('INSERT INTO attachments (idea_id, file_name, original_name) VALUES (?, ?, ?)');
        req.files.forEach(f => stmt.run(ideaId, f.filename, f.originalname));
        stmt.finalize(() => res.json({ id: ideaId }));
      } else {
        res.json({ id: ideaId });
      }
    }
  );
});

app.post('/ideas/:id/vote', (req, res) => {
  db.run('UPDATE ideas SET votes = votes + 1 WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  });
});

app.put('/ideas/:id', upload.array('files'), (req, res) => {
  const { notes } = req.body;
  db.run('UPDATE ideas SET notes = ? WHERE id = ?', [notes || '', req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'not found' });
    if (req.files) {
      const stmt = db.prepare('INSERT INTO attachments (idea_id, file_name, original_name) VALUES (?, ?, ?)');
      req.files.forEach(f => stmt.run(req.params.id, f.filename, f.originalname));
      stmt.finalize(() => res.json({ success: true }));
    } else {
      res.json({ success: true });
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

module.exports = app;
