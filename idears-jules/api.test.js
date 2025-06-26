const request = require('supertest');
const fs = require('fs');
const path = require('path');
const { app, server } = require('./server'); // Assuming server.js exports app and server for testing
const { saveIdeas } = require('./storage'); // To directly manipulate ideas.json for setup

const dataDir = path.join(__dirname, 'data');
const ideasFilePath = path.join(dataDir, 'ideas.json');
const uploadDir = path.join(dataDir, 'uploads');

// Helper function to reset ideas.json
const resetIdeasFile = (ideas = []) => {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(ideasFilePath, JSON.stringify(ideas, null, 2), 'utf8');
};

// Helper function to clean up uploads directory
const cleanupUploads = () => {
    if (fs.existsSync(uploadDir)) {
        fs.readdirSync(uploadDir).forEach(file => {
            fs.unlinkSync(path.join(uploadDir, file));
        });
        // fs.rmdirSync(uploadDir); // Remove if not needed between test suites
    }
};

// Ensure server is closed after all tests
afterAll((done) => {
    server.close(done);
    cleanupUploads(); // Clean up any created uploads
});

describe('Idea API Endpoints', () => {
    beforeEach(() => {
        resetIdeasFile(); // Reset ideas before each test
        cleanupUploads(); // Clean uploads before each test
        // Ensure uploadDir exists for tests that need it
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
    });

    describe('POST /ideas', () => {
        it('should create a new idea and save it', async () => {
            const response = await request(app)
                .post('/ideas')
                .send({ text: 'Test Idea 1' });

            expect(response.statusCode).toBe(201);
            expect(response.body.text).toBe('Test Idea 1');
            expect(response.body.votes).toBe(0);
            expect(response.body.notes).toEqual([]);
            expect(response.body.attachments).toEqual([]);
            expect(response.body.id).toBeDefined();

            const ideas = JSON.parse(fs.readFileSync(ideasFilePath, 'utf8'));
            expect(ideas.length).toBe(1);
            expect(ideas[0].text).toBe('Test Idea 1');
        });

        it('should return 400 if text is missing', async () => {
            const response = await request(app)
                .post('/ideas')
                .send({});
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Text is required');
        });
    });

    describe('GET /ideas', () => {
        it('should return an empty array if no ideas exist', async () => {
            const response = await request(app).get('/ideas');
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual([]);
        });

        it('should return ideas sorted by votes (descending)', async () => {
            const testIdeas = [
                { id: '1', text: 'Idea A', votes: 1, notes:[], attachments:[], createdAt: new Date(), updatedAt: new Date() },
                { id: '2', text: 'Idea B', votes: 3, notes:[], attachments:[], createdAt: new Date(), updatedAt: new Date() },
                { id: '3', text: 'Idea C', votes: 0, notes:[], attachments:[], createdAt: new Date(), updatedAt: new Date() },
            ];
            resetIdeasFile(testIdeas);

            const response = await request(app).get('/ideas');
            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBe(3);
            expect(response.body[0].text).toBe('Idea B');
            expect(response.body[1].text).toBe('Idea A');
            expect(response.body[2].text).toBe('Idea C');
        });
    });

    describe('POST /ideas/:id/vote', () => {
        it('should increment vote for an existing idea', async () => {
            const initialIdea = { id: 'vote-test-id', text: 'Vote Idea', votes: 0, notes:[], attachments:[], createdAt: new Date(), updatedAt: new Date() };
            resetIdeasFile([initialIdea]);

            const response = await request(app).post(`/ideas/${initialIdea.id}/vote`);
            expect(response.statusCode).toBe(200);
            expect(response.body.votes).toBe(1);
            expect(response.body.id).toBe(initialIdea.id);

            const ideas = JSON.parse(fs.readFileSync(ideasFilePath, 'utf8'));
            expect(ideas[0].votes).toBe(1);
        });

        it('should return 404 if idea not found', async () => {
            const response = await request(app).post('/ideas/non-existent-id/vote');
            expect(response.statusCode).toBe(404);
            expect(response.body.error).toBe('Idea not found');
        });
    });

    describe('POST /ideas/:id/notes', () => {
        const noteIdea = { id: 'note-test-id', text: 'Note Idea', votes: 0, notes: [], attachments:[], createdAt: new Date(), updatedAt: new Date() };

        beforeEach(() => {
             resetIdeasFile([noteIdea]);
        });

        it('should add a note to an existing idea', async () => {
            const response = await request(app)
                .post(`/ideas/${noteIdea.id}/notes`)
                .send({ note: 'This is a test note.' });

            expect(response.statusCode).toBe(200);
            expect(response.body.notes).toContain('This is a test note.');
            expect(response.body.id).toBe(noteIdea.id);

            const ideas = JSON.parse(fs.readFileSync(ideasFilePath, 'utf8'));
            expect(ideas[0].notes).toContain('This is a test note.');
        });

        it('should return 404 if idea not found', async () => {
            const response = await request(app)
                .post('/ideas/non-existent-id/notes')
                .send({ note: 'Test note' });
            expect(response.statusCode).toBe(404);
        });

        it('should return 400 if note text is missing', async () => {
            const response = await request(app)
                .post(`/ideas/${noteIdea.id}/notes`)
                .send({});
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('Note text is required');
        });
    });

    describe('POST /ideas/:id/attachments', () => {
        const attachmentIdea = { id: 'attachment-test-id', text: 'Attachment Idea', votes: 0, notes: [], attachments: [], createdAt: new Date(), updatedAt: new Date() };
        const testFilePath = path.join(__dirname, 'test-attachment.txt');

        beforeAll(() => {
            // Create a dummy file for upload tests
            fs.writeFileSync(testFilePath, 'This is a test attachment.');
        });

        afterAll(() => {
            // Clean up the dummy file
            if (fs.existsSync(testFilePath)) {
                fs.unlinkSync(testFilePath);
            }
        });

        beforeEach(() => {
             resetIdeasFile([attachmentIdea]);
        });

        it('should upload an attachment and update idea metadata', async () => {
            const response = await request(app)
                .post(`/ideas/${attachmentIdea.id}/attachments`)
                .attach('attachmentFile', testFilePath);

            expect(response.statusCode).toBe(200);
            expect(response.body.attachments.length).toBe(1);
            const attachment = response.body.attachments[0];
            expect(attachment.filename).toBe('test-attachment.txt');
            expect(attachment.mimetype).toBe('text/plain');
            expect(attachment.filepath).toMatch(/data(\/|\\)uploads(\/|\\).*-test-attachment.txt$/);

            const ideas = JSON.parse(fs.readFileSync(ideasFilePath, 'utf8'));
            expect(ideas[0].attachments.length).toBe(1);
            expect(ideas[0].attachments[0].filename).toBe('test-attachment.txt');

            // Check if file exists in uploads
            const uploadedFilePath = path.join(uploadDir, attachment.filepath.split(path.sep).pop());
            expect(fs.existsSync(uploadedFilePath)).toBe(true);
        });

        it('should return 404 if idea not found', async () => {
            const response = await request(app)
                .post('/ideas/non-existent-id/attachments')
                .attach('attachmentFile', testFilePath);
            expect(response.statusCode).toBe(404);
             // Check that the file was deleted if multer saved it before the 404
            const filesInUpload = fs.readdirSync(uploadDir);
            expect(filesInUpload.filter(f => f.endsWith('test-attachment.txt')).length).toBe(0);
        });

        it('should return 400 if no file is attached', async () => {
            const response = await request(app)
                .post(`/ideas/${attachmentIdea.id}/attachments`);
                // Not attaching a file
            expect(response.statusCode).toBe(400);
            expect(response.body.error).toBe('File attachment is required');
        });
    });
});
