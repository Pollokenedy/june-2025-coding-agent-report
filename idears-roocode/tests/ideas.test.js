const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server'); // Adjust path as necessary

const IDEAS_FILE = path.join(__dirname, '..', 'data', 'ideas.json');
const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');

// Helper function to reset the ideas file for a clean test environment
const resetIdeasFile = () => {
    if (fs.existsSync(IDEAS_FILE)) {
        fs.unlinkSync(IDEAS_FILE); // Delete if exists
    }
    // Ensure data directory exists (server.js also does this, but good for test setup)
    if (!fs.existsSync(path.dirname(IDEAS_FILE))) {
        fs.mkdirSync(path.dirname(IDEAS_FILE), { recursive: true });
    }
    fs.writeFileSync(IDEAS_FILE, JSON.stringify([])); // Create empty
};

// Helper function to clean up uploads directory
const cleanupUploads = () => {
    if (fs.existsSync(UPLOADS_DIR)) {
        fs.readdirSync(UPLOADS_DIR).forEach(file => {
            fs.unlinkSync(path.join(UPLOADS_DIR, file));
        });
    }
};

describe('Ideas API', () => {
    beforeEach(() => {
        resetIdeasFile();
        cleanupUploads();
        // Ensure uploads directory exists for tests that might create files
        if (!fs.existsSync(UPLOADS_DIR)) {
            fs.mkdirSync(UPLOADS_DIR, { recursive: true });
        }
    });

    afterAll(() => {
        resetIdeasFile(); // Clean up after all tests
        cleanupUploads();
        // if (fs.existsSync(UPLOADS_DIR)) { // Optionally remove uploads dir
        //     fs.rmdirSync(UPLOADS_DIR, { recursive: true });
        // }
    });

    describe('GET /api/ideas', () => {
        it('should return an empty array when no ideas exist', async () => {
            const res = await request(app).get('/api/ideas');
            expect(res.statusCode).toEqual(200);
            expect(res.body).toEqual([]);
        });

        it('should return existing ideas, sorted by votes and then creation time', async () => {
            const ideas = [
                { id: '1', text: 'Idea 1', votes: 0, createdAt: Date.now() - 1000, notes: [], attachments: [] },
                { id: '2', text: 'Idea 2', votes: 5, createdAt: Date.now() - 2000, notes: [], attachments: [] },
                { id: '3', text: 'Idea 3', votes: 5, createdAt: Date.now() - 500, notes: [], attachments: [] },
            ];
            fs.writeFileSync(IDEAS_FILE, JSON.stringify(ideas));
            const res = await request(app).get('/api/ideas');
            expect(res.statusCode).toEqual(200);
            expect(res.body.length).toBe(3);
            expect(res.body[0].id).toBe('2'); // Highest votes, older
            expect(res.body[1].id).toBe('3'); // Highest votes, newer
            expect(res.body[2].id).toBe('1');
        });
    });

    describe('POST /api/ideas', () => {
        it('should create a new idea without attachments', async () => {
            const ideaText = 'A brand new idea';
            const res = await request(app)
                .post('/api/ideas')
                .send({ text: ideaText });
            expect(res.statusCode).toEqual(201);
            expect(res.body.text).toBe(ideaText);
            expect(res.body.votes).toBe(0);
            expect(res.body.notes).toEqual([]);
            expect(res.body.attachments).toEqual([]);
            expect(res.body.id).toBeDefined();
            expect(res.body.createdAt).toBeDefined();

            const ideas = JSON.parse(fs.readFileSync(IDEAS_FILE));
            expect(ideas.length).toBe(1);
            expect(ideas[0].text).toBe(ideaText);
        });

        it('should return 400 if idea text is missing', async () => {
            const res = await request(app)
                .post('/api/ideas')
                .send({});
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Idea text is required');
        });

        it('should create a new idea with attachments', async () => {
            const ideaText = 'Idea with a file';
            const res = await request(app)
                .post('/api/ideas')
                .field('text', ideaText)
                .attach('attachments', Buffer.from('test file content'), 'test.txt');

            expect(res.statusCode).toEqual(201);
            expect(res.body.text).toBe(ideaText);
            expect(res.body.attachments.length).toBe(1);
            expect(res.body.attachments[0].originalname).toBe('test.txt');
            expect(res.body.attachments[0].filename).toBeDefined();

            const ideas = JSON.parse(fs.readFileSync(IDEAS_FILE));
            expect(ideas.length).toBe(1);
            expect(ideas[0].attachments.length).toBe(1);
            expect(fs.existsSync(path.join(UPLOADS_DIR, ideas[0].attachments[0].filename))).toBe(true);
        });
    });

    describe('POST /api/ideas/:id/vote', () => {
        it('should increment the vote count of an existing idea', async () => {
            const initialIdea = { id: 'test-id', text: 'Idea to vote on', votes: 0, createdAt: Date.now(), notes: [], attachments: [] };
            fs.writeFileSync(IDEAS_FILE, JSON.stringify([initialIdea]));

            const res = await request(app).post(`/api/ideas/${initialIdea.id}/vote`);
            expect(res.statusCode).toEqual(200);
            expect(res.body.votes).toBe(1);

            const ideas = JSON.parse(fs.readFileSync(IDEAS_FILE));
            expect(ideas[0].votes).toBe(1);
        });

        it('should return 404 if idea to vote on is not found', async () => {
            const res = await request(app).post('/api/ideas/nonexistent-id/vote');
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Idea not found');
        });
    });

    describe('POST /api/ideas/:id/notes', () => {
        it('should add a note to an existing idea', async () => {
            const initialIdea = { id: 'note-idea-id', text: 'Idea for notes', votes: 0, createdAt: Date.now(), notes: [], attachments: [] };
            fs.writeFileSync(IDEAS_FILE, JSON.stringify([initialIdea]));
            const noteText = 'This is a test note.';

            const res = await request(app)
                .post(`/api/ideas/${initialIdea.id}/notes`)
                .send({ noteText });

            expect(res.statusCode).toEqual(201);
            expect(res.body.text).toBe(noteText);
            expect(res.body.id).toBeDefined();
            expect(res.body.createdAt).toBeDefined();

            const ideas = JSON.parse(fs.readFileSync(IDEAS_FILE));
            expect(ideas[0].notes.length).toBe(1);
            expect(ideas[0].notes[0].text).toBe(noteText);
        });

        it('should return 400 if note text is missing', async () => {
            const initialIdea = { id: 'note-idea-id-2', text: 'Idea for notes 2', votes: 0, createdAt: Date.now(), notes: [], attachments: [] };
            fs.writeFileSync(IDEAS_FILE, JSON.stringify([initialIdea]));

            const res = await request(app)
                .post(`/api/ideas/${initialIdea.id}/notes`)
                .send({});
            expect(res.statusCode).toEqual(400);
            expect(res.body.message).toBe('Note text is required');
        });

        it('should return 404 if idea to add note to is not found', async () => {
            const res = await request(app)
                .post('/api/ideas/nonexistent-id/notes')
                .send({ noteText: 'A note for no one' });
            expect(res.statusCode).toEqual(404);
            expect(res.body.message).toBe('Idea not found');
        });
    });
});