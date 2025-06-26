import request from 'supertest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import app from './index.js';
import { test, expect, beforeAll, afterAll, describe } from '@jest/globals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;

beforeAll(async () => {
  // Start the server on a different port for testing
  process.env.PORT = 4000;
  server = app.listen(4000);
  // Wait for DB to initialize
  await new Promise(r => setTimeout(r, 500));
});

afterAll(async () => {
  if (server && server.close) server.close();
  // Clean up test db and uploads
  const dbPath = path.join(__dirname, 'db.json');
  if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
  const uploadDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadDir)) {
    fs.readdirSync(uploadDir).forEach(f => fs.unlinkSync(path.join(uploadDir, f)));
    fs.rmdirSync(uploadDir);
  }
});

describe('Ideas API', () => {
  let ideaId;

  test('should add a new idea', async () => {
    const res = await request('http://localhost:4000')
      .post('/ideas')
      .send({ title: 'Test Idea', notes: 'Initial notes' });
    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Test Idea');
    ideaId = res.body.id;
  });

  test('should get all ideas', async () => {
    const res = await request('http://localhost:4000').get('/ideas');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe(ideaId);
  });

  test('should vote for an idea', async () => {
    const res = await request('http://localhost:4000').post(`/ideas/${ideaId}/vote`);
    expect(res.statusCode).toBe(200);
    expect(res.body.votes).toBe(1);
  });

  test('should update notes for an idea', async () => {
    const res = await request('http://localhost:4000')
      .post(`/ideas/${ideaId}/notes`)
      .send({ notes: 'Updated notes' });
    expect(res.statusCode).toBe(200);
    expect(res.body.notes).toBe('Updated notes');
  });

  test('should upload a file to an idea', async () => {
    const res = await request('http://localhost:4000')
      .post(`/ideas/${ideaId}/files`)
      .attach('file', Buffer.from('test file content'), 'test.txt');
    expect(res.statusCode).toBe(201);
    expect(res.body.filename).toBe('test.txt');
    expect(res.body.url).toMatch(/\/uploads\//);
  });
}); 