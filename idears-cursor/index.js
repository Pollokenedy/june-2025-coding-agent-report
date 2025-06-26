import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Setup storage for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });

// Setup lowdb
const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { ideas: [] });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
async function initDB() {
  await db.read();
  db.data ||= { ideas: [] };
  await db.write();
}

// Get all ideas, sorted by votes desc
app.get('/ideas', async (req, res) => {
  await db.read();
  const ideas = db.data.ideas.sort((a, b) => b.votes - a.votes);
  res.json(ideas);
});

// Add a new idea
app.post('/ideas', async (req, res) => {
  const { title, notes } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  await db.read();
  const idea = { id: nanoid(), title, notes: notes || '', votes: 0, files: [] };
  db.data.ideas.push(idea);
  await db.write();
  res.status(201).json(idea);
});

// Vote for an idea
app.post('/ideas/:id/vote', async (req, res) => {
  await db.read();
  const idea = db.data.ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  idea.votes += 1;
  await db.write();
  res.json(idea);
});

// Add or update notes for an idea
app.post('/ideas/:id/notes', async (req, res) => {
  const { notes } = req.body;
  await db.read();
  const idea = db.data.ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  idea.notes = notes;
  await db.write();
  res.json(idea);
});

// Upload a file to an idea
app.post('/ideas/:id/files', upload.single('file'), async (req, res) => {
  await db.read();
  const idea = db.data.ideas.find(i => i.id === req.params.id);
  if (!idea) return res.status(404).json({ error: 'Idea not found' });
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const fileUrl = `/uploads/${req.file.filename}`;
  idea.files.push({ filename: req.file.originalname, url: fileUrl });
  await db.write();
  res.status(201).json({ filename: req.file.originalname, url: fileUrl });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

export default app; 