const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'ideas.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Ensure data directory and uploads directory exist
if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}

const PUBLIC_DIR = path.join(__dirname, 'public');
if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR);
}

// Initialize data file if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Middleware
app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory
app.use('/uploads', express.static(UPLOADS_DIR)); // Serve uploaded files

// Helper function to read ideas
const readIdeas = () => {
    const data = fs.readFileSync(DATA_FILE);
    return JSON.parse(data);
};

// Helper function to write ideas
const writeIdeas = (ideas) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(ideas, null, 2));
};

// API Routes (to be implemented)

// GET /api/ideas - List all ideas
app.get('/api/ideas', (req, res) => {
    const ideas = readIdeas();
    // Sort by votes descending, then by creation date descending
    ideas.sort((a, b) => (b.votes - a.votes) || (new Date(b.createdAt) - new Date(a.createdAt)));
    res.json(ideas);
});

// POST /api/ideas - Create a new idea
app.post('/api/ideas', (req, res) => {
    const ideas = readIdeas();
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: 'Idea text is required' });
    }
    const newIdea = {
        id: uuidv4(),
        text,
        votes: 0,
        notes: [],
        files: [],
        createdAt: new Date().toISOString()
    };
    ideas.push(newIdea);
    writeIdeas(ideas);
    res.status(201).json(newIdea);
});

// POST /api/ideas/:id/vote - Vote for an idea
app.post('/api/ideas/:id/vote', (req, res) => {
    const ideas = readIdeas();
    const idea = ideas.find(i => i.id === req.params.id);
    if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
    }
    idea.votes += 1;
    writeIdeas(ideas);
    res.json(idea);
});

// POST /api/ideas/:id/notes - Add a note to an idea
app.post('/api/ideas/:id/notes', (req, res) => {
    const ideas = readIdeas();
    const idea = ideas.find(i => i.id === req.params.id);
    if (!idea) {
        return res.status(404).json({ error: 'Idea not found' });
    }
    const { noteText } = req.body;
    if (!noteText) {
        return res.status(400).json({ error: 'Note text is required' });
    }
    idea.notes.push({ id: uuidv4(), text: noteText, createdAt: new Date().toISOString() });
    writeIdeas(ideas);
    res.json(idea);
});


// File upload setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// POST /api/ideas/:id/files - Attach a file to an idea
app.post('/api/ideas/:id/files', upload.single('file'), (req, res) => {
    const ideas = readIdeas();
    const idea = ideas.find(i => i.id === req.params.id);
    if (!idea) {
        if (req.file) { // Cleanup uploaded file if idea not found
            fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ error: 'Idea not found' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'File is required' });
    }
    idea.files.push({
        id: uuidv4(),
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}`, // Path to access the file
        createdAt: new Date().toISOString()
    });
    writeIdeas(ideas);
    res.json(idea);
});


// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app; // For testing
