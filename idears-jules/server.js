const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const { loadIdeas, saveIdeas } = require('./storage');

const app = express();
const port = 3000;
const dataDir = path.join(__dirname, 'data');
const uploadDir = path.join(dataDir, 'uploads');

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from 'public' directory
app.use(express.static('public'));

// Serve files from 'data/uploads' directory under '/uploads' path
app.use('/uploads', express.static(path.join(__dirname, 'data', 'uploads')));


// Create data and data/uploads directories if they don't exist
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // cb(null, file.originalname); // Using original name might cause conflicts
    cb(null, `${uuidv4()}-${file.originalname}`); // Add uuid to prevent name conflicts
  }
});
const upload = multer({ storage: storage });

app.get('/', (req, res) => {
  res.send('Hello World!');
});

// GET /ideas - Retrieve all ideas, sorted by votes
app.get('/ideas', (req, res) => {
  const ideas = loadIdeas();
  ideas.sort((a, b) => b.votes - a.votes);
  res.json(ideas);
});

// POST /ideas/:id/vote - Vote for an idea
app.post('/ideas/:id/vote', (req, res) => {
  const { id } = req.params;
  const ideas = loadIdeas();
  const ideaIndex = ideas.findIndex(idea => idea.id === id);

  if (ideaIndex === -1) {
    return res.status(404).json({ error: 'Idea not found' });
  }

  ideas[ideaIndex].votes += 1;
  ideas[ideaIndex].updatedAt = new Date().toISOString();
  saveIdeas(ideas);
  res.json(ideas[ideaIndex]);
});

// POST /ideas/:id/notes - Add a note to an idea
app.post('/ideas/:id/notes', (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  if (!note) {
    return res.status(400).json({ error: 'Note text is required' });
  }

  const ideas = loadIdeas();
  const ideaIndex = ideas.findIndex(idea => idea.id === id);

  if (ideaIndex === -1) {
    return res.status(404).json({ error: 'Idea not found' });
  }

  // Add the new note to the notes array
  if (!Array.isArray(ideas[ideaIndex].notes)) {
    ideas[ideaIndex].notes = []; // Initialize as array if it's not (e.g. old data)
  }
  ideas[ideaIndex].notes.push(note);
  ideas[ideaIndex].updatedAt = new Date().toISOString();
  saveIdeas(ideas);
  res.json(ideas[ideaIndex]);
});

// POST /ideas/:id/attachments - Add an attachment to an idea
app.post('/ideas/:id/attachments', upload.single('attachmentFile'), (req, res) => {
  const { id } = req.params;
  const ideas = loadIdeas();
  const ideaIndex = ideas.findIndex(idea => idea.id === id);

  if (ideaIndex === -1) {
    // If idea not found, delete uploaded file if any (multer might have saved it before this check)
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(404).json({ error: 'Idea not found' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'File attachment is required' });
  }

  const idea = ideas[ideaIndex];
  if (!Array.isArray(idea.attachments)) {
    idea.attachments = []; // Initialize if not already an array
  }

  const attachment = {
    filename: req.file.originalname,
    filepath: req.file.path, // Path where multer stored the file
    mimetype: req.file.mimetype,
    size: req.file.size,
  };
  idea.attachments.push(attachment);
  idea.updatedAt = new Date().toISOString();

  saveIdeas(ideas);
  res.json(idea);
});

// POST /ideas - Create a new idea
app.post('/ideas', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const ideas = loadIdeas();
  const newIdea = {
    id: uuidv4(),
    text,
    votes: 0,
    notes: [], // Initialize notes as an empty array
    attachments: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  ideas.push(newIdea);
  saveIdeas(ideas);
  res.status(201).json(newIdea);
});

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

module.exports = { app, server };
