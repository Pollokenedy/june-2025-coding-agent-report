// Express server for idea collection app
const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const UPLOADS_DIR = path.join(__dirname, '../uploads');

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Helper: Load and save ideas
function loadIdeas() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function saveIdeas(ideas) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(ideas, null, 2));
}

// GET /ideas - list all ideas sorted by votes
app.get('/ideas', (req, res) => {
  const ideas = loadIdeas();
  ideas.sort((a, b) => b.votes - a.votes);
  res.json(ideas);
});

// POST /ideas - create new idea
app.post('/ideas', upload.array('attachments'), (req, res) => {
  const { title, notes } = req.body;
  const attachments = req.files ? req.files.map(f => `/uploads/${path.basename(f.path)}`) : [];
  const ideas = loadIdeas();
  const newIdea = {
    id: Date.now().toString(),
    title,
    notes: notes ? [notes] : [],
    attachments,
    votes: 0
  };
  ideas.push(newIdea);
  saveIdeas(ideas);
  res.status(201).json(newIdea);
});

// POST /ideas/:id/vote - vote for an idea
app.post('/ideas/:id/vote', (req, res) => {
  const ideas = loadIdeas();
  const idea = ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  idea.votes++;
  saveIdeas(ideas);
  res.json(idea);
});

// POST /ideas/:id/notes - add note or attachment to idea
app.post('/ideas/:id/notes', upload.array('attachments'), (req, res) => {
  const { note } = req.body;
  const attachments = req.files ? req.files.map(f => `/uploads/${path.basename(f.path)}`) : [];
  const ideas = loadIdeas();
  const idea = ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  if (note) idea.notes.push(note);
  if (attachments.length) {
    if (!idea.attachments) idea.attachments = [];
    idea.attachments.push(...attachments);
  }
  saveIdeas(ideas);
  res.json(idea);
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
