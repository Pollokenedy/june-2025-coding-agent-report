const request = require('supertest');
const path = require('path');
const fs = require('fs');
const os = require('os');

process.env.DATA_DIR = path.join(os.tmpdir(), 'ideas-test-data');

const app = require('../src/index');

describe('Notes API', () => {
  it('should add a note without attachments', async () => {
    const resIdea = await request(app).post('/api/ideas').send({ title: 'NoteIdea' });
    const id = resIdea.body.idea.id;
    const res = await request(app)
      .post(`/api/ideas/${id}/notes`)
      .send({ text: 'This is a note' });
    expect(res.statusCode).toBe(201);
    expect(res.body.note).toHaveProperty('id');
    expect(res.body.note.text).toBe('This is a note');
    expect(res.body.note.attachments).toEqual([]);
  });

  it('should add a note with file attachments', async () => {
    const resIdea = await request(app).post('/api/ideas').send({ title: 'NoteIdea2' });
    const id = resIdea.body.idea.id;

    const filePath = path.join(os.tmpdir(), 'test-file.txt');
    fs.writeFileSync(filePath, 'hello world');

    const res = await request(app)
      .post(`/api/ideas/${id}/notes`)
      .field('text', 'With file')
      .attach('attachments', filePath);
    expect(res.statusCode).toBe(201);
    expect(res.body.note.attachments.length).toBe(1);
    expect(res.body.note.attachments[0].originalname).toBe('test-file.txt');

    fs.unlinkSync(filePath);
  });

  it('should get notes for an idea', async () => {
    const resIdea = await request(app).post('/api/ideas').send({ title: 'GetNotesIdea' });
    const id = resIdea.body.idea.id;
    await request(app).post(`/api/ideas/${id}/notes`).send({ text: 'Note1' });
    const res = await request(app).get(`/api/ideas/${id}/notes`);
    expect(res.statusCode).toBe(200);
    expect(res.body.notes.length).toBe(1);
  });
});