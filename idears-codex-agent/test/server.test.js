const request = require('supertest');
const fs = require('fs');
const path = require('path');
let app;

beforeAll(() => {
  if (fs.existsSync('data.db')) fs.unlinkSync('data.db');
  app = require('../server');
});

afterAll(done => {
  app.close && app.close();
  done();
});

test('create and list ideas', async () => {
  const res = await request(app)
    .post('/ideas')
    .field('title', 'First Idea')
    .field('notes', 'Some notes');
  expect(res.statusCode).toBe(200);
  const list = await request(app).get('/ideas');
  expect(list.body.length).toBeGreaterThan(0);
});

test('vote idea moves it up', async () => {
  const { body } = await request(app)
    .post('/ideas')
    .field('title', 'Second Idea');
  const id = body.id;
  await request(app).post(`/ideas/${id}/vote`);
  const list = await request(app).get('/ideas');
  expect(list.body[0].id).toBe(id);
});
