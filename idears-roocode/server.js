const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const IDEAS_FILE = path.join(DATA_DIR, 'ideas.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure data directory and ideas file exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(IDEAS_FILE)) {
    fs.writeFileSync(IDEAS_FILE, JSON.stringify([]));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // For serving static files like HTML, CSS, JS
app.use('/data/uploads', express.static(path.join(__dirname, 'data', 'uploads'))); // Serve uploaded files

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Helper function to read ideas
function getIdeas() {
    const ideasData = fs.readFileSync(IDEAS_FILE);
    return JSON.parse(ideasData);
}

// Helper function to save ideas
function saveIdeas(ideas) {
    fs.writeFileSync(IDEAS_FILE, JSON.stringify(ideas, null, 2));
}

// API Routes

// Get all ideas
app.get('/api/ideas', (req, res) => {
    const ideas = getIdeas();
    // Sort by votes (descending) then by creation time (ascending)
    ideas.sort((a, b) => (b.votes || 0) - (a.votes || 0) || (a.createdAt || 0) - (b.createdAt || 0));
    res.json(ideas);
});

// Add a new idea
app.post('/api/ideas', upload.array('attachments'), (req, res) => {
    const ideas = getIdeas();
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ message: 'Idea text is required' });
    }
    const newIdea = {
        id: Date.now().toString(),
        text,
        votes: 0,
        notes: [],
        attachments: req.files ? req.files.map(file => ({ filename: file.filename, originalname: file.originalname, path: file.path })) : [],
        createdAt: Date.now()
    };
    ideas.push(newIdea);
    saveIdeas(ideas);
    res.status(201).json(newIdea);
});

// Vote for an idea
app.post('/api/ideas/:id/vote', (req, res) => {
    const ideas = getIdeas();
    const idea = ideas.find(i => i.id === req.params.id);
    if (idea) {
        idea.votes = (idea.votes || 0) + 1;
        saveIdeas(ideas);
        res.json(idea);
    } else {
        res.status(404).json({ message: 'Idea not found' });
    }
});

// Add a note to an idea
app.post('/api/ideas/:id/notes', (req, res) => {
    const ideas = getIdeas();
    const idea = ideas.find(i => i.id === req.params.id);
    if (idea) {
        const { noteText } = req.body;
        if (!noteText) {
            return res.status(400).json({ message: 'Note text is required' });
        }
        const newNote = {
            id: Date.now().toString(),
            text: noteText,
            createdAt: Date.now()
        };
        idea.notes = idea.notes || [];
        idea.notes.push(newNote);
        saveIdeas(ideas);
        res.status(201).json(newNote);
    } else {
        res.status(404).json({ message: 'Idea not found' });
    }
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app; // Export for testing