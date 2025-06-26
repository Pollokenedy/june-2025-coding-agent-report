const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Mock the mongoose connection
jest.mock('mongoose');

beforeAll(async () => {
    // Connect to in-memory MongoDB instance for testing
    await mongoose.connect('mongodb://localhost:27018/idea-collector-test');
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Idea API', () => {
    let ideaId;

    beforeEach(async () => {
        // Clear the database before each test
        await mongoose.connection.db.dropDatabase();
    });

    it('should create a new idea', async () => {
        const idea = {
            title: 'Test Idea',
            description: 'This is a test idea'
        };

        const response = await request(app)
            .post('/ideas')
            .send(idea)
            .expect(201);

        expect(response.body.title).toBe(idea.title);
        expect(response.body.description).toBe(idea.description);
        expect(response.body.votes).toBe(0);
        ideaId = response.body._id;
    });

    it('should get all ideas sorted by votes', async () => {
        // Create two ideas with different votes
        await request(app)
            .post('/ideas')
            .send({ title: 'Idea 1', description: 'First idea' })
            .expect(201);

        await request(app)
            .post('/ideas')
            .send({ title: 'Idea 2', description: 'Second idea' })
            .expect(201);

        // Vote for the second idea
        await request(app)
            .post('/ideas/648181818181818181818182/vote')
            .expect(200);

        const response = await request(app)
            .get('/ideas')
            .expect(200);

        // Verify ideas are sorted by votes
        expect(response.body[0].votes).toBeGreaterThan(response.body[1].votes);
    });

    it('should add a vote to an idea', async () => {
        // First create an idea
        const response = await request(app)
            .post('/ideas')
            .send({ title: 'Test Idea', description: 'Test description' })
            .expect(201);

        const ideaId = response.body._id;

        // Add a vote
        const voteResponse = await request(app)
            .post(`/ideas/${ideaId}/vote`)
            .expect(200);

        expect(voteResponse.body.votes).toBe(1);
    });

    it('should add a note to an idea', async () => {
        // First create an idea
        const response = await request(app)
            .post('/ideas')
            .send({ title: 'Test Idea', description: 'Test description' })
            .expect(201);

        const ideaId = response.body._id;

        // Add a note
        const noteResponse = await request(app)
            .post(`/ideas/${ideaId}/notes`)
            .field('content', 'Test note')
            .attach('attachment', 'test.txt')
            .expect(200);

        expect(noteResponse.body.notes[0].content).toBe('Test note');
        expect(noteResponse.body.notes[0].attachment).toBeDefined();
    });
});
