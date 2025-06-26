const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const db = require('./db');

const app = express();

const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const uploadDir = path.join(dataDir, 'uploads');
if (process.env.NODE_ENV !== 'test') {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use('/static', express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  const ideas = db.get('ideas').sortBy('votes').reverse().value();
  res.render('index', { ideas });
});

app.post('/ideas', (req, res) => {
  const { title } = req.body;
  if (!title) return res.redirect('/');
  const newIdea = {
    id: uuidv4(),
    title,
    votes: 0,
    createdAt: new Date().toISOString(),
    notes: [],
  };
  db.get('ideas').push(newIdea).write();
  res.redirect('/');
});

app.post('/ideas/:id/vote', (req, res) => {
  const { id } = req.params;
  const idea = db.get('ideas').find({ id }).value();
  if (idea) {
    db.get('ideas').find({ id }).assign({ votes: idea.votes + 1 }).write();
  }
  res.redirect('/');
});

app.get('/ideas/:id', (req, res) => {
  const { id } = req.params;
  const idea = db.get('ideas').find({ id }).value();
  if (!idea) {
    return res.status(404).send('Idea not found');
  }
  res.render('idea', { idea });
});

app.post('/ideas/:id/notes', upload.array('attachments', 5), (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const ideaRef = db.get('ideas').find({ id });
  const idea = ideaRef.value();
  if (!idea) {
    return res.status(404).send('Idea not found');
  }
  const attachments = (req.files || []).map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }));
  const note = {
    id: uuidv4(),
    text,
    createdAt: new Date().toISOString(),
    attachments,
  };
  ideaRef.get('notes').push(note).write();
  res.redirect(`/ideas/${id}`);
});

app.get('/api/ideas', (req, res) => {
  const ideas = db.get('ideas').sortBy('votes').reverse().value();
  res.json({ ideas });
});

app.post('/api/ideas', (req, res) => {
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newIdea = {
    id: uuidv4(),
    title,
    votes: 0,
    createdAt: new Date().toISOString(),
    notes: [],
  };
  db.get('ideas').push(newIdea).write();
  res.status(201).json({ idea: newIdea });
});

app.post('/api/ideas/:id/vote', (req, res) => {
  const { id } = req.params;
  const idea = db.get('ideas').find({ id }).value();
  if (!idea) {
    return res.status(404).json({ error: 'Idea not found' });
  }
  const updated = db.get('ideas').find({ id }).assign({ votes: idea.votes + 1 }).write();
  res.json({ votes: updated.votes });
});

app.get('/api/ideas/:id/notes', (req, res) => {
  const { id } = req.params;
  const idea = db.get('ideas').find({ id }).value();
  if (!idea) {
    return res.status(404).json({ error: 'Idea not found' });
  }
  res.json({ notes: idea.notes });
});

app.post('/api/ideas/:id/notes', upload.array('attachments', 5), (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }
  const ideaRef = db.get('ideas').find({ id });
  const idea = ideaRef.value();
  if (!idea) {
    return res.status(404).json({ error: 'Idea not found' });
  }
  const attachments = (req.files || []).map(file => ({
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  }));
  const note = {
    id: uuidv4(),
    text,
    createdAt: new Date().toISOString(),
    attachments,
  };
  ideaRef.get('notes').push(note).write();
  res.status(201).json({ note });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}