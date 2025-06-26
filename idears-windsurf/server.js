const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// File upload configuration
const upload = multer({
  dest: 'uploads/'
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/idea-collector', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Idea Schema
const ideaSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  votes: { type: Number, default: 0 },
  notes: [{
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  attachments: [{
    filename: String,
    path: String,
    originalname: String
  }],
  createdAt: { type: Date, default: Date.now }
});

const Idea = mongoose.model('Idea', ideaSchema);

// Routes
app.get('/ideas', async (req, res) => {
  try {
    const ideas = await Idea.find().sort({ votes: -1 });
    res.json(ideas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ideas', async (req, res) => {
  try {
    const idea = new Idea(req.body);
    await idea.save();
    res.status(201).json(idea);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/ideas/:id/vote', async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }
    idea.votes++;
    await idea.save();
    res.json(idea);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ideas/:id/notes', upload.single('attachment'), async (req, res) => {
  try {
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    const note = {
      content: req.body.content,
      timestamp: new Date()
    };

    if (req.file) {
      note.attachment = {
        filename: req.file.filename,
        path: req.file.path,
        originalname: req.file.originalname
      };
    }

    idea.notes.push(note);
    await idea.save();
    res.json(idea);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
